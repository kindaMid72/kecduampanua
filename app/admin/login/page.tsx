"use client";

import { useActionState, useState, startTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const urlSukses = searchParams.get("sukses");

  const [state, formAction, pending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    startTransition(() => {
      formAction(formData);
    });
  }

  let displayError = state?.error;
  if (!displayError && urlError === "nonaktif") {
    displayError = "Akun Anda dinonaktifkan atau belum memiliki profil. Hubungi Pengelola (atau tambahkan data ke tabel profiles jika Anda super admin).";
  }

  const showSuccessBanner = !displayError && urlSukses === "kata-sandi-diset";

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative h-16 w-12 mx-auto mb-4">
          <Image
            src="/logo-kab-pinrang.webp"
            alt="Logo Kabupaten Pinrang"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          Masuk ke Panel Admin
        </h1>
        <p className="text-sm text-text/50 mt-1 font-mono">
          Kecamatan Duampanua, Kab. Pinrang
        </p>
      </div>

      <SectionDivider className="mb-8" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Pesan Sukses Set Kata Sandi */}
        {showSuccessBanner && (
          <div
            role="status"
            className="px-4 py-3 rounded-[var(--radius-card)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
          >
            <p className="font-semibold text-emerald-900 mb-0.5">Kata sandi berhasil disimpan!</p>
            Silakan masuk menggunakan email dan kata sandi baru Anda.
          </div>
        )}

        {/* Error global */}
        {displayError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-[var(--radius-card)] bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {displayError}
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            className={[
              "w-full h-11 px-3 rounded-[var(--radius-button)] border text-sm",
              "bg-white text-text placeholder:text-text/30",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
              "transition-colors",
              errors.email
                ? "border-red-400"
                : "border-surface hover:border-text/30",
            ].join(" ")}
            placeholder="nama@email.com"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Kata sandi */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text mb-1.5"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              className={[
                "w-full h-11 px-3 pr-10 rounded-[var(--radius-button)] border text-sm",
                "bg-white text-text placeholder:text-text/30",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                "transition-colors",
                errors.password
                  ? "border-red-400"
                  : "border-surface hover:border-text/30",
              ].join(" ")}
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/70 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full"
        >
          <LogIn size={16} aria-hidden="true" />
          {pending ? "Sedang masuk..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Suspense
        fallback={
          <div className="w-full max-w-sm flex justify-center py-8">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20"></div>
              <div className="h-6 w-48 bg-primary/20 rounded"></div>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
