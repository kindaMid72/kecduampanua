"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pengaduanPublikSchema } from "@/lib/validations/pengaduan";
import { randomBytes } from "crypto";
import { headers } from "next/headers";

/**
 * VULN-05 fix: Rate limiter persisten berbasis tabel Supabase.
 * Menggantikan in-memory Map yang di-reset setiap cold start serverless
 * dan mudah di-bypass dengan spoofing X-Forwarded-For.
 *
 * Maksimum 3 request per IP per window 10 menit.
 * Menggunakan x-real-ip (di-set oleh Vercel, tidak bisa di-spoof).
 */
async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      client_ip: ip,
      max_hits: 3,
      window_minutes: 10,
    });

    if (error) {
      // Jika tabel/RPC belum ada atau DB error — fail-open agar publik tidak terblokir
      console.error("[rate_limit] RPC error:", error);
      return { allowed: true };
    }

    return { allowed: data === true };
  } catch (err) {
    console.error("[rate_limit] Unexpected error:", err);
    return { allowed: true }; // fail-open untuk publik
  }
}

export async function submitPengaduanAction(formData: FormData) {
  const headersList = await headers();

  // VULN-05 fix: Gunakan x-real-ip (Vercel-controlled, tidak bisa di-spoof),
  // bukan x-forwarded-for yang bisa dimanipulasi oleh pemanggil.
  const ip =
    headersList.get("x-real-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (ip !== "unknown") {
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return {
        error:
          "Anda mengirim terlalu banyak pengaduan. Silakan tunggu 10 menit.",
      };
    }
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
