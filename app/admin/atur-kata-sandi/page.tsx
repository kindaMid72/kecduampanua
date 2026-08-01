"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { setPasswordSchema, type SetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { createClient } from "@/lib/supabase/client";

export default function AturKataSandiPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  // Token ada di URL hash — Supabase menangani otomatis via onAuthStateChange
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // Supabase sudah mendeteksi token recovery dari URL — siap untuk update
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  async function onSubmit(data: SetPasswordInput) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      setError(
        "Gagal mengatur kata sandi. Link mungkin sudah kedaluwarsa. Minta link baru dari Pengelola."
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/dashboard"), 2000);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center space-y-3">
          <CheckCircle size={48} className="text-[color:var(--color-status-success)] mx-auto" />
          <h1 className="font-display text-xl font-semibold text-primary">
            Kata sandi berhasil diatur
          </h1>
          <p className="text-sm text-text/60">
            Mengalihkan ke dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white font-mono font-bold text-lg mb-4">
            KD
          </div>
          <h1 className="font-display text-2xl font-semibold text-primary">
            Atur Kata Sandi
          </h1>
          <p className="text-sm text-text/50 mt-1">
            Buat kata sandi baru untuk akun Anda
          </p>
        </div>

        <SectionDivider className="mb-8" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="px-4 py-3 rounded-[var(--radius-card)] bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Kata sandi baru */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                aria-invalid={!!errors.password}
                className={[
                  "w-full h-11 px-3 pr-10 rounded-[var(--radius-button)] border text-sm",
                  "bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors",
                  errors.password ? "border-red-400" : "border-surface hover:border-text/30",
                ].join(" ")}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p id="password-hint" className="mt-1 text-xs text-text/40">
              Minimal 8 karakter, 1 huruf kapital, 1 angka
            </p>
            {errors.password && (
              <p id="password-error" role="alert" className="mt-0.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Konfirmasi */}
          <div>
            <label htmlFor="konfirmasi" className="block text-sm font-medium text-text mb-1.5">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <input
                id="konfirmasi"
                type={showKonfirmasi ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.konfirmasi}
                className={[
                  "w-full h-11 px-3 pr-10 rounded-[var(--radius-button)] border text-sm",
                  "bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors",
                  errors.konfirmasi ? "border-red-400" : "border-surface hover:border-text/30",
                ].join(" ")}
                {...register("konfirmasi")}
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi((v) => !v)}
                aria-label={showKonfirmasi ? "Sembunyikan" : "Tampilkan"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/70"
              >
                {showKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.konfirmasi && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.konfirmasi.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
          </Button>
        </form>
      </div>
    </main>
  );
}
