"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { informasiPublikSchema } from "@/lib/validations/informasi-publik";

export async function createInformasiAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || null,
    kategori: formData.get("kategori"),
    konten: formData.get("konten"),
    konten_en: formData.get("konten_en") || null,
    tanggal_acara: formData.get("tanggal_acara") || null,
    lokasi: formData.get("lokasi") || null,
    gambar_cover_url: formData.get("gambar_cover_url") || null,
    status: formData.get("status") || "published",
  };

  const parsed = informasiPublikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const slug = parsed.data.judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const judul_en = parsed.data.judul_en || null;
  const konten_en = parsed.data.konten_en || null;

  const { error } = await supabase.from("informasi_publik").insert({
    judul: parsed.data.judul,
    judul_en,
    kategori: parsed.data.kategori,
    konten: parsed.data.konten,
    konten_en,
    tanggal_acara: parsed.data.tanggal_acara,
    lokasi: parsed.data.lokasi,
    gambar_cover_url: parsed.data.gambar_cover_url || null,
    slug: `${slug}-${Date.now()}`,
    dibuat_oleh: user.id,
    status: parsed.data.status,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data." };
  }

  revalidatePath("/admin/informasi-publik");
  revalidatePath("/informasi");
  revalidatePath("/");
  redirect("/admin/informasi-publik");
}

export async function updateInformasiAction(id: string, formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    judul_en: formData.get("judul_en") || null,
    kategori: formData.get("kategori"),
    konten: formData.get("konten"),
    konten_en: formData.get("konten_en") || null,
    tanggal_acara: formData.get("tanggal_acara") || null,
    lokasi: formData.get("lokasi") || null,
    gambar_cover_url: formData.get("gambar_cover_url") || null,
    status: formData.get("status") || "published",
  };

  const parsed = informasiPublikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("informasi_publik").update({
    judul: parsed.data.judul,
    judul_en: parsed.data.judul_en || null,
    kategori: parsed.data.kategori,
    konten: parsed.data.konten,
    konten_en: parsed.data.konten_en || null,
    tanggal_acara: parsed.data.tanggal_acara,
    lokasi: parsed.data.lokasi,
    gambar_cover_url: parsed.data.gambar_cover_url || null,
    status: parsed.data.status,
  }).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  revalidatePath("/admin/informasi-publik");
  revalidatePath("/informasi");
  revalidatePath("/");
  redirect("/admin/informasi-publik");
}

export async function deleteInformasiAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("informasi_publik").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  revalidatePath("/admin/informasi-publik");
  revalidatePath("/informasi");
  revalidatePath("/");
  redirect("/admin/informasi-publik");
}
