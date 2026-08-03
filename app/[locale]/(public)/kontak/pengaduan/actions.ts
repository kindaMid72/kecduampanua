"use server";

import { createClient } from "@/lib/supabase/server";
import { pengaduanPublikSchema } from "@/lib/validations/pengaduan";
import { randomBytes } from "crypto";
import { headers } from "next/headers";

// Simple in-memory store for rate limiting (Note: resets on server restart/serverless cold start, 
// but sufficient as a basic defense mechanism alongside honeypot)
const rateLimitMap = new Map<string, number>();

export async function submitPengaduanAction(formData: FormData) {
  // Rate Limiting Check (Max 3 requests per IP per 10 minutes)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    
    if (lastRequest && now - lastRequest < 10 * 60 * 1000) {
      // Allow only if they haven't submitted in the last 10 minutes
      // We can also implement a counter here, but time-based is simpler for this scope
      return { error: "Anda mengirim terlalu banyak pengaduan. Silakan tunggu 10 menit lagi." };
    }
    
    rateLimitMap.set(ip, now);
  }
  const raw = {
    nama_pelapor: formData.get("nama_pelapor"),
    kontak_pelapor: formData.get("kontak_pelapor"),
    kategori: formData.get("kategori"),
    deskripsi: formData.get("deskripsi"),
    setuju_data_pribadi: formData.get("setuju_data_pribadi") === "true",
    honeypot: formData.get("honeypot") || "",
  };

  const parsed = pengaduanPublikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Honeypot check
  if (parsed.data.honeypot !== "") {
    // Silently return success to fool bots
    return { success: true, trackingId: "PND-12345678" };
  }

  const supabase = await createClient();

  // Generate unique tracking number (e.g. PND-8A7B6C)
  const generateTrackingId = () => {
    return `PND-${randomBytes(4).toString("hex").toUpperCase()}`;
  };

  let trackingId = generateTrackingId();
  let unique = false;
  let attempts = 0;

  // Ensure uniqueness
  while (!unique && attempts < 5) {
    const { data } = await supabase.from("pengaduan").select("id").eq("nomor_tracking", trackingId).single();
    if (!data) {
      unique = true;
    } else {
      trackingId = generateTrackingId();
      attempts++;
    }
  }

  if (!unique) {
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  const { error } = await supabase.from("pengaduan").insert({
    nomor_tracking: trackingId,
    nama_pelapor: parsed.data.nama_pelapor,
    kontak_pelapor: parsed.data.kontak_pelapor,
    kategori: parsed.data.kategori,
    deskripsi: parsed.data.deskripsi,
    setuju_data_pribadi: parsed.data.setuju_data_pribadi,
    status: "baru",
  });

  if (error) {
    console.error(error);
    return { error: "Gagal mengirim pengaduan. Silakan coba lagi nanti." };
  }

  return { success: true, trackingId };
}
