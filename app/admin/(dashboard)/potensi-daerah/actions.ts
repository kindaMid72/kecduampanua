"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { potensiDaerahSchema } from "@/lib/validations/potensi-daerah";
import { deleteStorageFile } from "@/lib/supabase/storage";

export async function createPotensiAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || undefined,
    kategori: formData.get("kategori"),
    deskripsi: formData.get("deskripsi"),
    deskripsi_en: formData.get("deskripsi_en") || undefined,
    lokasi: formData.get("lokasi") || undefined,
    gambar_url: formData.get("gambar_url") || undefined,
    status: formData.get("status") || "published",
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const parsed = potensiDaerahSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("potensi_daerah").insert({
    ...parsed.data,
    dibuat_oleh: user.id,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data." };
  }

  revalidatePath("/admin/potensi-daerah");
  revalidatePath("/potensi");
  revalidatePath("/");
  redirect("/admin/potensi-daerah");
}

export async function updatePotensiAction(id: string, formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || undefined,
    kategori: formData.get("kategori"),
    deskripsi: formData.get("deskripsi"),
    deskripsi_en: formData.get("deskripsi_en") || undefined,
    lokasi: formData.get("lokasi") || undefined,
    gambar_url: formData.get("gambar_url") || undefined,
    status: formData.get("status") || "published",
    urutan: parseInt(formData.get("urutan") as string) || 0,
  };

  const parsed = potensiDaerahSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("potensi_daerah")
    .select("gambar_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("potensi_daerah").update(parsed.data).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  if (oldData?.gambar_url && oldData.gambar_url !== parsed.data.gambar_url) {
    await deleteStorageFile(supabase, oldData.gambar_url);
  }

  revalidatePath("/admin/potensi-daerah");
  revalidatePath("/potensi");
  revalidatePath("/");
  redirect("/admin/potensi-daerah");
}

export async function deletePotensiAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("potensi_daerah")
    .select("gambar_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("potensi_daerah").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  if (oldData?.gambar_url) {
    await deleteStorageFile(supabase, oldData.gambar_url);
  }

  revalidatePath("/admin/potensi-daerah");
  revalidatePath("/potensi");
  revalidatePath("/");
  redirect("/admin/potensi-daerah");
}
