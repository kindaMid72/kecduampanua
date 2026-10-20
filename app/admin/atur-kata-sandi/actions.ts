"use server";

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { setPasswordSchema } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

export type VerifikasiTokenResult = {
  valid: boolean;
  email?: string;
  nama_lengkap?: string;
  type?: "invite" | "reset_password";
  error?: string;
};

/**
 * Memverifikasi keabsahan token secara READ-ONLY tanpa membakar token dan tanpa membuat sesi login.
 * Aman dipanggil berulang kali (idempotent), tahan preview bot dan page refresh.
 */
export async function verifikasiTokenAction(rawToken: string): Promise<VerifikasiTokenResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim() === "") {
    return {
      valid: false,
      error: "Tautan tidak memiliki token yang valid. Silakan periksa kembali tautan yang Anda terima.",
    };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

    const { data: invite, error } = await supabaseAdmin
      .from("user_invitations")
      .select("id, email, nama_lengkap, role, type, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !invite) {
      return {
        valid: false,
        error: "Tautan tidak valid atau tidak ditemukan. Silakan hubungi Pengelola untuk mendapatkan tautan baru.",
      };
    }

    if (invite.used_at) {
      return {
        valid: false,
        error: "Tautan ini sudah pernah digunakan. Silakan hubungi Pengelola jika Anda perlu mengatur ulang kata sandi.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return {
        valid: false,
        error: "Tautan ini sudah kedaluwarsa. Silakan minta tautan baru kepada Pengelola.",
      };
    }

    return {
      valid: true,
      email: invite.email,
      nama_lengkap: invite.nama_lengkap,
      type: invite.type as "invite" | "reset_password",
    };
  } catch (err) {
    console.error("Error verifikasiTokenAction:", err);
    return {
      valid: false,
      error: "Terjadi kesalahan pada server saat memverifikasi tautan.",
    };
  }
}

export type SelesaikanAturKataSandiInput = {
  token: string;
  password: string;
  konfirmasi: string;
};

type InvitationRow = {
  id: string;
  email: string;
  nama_lengkap: string;
  role: string;
  type: string;
  user_id: string | null;
};

/**
 * Cari akun auth berdasarkan email. listUsers() dipaginasi karena halaman default-nya
 * hanya 50 pengguna; tanpa paginasi, akun di luar halaman pertama tidak ketemu.
 */
async function cariUserAuthByEmail(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ user: { id: string } | null; error: boolean }> {
  const perPage = 200;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return { user: null, error: true };

    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return { user: found, error: false };
    if (data.users.length < perPage) break;
  }
  return { user: null, error: false };
}

async function ambilStatusProfil(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  return data?.status ?? null;
}

/**
 * Menerapkan kata sandi baru sesuai jenis tautan. Dipanggil hanya setelah token diklaim.
 * Akun yang sudah nonaktif TIDAK boleh diaktifkan kembali lewat tautan; itu wewenang Pengelola
 * (ubah status pengguna), bukan tautan sekali pakai.
 */
