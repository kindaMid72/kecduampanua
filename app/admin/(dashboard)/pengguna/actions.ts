"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import crypto from "crypto";

export async function invitePenggunaAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const nama_lengkap = (formData.get("nama_lengkap") as string)?.trim();
  const role = formData.get("role") as string;

  if (!email || !nama_lengkap || !role) {
    return { error: "Semua field wajib diisi." };
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format alamat email tidak valid." };
  }

  if (role !== "super_account" && role !== "staf") {
    return { error: "Peran pengguna tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  // Cek apakah user yang request adalah super_account
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_account") {
    return { error: "Hanya Pengelola yang dapat mengundang pengguna baru." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabaseAdmin = createAdminClient();

  // Batalkan / hanguskan token lama yang belum terpakai untuk email ini
  await supabaseAdmin
    .from("user_invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email)
    .is("used_at", null);

  // Buat token 256-bit acak dan simpan SHA-256 hash di database
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
}

export async function resetKataSandiAction(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Anda belum login." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_account") {
    return { error: "Hanya Pengelola yang dapat mereset kata sandi." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabaseAdmin = createAdminClient();

  const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (fetchError || !targetUser?.user?.email) {
    return { error: "Gagal menemukan data pengguna." };
  }

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("nama_lengkap, role")
    .eq("id", userId)
    .single();

  const targetEmail = targetUser.user.email;
  const targetNama = targetProfile?.nama_lengkap || "Pengguna";
  const targetRole = targetProfile?.role || "staf";

  // Batalkan / hanguskan token lama yang belum terpakai untuk email ini
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
}

export async function ubahStatusPenggunaAction(userId: string, newStatus: "aktif" | "nonaktif") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId);

  if (error) {
    return { error: "Gagal mengubah status pengguna." };
  }

  revalidatePath("/admin/pengguna");
  return { success: true };
}
