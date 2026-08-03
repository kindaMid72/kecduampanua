"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { editPenggunaSchema } from "@/lib/validations/auth";
import crypto from "crypto";

export interface PenggunaItem {
  id: string;
  nama_lengkap: string;
  email: string;
  role: "super_account" | "staf";
  status: "aktif" | "nonaktif";
  created_at: string;
}

/**
 * Mengambil daftar pengguna lengkap beserta alamat email.
 * Didesain sangat tangguh (resilient) dengan multiple fallback layers.
 */
export async function getDaftarPenggunaAction(): Promise<{
  data?: PenggunaItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Sesi login tidak valid. Silakan login kembali." };
    }

    // 1. Verifikasi peran caller
    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || callerProfile?.role !== "super_account") {
      return { error: "Hanya akun Pengelola (Super Account) yang dapat melihat daftar pengguna." };
    }

    // 2. Ambil data profil (prioritaskan supabaseAdmin, fallback ke session client)
    let profiles: Array<{
      id: string;
      nama_lengkap: string;
      role: string;
      status: string;
      created_at: string;
    }> | null = null;

    try {
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, nama_lengkap, role, status, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        profiles = data;
      }
    } catch (adminErr) {
      console.warn("createAdminClient gagal untuk query profiles, mencoba fallback session:", adminErr);
    }

    if (!profiles) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, role, status, created_at")
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Gagal query profiles via session client:", error);
        return { error: "Gagal mengambil data profil pengguna dari database." };
      }
      profiles = data;
    }

    // 3. Mapping alamat email (tidak boleh memblokir pemuatan profil jika gagal)
    const emailMap = new Map<string, string>();

    // Mapping email user yang sedang login
    if (user.email) {
      emailMap.set(user.id, user.email);
    }

    // Coba ambil listUsers dari admin auth jika tersedia
    try {
      const supabaseAdmin = createAdminClient();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (!authError && authData && Array.isArray(authData.users)) {
        for (const u of authData.users) {
          if (u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        }
      }
    } catch (authErr) {
      console.warn("Gagal mengambil mapping email dari auth.admin.listUsers:", authErr);
    }

    // Coba lengkapi dari tabel user_invitations untuk user_id yang belum terpetakan
    try {
      const { data: invitations } = await supabase
        .from("user_invitations")
        .select("email, user_id");

      if (invitations && Array.isArray(invitations)) {
        for (const inv of invitations) {
          if (inv.user_id && inv.email && !emailMap.has(inv.user_id)) {
            emailMap.set(inv.user_id, inv.email);
          }
        }
      }
    } catch (invErr) {
      console.warn("Gagal mengambil fallback email dari user_invitations:", invErr);
    }

    const result: PenggunaItem[] = profiles.map((p) => ({
      id: p.id,
      nama_lengkap: p.nama_lengkap,
      email: emailMap.get(p.id) || "-",
      role: p.role as "super_account" | "staf",
      status: p.status as "aktif" | "nonaktif",
      created_at: p.created_at,
    }));

    return { data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server saat memuat data pengguna.";
    console.error("Terjadi error di getDaftarPenggunaAction:", err);
    return { error: message };
  }
}

/**
 * Mengundang staf / pengelola baru menggunakan One-Time Setup Token
 */
