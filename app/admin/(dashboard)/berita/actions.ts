"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beritaSchema } from "@/lib/validations/berita";

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

  const slug = parsed.data.judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const { error } = await supabase.from("berita").insert({
    judul: parsed.data.judul,
    judul_en: parsed.data.judul_en || null,
    kategori: parsed.data.kategori || null,
    konten: parsed.data.konten,
    konten_en: parsed.data.konten_en || null,
    gambar_cover_url: parsed.data.gambar_cover_url,
    slug: `${slug}-${Date.now()}`,
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

  const { error } = await supabase.from("berita").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus berita." };
  }

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/admin/berita");
}
