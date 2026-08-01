"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { layananSchema } from "@/lib/validations/standar-pelayanan";

export async function createLayananAction(formData: FormData) {
  const rawSyarat = formData.getAll("syarat_dokumen");
  const raw = {
    nama_layanan: formData.get("nama_layanan"),
    deskripsi: formData.get("deskripsi") || null,
    syarat_dokumen: rawSyarat.map(s => String(s)).filter(s => s.trim() !== ""),
    alur_proses: formData.get("alur_proses") || null,
    estimasi_waktu: formData.get("estimasi_waktu") || null,
    link_formulir_url: formData.get("link_formulir_url") || null,
    dokumen_standar_pelayanan_url: formData.get("dokumen_standar_pelayanan_url") || null,
    status: formData.get("status") || "aktif",
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const parsed = layananSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  // Auto-translate to EN best-effort
  let nama_layanan_en = null;
  let deskripsi_en = null;
  let alur_proses_en = null;
  let syarat_dokumen_en = null;

  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const trans = async (text: string) => {
        const res = await fetch("http://localhost:3000/api/translate", {
          method: "POST",
          body: JSON.stringify({ text, target: "en" })
        });
        const data = await res.json();
        return data.translated;
      };

      if (parsed.data.nama_layanan) nama_layanan_en = await trans(parsed.data.nama_layanan);
      if (parsed.data.deskripsi) deskripsi_en = await trans(parsed.data.deskripsi);
      if (parsed.data.alur_proses) alur_proses_en = await trans(parsed.data.alur_proses);
      
      if (parsed.data.syarat_dokumen && parsed.data.syarat_dokumen.length > 0) {
        syarat_dokumen_en = await Promise.all(parsed.data.syarat_dokumen.map(s => trans(s)));
      }
    } catch {
      // ignore
    }
  }

  const { error } = await supabase.from("layanan").insert({
    ...parsed.data,
    nama_layanan_en,
    deskripsi_en,
    alur_proses_en,
    syarat_dokumen_en,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data." };
  }

  revalidatePath("/admin/standar-pelayanan");
  revalidatePath("/standar-pelayanan");
  revalidatePath("/");
  redirect("/admin/standar-pelayanan");
}

export async function updateLayananAction(id: string, formData: FormData) {
  const rawSyarat = formData.getAll("syarat_dokumen");
  const raw = {
    nama_layanan: formData.get("nama_layanan"),
    deskripsi: formData.get("deskripsi") || null,
    syarat_dokumen: rawSyarat.map(s => String(s)).filter(s => s.trim() !== ""),
    alur_proses: formData.get("alur_proses") || null,
    estimasi_waktu: formData.get("estimasi_waktu") || null,
    link_formulir_url: formData.get("link_formulir_url") || null,
    dokumen_standar_pelayanan_url: formData.get("dokumen_standar_pelayanan_url") || null,
    status: formData.get("status") || "aktif",
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const parsed = layananSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("layanan").update({
    ...parsed.data,
  }).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  revalidatePath("/admin/standar-pelayanan");
  revalidatePath("/standar-pelayanan");
  revalidatePath("/");
  redirect("/admin/standar-pelayanan");
}
