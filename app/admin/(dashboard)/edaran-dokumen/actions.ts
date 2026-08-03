"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { edaranDokumenSchema } from "@/lib/validations/edaran-dokumen";
import { deleteStorageFile } from "@/lib/supabase/storage";

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

  const { data: oldData } = await supabase
    .from("dokumen_edaran")
    .select("file_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("dokumen_edaran").update(parsed.data).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  if (oldData?.file_url && oldData.file_url !== parsed.data.file_url) {
    await deleteStorageFile(supabase, oldData.file_url);
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

  const { data: oldData } = await supabase
    .from("dokumen_edaran")
    .select("file_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("dokumen_edaran").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  if (oldData?.file_url) {
    await deleteStorageFile(supabase, oldData.file_url);
  }

  revalidatePath("/admin/edaran-dokumen");
  revalidatePath("/edaran-dokumen");
  redirect("/admin/edaran-dokumen");
}
