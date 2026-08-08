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

/**
 * Menyelesaikan proses set password:
 * 1. Validasi format & kecocokan kata sandi
 * 2. Cek token sekali pakai
 * 3. Buat / update user di Supabase Auth
 * 4. Upsert profiles (status: aktif, password_set: true)
 * 5. Hanguskan token (used_at = now())
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

    // Ambil data invitation
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

    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return { error: "Tautan ini sudah kedaluwarsa. Silakan minta tautan baru." };
    }

    let targetUserId = invite.user_id;

    if (invite.type === "invite") {
      // 1. Cek apakah akun auth sudah pernah dibuat
      // Note: VULN-10 mitigation (menggunakan getUserByEmail) dikembalikan ke listUsers()
      // karena API Supabase JS versi ini tidak menyediakan method getUserByEmail.
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userListData?.users?.find(
        (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
      );

      if (existingUser) {
        targetUserId = existingUser.id;
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            password: parsed.data.password,
            email_confirm: true,
            user_metadata: {
              nama_lengkap: invite.nama_lengkap,
              role: invite.role,
            },
          }
        );
        if (updateAuthError) {
          console.error("Gagal update user auth saat invite:", updateAuthError);
          return { error: "Gagal memperbarui kata sandi akun. Silakan coba lagi." };
        }
      } else {
        // Buat user baru di auth.users
        const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: invite.email,
          password: parsed.data.password,
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

      // 2. Upsert ke tabel profiles
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
    } else if (invite.type === "reset_password") {
      if (!targetUserId) {
        // Fallback cari user id by email jika user_id di invite null
        // Note: listUsers() dipakai sebagai fallback karena getUserByEmail tidak tersedia.
        const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userListData?.users?.find(
          (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
        );
        targetUserId = existingUser?.id;
      }

      if (!targetUserId) {
        return { error: "Akun pengguna tidak ditemukan untuk reset kata sandi." };
      }

      // Update password di Supabase Auth
      const { error: resetAuthError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: parsed.data.password,
        email_confirm: true,
      });

      if (resetAuthError) {
        console.error("Gagal reset user password auth:", resetAuthError);
        return { error: "Gagal memperbarui kata sandi. Silakan coba lagi." };
      }

      // Update status di profiles
      await supabaseAdmin
        .from("profiles")
        .update({
          password_set: true,
          status: "aktif",
        })
        .eq("id", targetUserId);
    }

    // 3. Tandai token sebagai sudah terpakai (one-time use)
    const { error: tokenUpdateError } = await supabaseAdmin
      .from("user_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (tokenUpdateError) {
      console.error("Gagal menandai token sebagai terpakai:", tokenUpdateError);
    }

    revalidatePath("/admin/pengguna");
    return { success: true };
  } catch (err) {
    console.error("Error selesaikanAturKataSandiAction:", err);
    return { error: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi." };
  }
}
