"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  updateProfilMandiriSchema,
  gantiKataSandiSchema,
} from "@/lib/validations/auth";

export interface ProfilMandiriData {
  id: string;
  email: string;
  nama_lengkap: string;
  role: string;
  status: string;
}

/**
 * Mengambil data profil akun pengguna yang sedang aktif login
 */
export async function getProfilMandiriAction(): Promise<{
  data?: ProfilMandiriData;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Gagal mengambil data profil." };
  }

  return {
    data: {
      id: profile.id,
      email: user.email || "-",
      nama_lengkap: profile.nama_lengkap,
      role: profile.role,
      status: profile.status,
    },
  };
}

/**
 * Memperbarui nama lengkap akun sendiri.
 * Email dan peran bersifat tetap (read-only) untuk alur mandiri ini.
 */
export async function updateProfilMandiriAction(formData: FormData) {
  const nama_lengkap = (formData.get("nama_lengkap") as string)?.trim();

  const parsed = updateProfilMandiriSchema.safeParse({ nama_lengkap });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Data profil tidak valid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  // Update di tabel profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ nama_lengkap: parsed.data.nama_lengkap })
    .eq("id", user.id);

  if (updateError) {
    console.error("Gagal update profiles mandiri:", updateError);
    return { error: "Gagal memperbarui profil." };
  }

  // Update user_metadata di auth.users via admin client agar sinkron
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        nama_lengkap: parsed.data.nama_lengkap,
      },
    });
  } catch (err) {
    console.warn("Gagal update user_metadata auth mandiri:", err);
  }

  revalidatePath("/admin/pengaturan-akun");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Mengganti kata sandi akun sendiri secara langsung.
 * Mewajibkan verifikasi kata sandi saat ini / lama.
 */
export async function gantiKataSandiMandiriAction(formData: FormData) {
  const kata_sandi_lama = formData.get("kata_sandi_lama") as string;
  const kata_sandi_baru = formData.get("kata_sandi_baru") as string;
  const konfirmasi_kata_sandi_baru = formData.get(
    "konfirmasi_kata_sandi_baru"
  ) as string;

  const parsed = gantiKataSandiSchema.safeParse({
    kata_sandi_lama,
    kata_sandi_baru,
    konfirmasi_kata_sandi_baru,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Data kata sandi tidak valid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Anda belum login." };
  }

  // 1. Verifikasi kata sandi lama via signIn
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.kata_sandi_lama,
  });

  if (verifyError) {
    return { error: "Kata sandi saat ini yang Anda masukkan tidak sesuai." };
  }

  // 2. Jika valid, update ke kata sandi baru
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.kata_sandi_baru,
  });

  if (updateError) {
    console.error("Gagal mengubah kata sandi mandiri:", updateError);
    return {
      error: "Gagal memperbarui kata sandi. Silakan coba beberapa saat lagi.",
    };
  }

  return { success: true };
}
