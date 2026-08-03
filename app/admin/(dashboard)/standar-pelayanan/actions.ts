"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { layananSchema } from "@/lib/validations/standar-pelayanan";

export async function createLayananAction(formData: FormData) {
  const rawSyarat = formData.getAll("syarat_dokumen");
  const raw = {
    nama_layanan: formData.get("nama_layanan"),
    nama_layanan_en: formData.get("nama_layanan_en") || null,
    deskripsi: formData.get("deskripsi") || null,
    deskripsi_en: formData.get("deskripsi_en") || null,
    syarat_dokumen: rawSyarat.map(s => String(s)).filter(s => s.trim() !== ""),
    alur_proses: formData.get("alur_proses") || null,
    alur_proses_en: formData.get("alur_proses_en") || null,
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

  const { error } = await supabase.from("layanan").insert({
    nama_layanan: parsed.data.nama_layanan,
    nama_layanan_en: parsed.data.nama_layanan_en || null,
    deskripsi: parsed.data.deskripsi || null,
    deskripsi_en: parsed.data.deskripsi_en || null,
    syarat_dokumen: parsed.data.syarat_dokumen,
    alur_proses: parsed.data.alur_proses || null,
    alur_proses_en: parsed.data.alur_proses_en || null,
    estimasi_waktu: parsed.data.estimasi_waktu || null,
    link_formulir_url: parsed.data.link_formulir_url || null,
    dokumen_standar_pelayanan_url: parsed.data.dokumen_standar_pelayanan_url || null,
    status: parsed.data.status,
    urutan: parsed.data.urutan,
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
    nama_layanan_en: formData.get("nama_layanan_en") || null,
    deskripsi: formData.get("deskripsi") || null,
    deskripsi_en: formData.get("deskripsi_en") || null,
    syarat_dokumen: rawSyarat.map(s => String(s)).filter(s => s.trim() !== ""),
    alur_proses: formData.get("alur_proses") || null,
    alur_proses_en: formData.get("alur_proses_en") || null,
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
    nama_layanan: parsed.data.nama_layanan,
    nama_layanan_en: parsed.data.nama_layanan_en || null,
    deskripsi: parsed.data.deskripsi || null,
    deskripsi_en: parsed.data.deskripsi_en || null,
    syarat_dokumen: parsed.data.syarat_dokumen,
    alur_proses: parsed.data.alur_proses || null,
    alur_proses_en: parsed.data.alur_proses_en || null,
    estimasi_waktu: parsed.data.estimasi_waktu || null,
    link_formulir_url: parsed.data.link_formulir_url || null,
    dokumen_standar_pelayanan_url: parsed.data.dokumen_standar_pelayanan_url || null,
    status: parsed.data.status,
    urutan: parsed.data.urutan,
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

export async function deleteLayananAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("layanan").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  revalidatePath("/admin/standar-pelayanan");
  revalidatePath("/standar-pelayanan");
  revalidatePath("/");
  redirect("/admin/standar-pelayanan");
}
