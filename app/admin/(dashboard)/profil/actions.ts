"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteStorageFile } from "@/lib/supabase/storage";

export async function updateProfilAction(formData: FormData) {
  const raw = {
    nama_kecamatan: formData.get("nama_kecamatan") || null,
    sejarah: formData.get("sejarah") || null,
    sejarah_en: formData.get("sejarah_en") || null,
    visi: formData.get("visi") || null,
    visi_en: formData.get("visi_en") || null,
    misi: formData.get("misi") || null,
    misi_en: formData.get("misi_en") || null,
    jumlah_asn: formData.get("jumlah_asn") ? parseInt(formData.get("jumlah_asn") as string) : null,

    // Kontak
    alamat: formData.get("alamat") || null,
    telepon: formData.get("telepon") || null,
    email: formData.get("email") || null,
    jam_operasional: formData.get("jam_operasional") || null,
    koordinat_lat: formData.get("koordinat_lat") ? parseFloat(formData.get("koordinat_lat") as string) : null,
    koordinat_lng: formData.get("koordinat_lng") ? parseFloat(formData.get("koordinat_lng") as string) : null,

    // PPID & Layanan
    ppid_dasar_hukum: formData.get("ppid_dasar_hukum") || null,
    ppid_nama_petugas: formData.get("ppid_nama_petugas") || null,
    ppid_kontak: formData.get("ppid_kontak") || null,
    ppid_jam_layanan: formData.get("ppid_jam_layanan") || null,
    maklumat_pelayanan: formData.get("maklumat_pelayanan") || null,
    maklumat_pelayanan_en: formData.get("maklumat_pelayanan_en") || null,

    // Pejabat utama — hero slide 2
    nama_pejabat_utama: formData.get("nama_pejabat_utama") || null,
    jabatan_pejabat_utama: formData.get("jabatan_pejabat_utama") || null,
    foto_pejabat_utama_url: formData.get("foto_pejabat_utama_url") || null,
    sambutan_pejabat_utama: formData.get("sambutan_pejabat_utama") || null,
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: existing } = await supabase
    .from("profil_kecamatan")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("profil_kecamatan")
      .update(raw)
      .eq("id", existing.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("profil_kecamatan")
      .insert(raw);
    error = insertError;
  }

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data profil." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function createPejabatAction(formData: FormData) {
  const raw = {
    nama_pejabat: formData.get("nama_pejabat") as string,
    jabatan: formData.get("jabatan") as string,
    foto_url: formData.get("foto_url") as string || null,
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("struktur_organisasi").insert(raw);
  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan pejabat." };
  }

  revalidatePath("/admin/profil");
  revalidatePath("/profil");
  return { success: true };
}

export async function updatePejabatAction(id: string, formData: FormData) {
  const raw = {
    nama_pejabat: formData.get("nama_pejabat") as string,
    jabatan: formData.get("jabatan") as string,
    foto_url: formData.get("foto_url") as string || null,
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("struktur_organisasi")
    .select("foto_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("struktur_organisasi").update(raw).eq("id", id);
  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui pejabat." };
  }

  if (oldData?.foto_url && oldData.foto_url !== raw.foto_url) {
    await deleteStorageFile(supabase, oldData.foto_url);
  }

  revalidatePath("/admin/profil");
  revalidatePath("/profil");
  return { success: true };
}

export async function deletePejabatAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("struktur_organisasi")
    .select("foto_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("struktur_organisasi").delete().eq("id", id);
  if (error) {
    console.error(error);
    return { error: "Gagal menghapus pejabat." };
  }

  if (oldData?.foto_url) {
    await deleteStorageFile(supabase, oldData.foto_url);
  }

  revalidatePath("/admin/profil");
  revalidatePath("/profil");
  return { success: true };
}
