"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = {
  error?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validasi input
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Memulai proses login via Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (authError) {
    console.error("Supabase Auth Error:", authError);

    // Pesan error non-teknis untuk staf awam
    if (
      authError.message.includes("Invalid login") ||
      authError.message.includes("invalid_credentials")
    ) {
      return { error: "Email atau kata sandi salah. Silakan coba lagi." };
    }
    if (authError.message.includes("Email not confirmed")) {
      return { error: "Email belum diverifikasi. Silakan cek kotak masuk email Anda untuk melakukan verifikasi, atau hubungi administrator." };
    }
    
    return { error: "Terjadi kesalahan saat masuk. Silakan coba beberapa saat lagi." };
  }

  // Catatan: Kita sengaja TIDAK melakukan fetch ke tabel `profiles` di sini.
  // Karena keterbatasan Next.js Server Actions dan `@supabase/ssr`, fungsi
  // `cookies().getAll()` tidak akan berisi session cookie yang baru saja diset
  // dalam siklus request yang sama. Akibatnya, pemanggilan `.from("profiles")`
  // di sini akan menggunakan token anonim (bukan JWT user), sehingga diblokir
  // oleh RLS dan selalu mengembalikan error PGRST116 (0 rows).
  // 
  // Pengecekan status dan keberadaan profil pengguna sudah ditangani dengan 
  // aman di `app/admin/(dashboard)/layout.tsx` pada request berikutnya.

  redirect("/admin/dashboard");
}