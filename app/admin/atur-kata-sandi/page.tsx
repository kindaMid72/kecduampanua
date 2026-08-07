"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { setPasswordSchema, type SetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { verifikasiTokenAction, selesaikanAturKataSandiAction, type VerifikasiTokenResult } from "./actions";

function AturKataSandiForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<VerifikasiTokenResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
  });

  const passwordVal = watch("password") || "";

  useEffect(() => {
    let isMounted = true;

    async function checkTokenValidity() {
      if (!token) {
        if (isMounted) {
          setTokenInfo({
            valid: false,
            error: "Tautan tidak memiliki token. Pastikan Anda membuka tautan lengkap yang diberikan oleh Pengelola.",
          });
          setCheckingToken(false);
        }
        return;
      }

      const res = await verifikasiTokenAction(token);
      if (isMounted) {
        setTokenInfo(res);
        setCheckingToken(false);
      }
    }

    checkTokenValidity();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function onSubmit(data: SetPasswordInput) {
    setSubmitting(true);
    setSubmitError(null);

    const res = await selesaikanAturKataSandiAction({
      token,
      password: data.password,
      konfirmasi: data.konfirmasi,
    });

    if (res?.error) {
      setSubmitError(res.error);
      setSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      router.push("/admin/login?sukses=kata-sandi-diset");
    }, 1500);
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm text-center space-y-4 bg-white p-8 rounded-[var(--radius-card)] border border-surface shadow-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle size={32} />
          </div>
          <h1 className="font-display text-xl font-semibold text-primary">
            Kata Sandi Berhasil Disimpan
          </h1>
          <p className="text-sm text-text/70">
            Akun Anda kini sudah aktif. Mengalihkan ke halaman login...
          </p>
          <div className="pt-2">
            <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </main>
    );
  }

  if (checkingToken) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-text/70">Memverifikasi tautan akun...</p>
        </div>
      </main>
    );
  }

  if (!tokenInfo?.valid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background py-8">
        <div className="w-full max-w-md text-center space-y-4 bg-white p-8 rounded-[var(--radius-card)] border border-surface shadow-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-100 text-red-600 mb-2">
            <AlertCircle size={30} />
          </div>
          <h1 className="font-display text-xl font-semibold text-primary">Tautan Tidak Valid</h1>
          <p className="text-sm text-text/70 leading-relaxed">
            {tokenInfo?.error || "Tautan ini tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru kepada Pengelola."}
          </p>
          <div className="pt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/admin/login")}
            >
              Kembali ke Halaman Login
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isReset = tokenInfo.type === "reset_password";
  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-[var(--radius-card)] border border-surface shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative h-14 w-11 mx-auto mb-3">
            <Image
              src="/logo-kab-pinrang.webp"
              alt="Logo Kabupaten Pinrang"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-semibold text-primary">
            {isReset ? "Reset Kata Sandi" : "Atur Kata Sandi"}
          </h1>
          <p className="text-sm text-text/60 mt-1 font-mono">
            Kecamatan Duampanua, Kab. Pinrang
          </p>
        </div>

        {/* Info Pengguna */}
        <div className="bg-surface/50 p-3.5 rounded-[var(--radius-card)] mb-6 text-sm border border-surface">
          <p className="text-xs text-text/50 font-medium uppercase tracking-wide">
            {isReset ? "Reset Akun" : "Undangan Akun"}
          </p>
          <p className="font-semibold text-text mt-0.5">{tokenInfo.nama_lengkap}</p>
          <p className="text-xs text-text/60 font-mono mt-0.5">{tokenInfo.email}</p>
        </div>

        <SectionDivider className="mb-6" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {submitError && (
            <div
              role="alert"
              className="px-4 py-3 rounded-[var(--radius-card)] bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {submitError}
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
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={!!errors.password}
                className={[
                  "w-full h-11 px-3 pr-10 rounded-[var(--radius-button)] border text-sm",
                  "bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors",
                  errors.password ? "border-red-400" : "border-surface hover:border-text/30",
                ].join(" ")}
                placeholder="Masukkan kata sandi baru"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Checklist keamanan kata sandi */}
            <div className="mt-2.5 p-2.5 bg-surface/30 rounded border border-surface/50 text-xs space-y-1">
              <p className="font-medium text-text/70 mb-1 flex items-center gap-1">
                <ShieldCheck size={13} className="text-primary" /> Syarat kata sandi:
              </p>
              <div className="grid grid-cols-1 gap-1 text-text/60">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : ""}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-600" : "bg-text/30"}`}></span>
                  Minimal 8 karakter
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-700 font-medium" : ""}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasUppercase ? "bg-emerald-600" : "bg-text/30"}`}></span>
                  Setidaknya 1 huruf kapital (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-700 font-medium" : ""}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-600" : "bg-text/30"}`}></span>
                  Setidaknya 1 angka (0-9)
                </div>
              </div>
            </div>

            {errors.password && (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Konfirmasi kata sandi */}
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
                placeholder="Ulangi kata sandi baru"
                {...register("konfirmasi")}
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi((v) => !v)}
                aria-label={showKonfirmasi ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full mt-2"
          >
            {submitting ? "Menyimpan..." : isReset ? "Simpan Kata Sandi Baru" : "Simpan & Aktifkan Akun"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function AturKataSandiPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4 bg-background">
          <p className="text-sm text-text/60">Memuat...</p>
        </main>
      }
    >
      <AturKataSandiForm />
    </Suspense>
  );
}