async function terapkanKataSandi(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  invite: InvitationRow,
  password: string
): Promise<{ error?: string }> {
  if (invite.type === "invite") {
    const existing = await cariUserAuthByEmail(supabaseAdmin, invite.email);
    if (existing.error) {
      return { error: "Gagal memeriksa akun pengguna. Silakan coba lagi." };
    }

    let targetUserId: string;

    if (existing.user) {
      targetUserId = existing.user.id;

      if ((await ambilStatusProfil(supabaseAdmin, targetUserId)) === "nonaktif") {
        return { error: "Akun ini sedang nonaktif. Hubungi Pengelola untuk mengaktifkannya kembali." };
      }

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          nama_lengkap: invite.nama_lengkap,
          role: invite.role,
        },
      });
      if (updateAuthError) {
        console.error("Gagal update user auth saat invite:", updateAuthError);
        return { error: "Gagal memperbarui kata sandi akun. Silakan coba lagi." };
      }
    } else {
      const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: {
          nama_lengkap: invite.nama_lengkap,
          role: invite.role,
        },
      });

      if (createAuthError || !newUser?.user) {
        console.error("Gagal create user auth:", createAuthError);
        return { error: "Gagal membuat akun staf. Silakan coba lagi." };
      }
      targetUserId = newUser.user.id;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: targetUserId,
        nama_lengkap: invite.nama_lengkap,
        role: invite.role,
        status: "aktif",
        password_set: true,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("Gagal upsert profile:", profileError);
      return { error: "Gagal memperbarui profil pengguna." };
    }

    return {};
  }

  if (invite.type === "reset_password") {
    let targetUserId = invite.user_id;

    if (!targetUserId) {
      const existing = await cariUserAuthByEmail(supabaseAdmin, invite.email);
      if (existing.error) {
        return { error: "Gagal memeriksa akun pengguna. Silakan coba lagi." };
      }
      targetUserId = existing.user?.id ?? null;
    }

    if (!targetUserId) {
      return { error: "Akun pengguna tidak ditemukan untuk reset kata sandi." };
    }

    if ((await ambilStatusProfil(supabaseAdmin, targetUserId)) === "nonaktif") {
      return { error: "Akun ini sedang nonaktif. Hubungi Pengelola untuk mengaktifkannya kembali." };
    }

    const { error: resetAuthError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password,
      email_confirm: true,
    });
    if (resetAuthError) {
      console.error("Gagal reset user password auth:", resetAuthError);
      return { error: "Gagal memperbarui kata sandi. Silakan coba lagi." };
    }

    // Tidak menyentuh status: reset kata sandi tidak boleh mengaktifkan akun.
    await supabaseAdmin
      .from("profiles")
      .update({ password_set: true })
      .eq("id", targetUserId);

    return {};
  }

  return { error: "Jenis tautan tidak dikenali." };
}

/**
 * Menyelesaikan proses set password:
 * 1. Validasi format & kecocokan kata sandi
 * 2. Klaim token sekali pakai secara atomik (sebelum mengubah apa pun)
 * 3. Terapkan kata sandi di Supabase Auth dan profiles
 * 4. Jika langkah 3 gagal, klaim dilepas agar tautan bisa dipakai ulang
 */
export async function selesaikanAturKataSandiAction(input: SelesaikanAturKataSandiInput) {
  const parsed = setPasswordSchema.safeParse({
    password: input.password,
    konfirmasi: input.konfirmasi,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!input.token || typeof input.token !== "string" || input.token.trim() === "") {
    return { error: "Token tidak valid atau tidak disertakan." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const tokenHash = crypto.createHash("sha256").update(input.token.trim()).digest("hex");

    const { data: invite, error: fetchError } = await supabaseAdmin
      .from("user_invitations")
      .select("id, email, nama_lengkap, role, type, expires_at, used_at, user_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (fetchError || !invite) {
      return { error: "Tautan tidak valid atau tidak ditemukan." };
    }

    if (invite.used_at) {
      return { error: "Tautan ini sudah pernah digunakan sebelumnya." };
    }

    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return { error: "Tautan ini sudah kedaluwarsa. Silakan minta tautan baru." };
    }

    // Klaim atomik: hanya satu permintaan yang berhasil mengubah used_at dari null.
    // Dua submit paralel dengan token yang sama tidak bisa sama-sama lolos.
    const { data: klaim } = await supabaseAdmin
      .from("user_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("used_at", null)
      .select("id")
      .maybeSingle();

    if (!klaim) {
      return { error: "Tautan ini sudah pernah digunakan sebelumnya." };
    }

    let berhasil = false;
    try {
      const hasil = await terapkanKataSandi(supabaseAdmin, invite, parsed.data.password);
      if (hasil.error) {
        return { error: hasil.error };
      }

      berhasil = true;
      revalidatePath("/admin/pengguna");
      return { success: true };
    } finally {
      if (!berhasil) {
        const { error: releaseError } = await supabaseAdmin
          .from("user_invitations")
          .update({ used_at: null })
          .eq("id", invite.id);
        if (releaseError) {
          console.error("Gagal melepas klaim token setelah kegagalan:", releaseError);
        }
      }
    }
  } catch (err) {
    console.error("Error selesaikanAturKataSandiAction:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi." };
  }
}
