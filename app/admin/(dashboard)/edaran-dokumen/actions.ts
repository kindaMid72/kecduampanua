"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { edaranDokumenSchema } from "@/lib/validations/edaran-dokumen";

export async function createEdaranAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || undefined,
    nomor_dokumen: formData.get("nomor_dokumen") || undefined,
    kategori: formData.get("kategori"),
    file_url: formData.get("file_url"),
    status: formData.get("status") || "published",
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

  const { error } = await supabase.from("edaran_dokumen").insert({
    ...parsed.data,
    dibuat_oleh: user.id,
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
    judul_en: formData.get("judul_en") || undefined,
    nomor_dokumen: formData.get("nomor_dokumen") || undefined,
    kategori: formData.get("kategori"),
    file_url: formData.get("file_url"),
    status: formData.get("status") || "published",
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

  const { error } = await supabase.from("edaran_dokumen").update(parsed.data).eq("id", id);

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

  const { error } = await supabase.from("edaran_dokumen").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  revalidatePath("/admin/edaran-dokumen");
  revalidatePath("/edaran-dokumen");
  redirect("/admin/edaran-dokumen");
}
