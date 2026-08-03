"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { edaranDokumenSchema } from "@/lib/validations/edaran-dokumen";

export async function createEdaranAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    nomor_surat: formData.get("nomor_surat") || undefined,
    kategori: formData.get("kategori") || undefined,
    deskripsi: formData.get("deskripsi"),
    file_url: formData.get("file_url"),
    tanggal_terbit: formData.get("tanggal_terbit"),
  };

  const parsed = edaranDokumenSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("dokumen_edaran").insert({
    ...parsed.data,
    diunggah_oleh: user.id,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data." };
  }

  revalidatePath("/admin/edaran-dokumen");
  revalidatePath("/edaran-dokumen");
  redirect("/admin/edaran-dokumen");
}

export async function updateEdaranAction(id: string, formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    nomor_surat: formData.get("nomor_surat") || undefined,
    kategori: formData.get("kategori") || undefined,
    deskripsi: formData.get("deskripsi"),
    file_url: formData.get("file_url"),
    tanggal_terbit: formData.get("tanggal_terbit"),
  };

  const parsed = edaranDokumenSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("dokumen_edaran").update(parsed.data).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  revalidatePath("/admin/edaran-dokumen");
  revalidatePath("/edaran-dokumen");
  redirect("/admin/edaran-dokumen");
}

export async function deleteEdaranAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("dokumen_edaran").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  revalidatePath("/admin/edaran-dokumen");
  revalidatePath("/edaran-dokumen");
  redirect("/admin/edaran-dokumen");
}
