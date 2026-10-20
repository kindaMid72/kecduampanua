"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteStorageFile } from "@/lib/supabase/storage";
import { pejabatSchema, profilKecamatanSchema } from "@/lib/validations/profil";

// FormData berisi File dan string. Hanya string yang dipakai; field yang hilang jadi "".
function formSebagaiTeks(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""])
  );
}

export async function updateProfilAction(formData: FormData) {
  const parsed = profilKecamatanSchema.safeParse(formSebagaiTeks(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
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
        .update(parsed.data)
        .eq("id", existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("profil_kecamatan")
        .insert(parsed.data);
      error = insertError;
    }

    if (error) {
      console.error("[profil] simpan gagal:", error.code, error.message);
      return { error: "Gagal menyimpan data profil." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[profil] error tak terduga:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}

export async function createPejabatAction(formData: FormData) {
  const parsed = pejabatSchema.safeParse(formSebagaiTeks(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Anda belum login." };
    }

    const { error } = await supabase.from("struktur_organisasi").insert(parsed.data);
    if (error) {
      console.error("[pejabat] tambah gagal:", error.code, error.message);
      return { error: "Gagal menyimpan pejabat." };
    }

    revalidatePath("/admin/profil");
    revalidatePath("/profil");
    return { success: true };
  } catch (err) {
    console.error("[pejabat] error tak terduga:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}

export async function updatePejabatAction(id: string, formData: FormData) {
  const parsed = pejabatSchema.safeParse(formSebagaiTeks(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
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

    const { error } = await supabase.from("struktur_organisasi").update(parsed.data).eq("id", id);
    if (error) {
      console.error("[pejabat] ubah gagal:", error.code, error.message);
      return { error: "Gagal memperbarui pejabat." };
    }

    if (oldData?.foto_url && oldData.foto_url !== parsed.data.foto_url) {
      await deleteStorageFile(supabase, oldData.foto_url);
    }

    revalidatePath("/admin/profil");
    revalidatePath("/profil");
    return { success: true };
  } catch (err) {
    console.error("[pejabat] error tak terduga:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}

export async function deletePejabatAction(id: string) {
  try {
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
      console.error("[pejabat] hapus gagal:", error.code, error.message);
      return { error: "Gagal menghapus pejabat." };
    }

    if (oldData?.foto_url) {
      await deleteStorageFile(supabase, oldData.foto_url);
    }

    revalidatePath("/admin/profil");
    revalidatePath("/profil");
    return { success: true };
  } catch (err) {
    console.error("[pejabat] error tak terduga:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}