export async function invitePenggunaAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim()?.toLowerCase();
    const nama_lengkap = (formData.get("nama_lengkap") as string)?.trim();
    const role = formData.get("role") as string;

    if (!email || !nama_lengkap || !role) {
      return { error: "Semua field wajib diisi." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Format alamat email tidak valid." };
    }

    if (role !== "super_account" && role !== "staf") {
      return { error: "Peran pengguna tidak valid." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Anda belum login." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_account") {
      return { error: "Hanya Pengelola yang dapat mengundang pengguna baru." };
    }

    const supabaseAdmin = createAdminClient();

    // Batalkan token lama yang belum terpakai untuk email ini
    await supabaseAdmin
      .from("user_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("email", email)
      .is("used_at", null);

    // Buat token 256-bit acak
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 hari

    const { error: inviteError } = await supabaseAdmin.from("user_invitations").insert({
      email,
      nama_lengkap,
      role,
      token_hash: tokenHash,
      type: "invite",
      expires_at: expiresAt,
      created_by: user.id,
    });

    if (inviteError) {
      console.error("Gagal membuat token undangan:", inviteError);
      return { error: "Gagal membuat tautan undangan. Terjadi kesalahan server." };
    }

    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const directLink = `${origin}/admin/atur-kata-sandi?token=${rawToken}`;

    revalidatePath("/admin/pengguna");
    return { success: true, action_link: directLink };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengundang pengguna.";
    console.error("Error di invitePenggunaAction:", err);
    return { error: message };
  }
}

/**
 * Edit data pengguna (nama lengkap & role).
 * Email bersifat read-only dan tidak diubah di sini.
 */
export async function editPenggunaAction(
  userId: string,
  payload: { nama_lengkap: string; role: "super_account" | "staf" }
) {
  try {
    const parsed = editPenggunaSchema.safeParse(payload);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Data pengguna tidak valid." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Anda belum login." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_account") {
      return { error: "Hanya Pengelola yang dapat mengubah data pengguna." };
    }

    const supabaseAdmin = createAdminClient();

    // Guardrail: Jika user mengedit dirinya sendiri dan mengubah role ke 'staf'
    if (user.id === userId && parsed.data.role === "staf") {
      const { count, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_account")
        .eq("status", "aktif");

      if (countError) {
        return { error: "Gagal memeriksa status peran Pengelola." };
      }

      if ((count ?? 0) <= 1) {
        return {
          error: "Tidak dapat mengubah peran karena Anda adalah satu-satunya Pengelola aktif dalam sistem.",
        };
      }
    }

    // Update profil di tabel profiles
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        nama_lengkap: parsed.data.nama_lengkap,
        role: parsed.data.role,
      })
      .eq("id", userId);

    if (updateProfileError) {
      console.error("Gagal memperbarui profiles:", updateProfileError);
      return { error: "Gagal memperbarui data pengguna." };
    }

    // Update metadata di auth.users agar sinkron
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          nama_lengkap: parsed.data.nama_lengkap,
          role: parsed.data.role,
        },
      });
    } catch (err) {
      console.warn("Gagal memperbarui auth user metadata:", err);
    }

    revalidatePath("/admin/pengguna");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui data pengguna.";
    console.error("Error di editPenggunaAction:", err);
    return { error: message };
  }
}

/**
 * Menghapus akun pengguna dari sistem (Supabase Auth & profiles)
 */
export async function hapusPenggunaAction(userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Anda belum login." };

    // Guardrail 1: Larangan self-delete
    if (user.id === userId) {
      return { error: "Anda tidak dapat menghapus akun Anda sendiri." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_account") {
      return { error: "Hanya Pengelola yang dapat menghapus pengguna." };
    }

    const supabaseAdmin = createAdminClient();

    // Guardrail 2: Cek apakah target adalah super_account dan satu-satunya super_account aktif
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", userId)
      .single();

    if (targetProfile?.role === "super_account" && targetProfile?.status === "aktif") {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_account")
        .eq("status", "aktif");

      if ((count ?? 0) <= 1) {
        return { error: "Tidak dapat menghapus satu-satunya Pengelola aktif dalam sistem." };
      }
    }

    // Defensif: Bersihkan referensi foreign key ke tabel konten publik agar data tetap aman
    try {
      await supabaseAdmin.from("informasi_publik").update({ dibuat_oleh: null }).eq("dibuat_oleh", userId);
      await supabaseAdmin.from("potensi_daerah").update({ dibuat_oleh: null }).eq("dibuat_oleh", userId);
      await supabaseAdmin.from("dokumen_edaran").update({ diunggah_oleh: null }).eq("diunggah_oleh", userId);
      await supabaseAdmin.from("pengaduan").update({ ditangani_oleh: null }).eq("ditangani_oleh", userId);
      await supabaseAdmin.from("user_invitations").delete().or(`user_id.eq.${userId},created_by.eq.${userId}`);
    } catch (err) {
      console.warn("Pembersihan defensif FK error (diabaikan jika cascade aktif):", err);
    }

    // Hapus akun dari auth.users (akan otomatis menghapus/meng-cascade profile)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Gagal menghapus user dari Supabase Auth:", deleteAuthError);
      return { error: "Gagal menghapus akun pengguna dari sistem." };
    }

    // Hapus dari profiles jika trigger/FK belum meng-cascade
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    revalidatePath("/admin/pengguna");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus pengguna.";
    console.error("Error di hapusPenggunaAction:", err);
    return { error: message };
  }
}

