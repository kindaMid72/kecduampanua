"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { informasiPublikSchema } from "@/lib/validations/informasi-publik";

export async function createInformasiAction(formData: FormData) {
  const raw = {
    judul: formData.get("judul"),
    kategori: formData.get("kategori"),
    konten: formData.get("konten"),
    tanggal_acara: formData.get("tanggal_acara") || null,
    lokasi: formData.get("lokasi") || null,
    gambar_cover_url: formData.get("gambar_cover_url") || null,
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

  // Coba translate konten dan judul ke EN
  let judul_en = null;
  let konten_en = null;
  
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const jRes = await fetch("http://localhost:3000/api/translate", {
        method: "POST",
        body: JSON.stringify({ text: parsed.data.judul, target: "en" })
      });
      const jData = await jRes.json();
      if (jData.translated) judul_en = jData.translated;

      const cRes = await fetch("http://localhost:3000/api/translate", {
        method: "POST",
        body: JSON.stringify({ text: parsed.data.konten, target: "en" })
      });
      const cData = await cRes.json();
      if (cData.translated) konten_en = cData.translated;
    } catch {
      // ignore
    }
  }

  const slug = parsed.data.judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const { error } = await supabase.from("informasi_publik").insert({
    ...parsed.data,
    judul_en,
    konten_en,
    slug: `${slug}-${Date.now()}`,
    dibuat_oleh: user.id,
    status: "published", // Default publish (MVP)
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
    kategori: formData.get("kategori"),
    konten: formData.get("konten"),
    tanggal_acara: formData.get("tanggal_acara") || null,
    lokasi: formData.get("lokasi") || null,
    gambar_cover_url: formData.get("gambar_cover_url") || null,
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

  // Simplified: no re-translate on update for MVP unless explicit.
  const { error } = await supabase.from("informasi_publik").update({
    ...parsed.data,
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
