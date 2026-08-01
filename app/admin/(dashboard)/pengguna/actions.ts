"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function invitePenggunaAction(formData: FormData) {
  const email = formData.get("email") as string;
  const nama_lengkap = formData.get("nama_lengkap") as string;
  const role = formData.get("role") as string;

  if (!email || !nama_lengkap || !role) {
    return { error: "Semua field wajib diisi." };
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

  // Gunakan service role untuk auth.admin functions (perlu SUPABASE_SERVICE_ROLE_KEY)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { error: "Konfigurasi server tidak valid (Service Role Key tidak ditemukan)." };
  }

  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  // Invite user
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      nama_lengkap,
      role,
      status: "aktif"
    }
  });

  if (inviteError) {
    console.error(inviteError);
    return { error: "Gagal mengundang pengguna. Mungkin email sudah terdaftar." };
  }

  // Insert profile manually since handle_new_user trigger doesn't exist
  if (inviteData?.user?.id) {
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: inviteData.user.id,
      nama_lengkap,
      role,
      status: "aktif"
    });
    if (profileError) {
      console.error("Gagal membuat profil:", profileError);
      return { error: "Pengguna diundang, tetapi gagal membuat profil." };
    }
  }

  revalidatePath("/admin/pengguna");
  return { success: true };
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