/**
 * Reset kata sandi pengguna (bisa untuk staf lain maupun akun diri sendiri)
 */
export async function resetKataSandiAction(userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Anda belum login." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_account") {
      return { error: "Hanya Pengelola yang dapat membuat tautan reset kata sandi." };
    }

    const supabaseAdmin = createAdminClient();

    let targetEmail: string | null = null;
    let targetNama = "Pengguna";
    let targetRole = "staf";

    // 1. Coba ambil dari auth.admin
    try {
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetUser?.user?.email) {
        targetEmail = targetUser.user.email;
      }
    } catch (authErr) {
      console.warn("getUserById error:", authErr);
    }

    // 2. Coba ambil data profil
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("nama_lengkap, role")
      .eq("id", userId)
      .single();

    if (targetProfile) {
      targetNama = targetProfile.nama_lengkap || targetNama;
      targetRole = targetProfile.role || targetRole;
    }

    // 3. Jika targetEmail belum didapat dan user mereset akun sendiri
    if (!targetEmail && user.id === userId && user.email) {
      targetEmail = user.email;
    }

    // 4. Fallback jika email belum didapat, cari di user_invitations
    if (!targetEmail) {
      const { data: inv } = await supabaseAdmin
        .from("user_invitations")
        .select("email")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (inv?.email) {
        targetEmail = inv.email;
      }
    }

    if (!targetEmail) {
      return { error: "Gagal menemukan alamat email akun pengguna." };
    }

    // Batalkan token lama yang belum terpakai untuk email ini
    await supabaseAdmin
      .from("user_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("email", targetEmail)
      .is("used_at", null);

    // Buat token 256-bit acak untuk reset kata sandi
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 hari

    const { error: resetError } = await supabaseAdmin.from("user_invitations").insert({
      email: targetEmail,
      nama_lengkap: targetNama,
      role: targetRole,
      token_hash: tokenHash,
      type: "reset_password",
      user_id: userId,
      expires_at: expiresAt,
      created_by: user.id,
    });

    if (resetError) {
      console.error("Gagal membuat token reset:", resetError);
      return { error: "Gagal membuat tautan reset kata sandi." };
    }

    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const directLink = `${origin}/admin/atur-kata-sandi?token=${rawToken}`;

    return { success: true, action_link: directLink };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat tautan reset kata sandi.";
    console.error("Error di resetKataSandiAction:", err);
    return { error: message };
  }
}

/**
 * Mengubah status pengguna (aktif/nonaktif)
 */
export async function ubahStatusPenggunaAction(userId: string, newStatus: "aktif" | "nonaktif") {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Anda belum login." };
    if (user.id === userId) return { error: "Tidak dapat mengubah status diri sendiri." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_account") {
      return { error: "Hanya Pengelola yang dapat mengubah status pengguna." };
    }

    const supabaseAdmin = createAdminClient();

    // Guardrail: Jika menonaktifkan super_account, pastikan bukan satu-satunya super_account aktif
    if (newStatus === "nonaktif") {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (targetProfile?.role === "super_account") {
        const { count } = await supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "super_account")
          .eq("status", "aktif");

        if ((count ?? 0) <= 1) {
          return { error: "Tidak dapat menonaktifkan satu-satunya Pengelola aktif." };
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) {
      return { error: "Gagal mengubah status pengguna." };
    }

    revalidatePath("/admin/pengguna");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status pengguna.";
    console.error("Error di ubahStatusPenggunaAction:", err);
    return { error: message };
  }
}
