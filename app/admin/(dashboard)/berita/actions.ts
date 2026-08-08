"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beritaSchema } from "@/lib/validations/berita";
import { deleteStorageFile } from "@/lib/supabase/storage";
import { randomBytes } from "crypto";

export async function createBeritaAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || null,
    kategori: formData.get("kategori") || null,
    konten: formData.get("konten"),
    konten_en: formData.get("konten_en") || null,
    gambar_cover_url: formData.get("gambar_cover_url"),
    status: formData.get("status") || "published",
  };

  const parsed = beritaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const baseSlug = parsed.data.judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  // VULN-09 fix: Gunakan suffix acak kriptografis, bukan timestamp.
  // Timestamp (Date.now) dapat diprediksi dan dienumerasi oleh penyerang.
  const slugSuffix = randomBytes(4).toString("hex"); // 8 hex chars

  const { error } = await supabase.from("berita").insert({
    judul: parsed.data.judul,
    judul_en: parsed.data.judul_en || null,
    kategori: parsed.data.kategori || null,
    konten: parsed.data.konten,
    konten_en: parsed.data.konten_en || null,
    gambar_cover_url: parsed.data.gambar_cover_url,
    slug: `${baseSlug}-${slugSuffix}`,
    dibuat_oleh: user.id,
    status: parsed.data.status,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan berita." };
  }

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/admin/berita");
}

export async function updateBeritaAction(id: string, formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || null,
    kategori: formData.get("kategori") || null,
    konten: formData.get("konten"),
    konten_en: formData.get("konten_en") || null,
    gambar_cover_url: formData.get("gambar_cover_url"),
    status: formData.get("status") || "published",
  };

  const parsed = beritaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("berita")
    .select("gambar_cover_url")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("berita")
    .update({
      judul: parsed.data.judul,
      judul_en: parsed.data.judul_en || null,
      kategori: parsed.data.kategori || null,
      konten: parsed.data.konten,
      konten_en: parsed.data.konten_en || null,
      gambar_cover_url: parsed.data.gambar_cover_url,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui berita." };
  }

  if (oldData?.gambar_cover_url && oldData.gambar_cover_url !== parsed.data.gambar_cover_url) {
    await deleteStorageFile(supabase, oldData.gambar_cover_url);
  }

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/admin/berita");
}

export async function deleteBeritaAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: oldData } = await supabase
    .from("berita")
    .select("gambar_cover_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("berita").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus berita." };
  }

  if (oldData?.gambar_cover_url) {
    await deleteStorageFile(supabase, oldData.gambar_cover_url);
  }

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/admin/berita");
}
