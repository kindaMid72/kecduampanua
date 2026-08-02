"use client";

import { useState, useEffect } from "react";
import {
  getProfilMandiriAction,
  updateProfilMandiriAction,
  gantiKataSandiMandiriAction,
  type ProfilMandiriData,
} from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Lock, KeyRound, Eye, EyeOff, Check, X } from "lucide-react";

export default function PengaturanAkunPage() {
  const [profile, setProfile] = useState<ProfilMandiriData | null>(null);
  const [fetching, setFetching] = useState(true);

  // State profil
  const [namaLengkap, setNamaLengkap] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State ganti kata sandi
  const [kataSandiLama, setKataSandiLama] = useState("");
  const [kataSandiBaru, setKataSandiBaru] = useState("");
  const [konfirmasiSandi, setKonfirmasiSandi] = useState("");
  const [showSandiLama, setShowSandiLama] = useState(false);
  const [showSandiBaru, setShowSandiBaru] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Validasi real-time kata sandi baru
  const hasMinLength = kataSandiBaru.length >= 8;
  const hasUppercase = /[A-Z]/.test(kataSandiBaru);
  const hasNumber = /[0-9]/.test(kataSandiBaru);
  const isMatch = konfirmasiSandi.length > 0 && kataSandiBaru === konfirmasiSandi;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await getProfilMandiriAction();
      if (isMounted) {
        if (res.data) {
          setProfile(res.data);
          setNamaLengkap(res.data.nama_lengkap);
        } else if (res.error) {
          setProfileError(res.error);
        }
        setFetching(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfilMandiriAction(formData);

    if (res?.error) {
      setProfileError(res.error);
    } else {
      setProfileSuccess("Nama profil berhasil diperbarui.");
    }
    setProfileLoading(false);
  }

  async function handleGantiPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    const formData = new FormData(e.currentTarget);
    const res = await gantiKataSandiMandiriAction(formData);

    if (res?.error) {
      setPasswordError(res.error);
    } else {
      setPasswordSuccess("Kata sandi Anda berhasil diperbarui. Gunakan kata sandi baru ini saat login berikutnya.");
      setKataSandiLama("");
      setKataSandiBaru("");
      setKonfirmasiSandi("");
    }
    setPasswordLoading(false);
  }

  if (fetching) {
    return <p className="text-sm p-4 text-text/70">Memuat profil akun...</p>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Pengaturan Akun</h1>
        <p className="text-sm text-text/60">
          Kelola data pribadi dan perbarui kata sandi akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Bagian 1: Data Diri */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
            <User size={18} /> Data Pribadi
          </h2>

          {profileSuccess && (
            <div className="p-3 mb-4 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)] text-xs rounded border border-[color:var(--color-status-success)]/20">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text/70 mb-1 flex items-center gap-1">
                <Lock size={12} /> Alamat Email (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full h-10 px-3 bg-surface/50 border border-surface rounded text-sm text-text/60 font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-text/40 mt-1">
                Email akses akun ini dikelola oleh sistem.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text/70 mb-1">
                Hak Akses / Peran
              </label>
              <div className="pt-1">
                <Badge variant={profile?.role === "super_account" ? "warning" : "info"}>
                  {profile?.role === "super_account" ? "Pengelola (Admin)" : "Staf (Editor)"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text/70 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama_lengkap"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="w-full h-10 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Nama Lengkap Anda"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" loading={profileLoading} className="w-full sm:w-auto">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>

        {/* Bagian 2: Ganti Kata Sandi */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
            <KeyRound size={18} /> Ganti Kata Sandi
          </h2>

          {passwordSuccess && (
            <div className="p-3 mb-4 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)] text-xs rounded border border-[color:var(--color-status-success)]/20">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleGantiPassword} className="space-y-4">
            {/* Kata Sandi Lama */}
            <div>
              <label className="block text-xs font-medium text-text/70 mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showSandiLama ? "text" : "password"}
                  name="kata_sandi_lama"
                  required
                  value={kataSandiLama}
                  onChange={(e) => setKataSandiLama(e.target.value)}
                  className="w-full h-10 px-3 pr-10 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="Masukkan kata sandi saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowSandiLama(!showSandiLama)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text"
                  aria-label={showSandiLama ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showSandiLama ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-medium text-text/70 mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showSandiBaru ? "text" : "password"}
                  name="kata_sandi_baru"
                  required
                  value={kataSandiBaru}
                  onChange={(e) => setKataSandiBaru(e.target.value)}
                  className="w-full h-10 px-3 pr-10 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowSandiBaru(!showSandiBaru)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text"
                  aria-label={showSandiBaru ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showSandiBaru ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Syarat Keamanan Kata Sandi */}
              <div className="mt-2.5 p-2.5 bg-surface/50 rounded text-xs space-y-1">
                <p className="font-medium text-text/70 mb-1">Ketentuan kata sandi baru:</p>
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <X size={14} className="text-text/40" />
                  )}
                  <span className={hasMinLength ? "text-green-700 font-medium" : "text-text/60"}>
                    Minimal 8 karakter
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasUppercase ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <X size={14} className="text-text/40" />
                  )}
                  <span className={hasUppercase ? "text-green-700 font-medium" : "text-text/60"}>
                    Setidaknya 1 huruf kapital (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasNumber ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <X size={14} className="text-text/40" />
                  )}
                  <span className={hasNumber ? "text-green-700 font-medium" : "text-text/60"}>
                    Setidaknya 1 angka (0-9)
                  </span>
                </div>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="block text-xs font-medium text-text/70 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type={showSandiBaru ? "text" : "password"}
                name="konfirmasi_kata_sandi_baru"
                required
                value={konfirmasiSandi}
                onChange={(e) => setKonfirmasiSandi(e.target.value)}
                className="w-full h-10 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Ulangi kata sandi baru"
              />
              {konfirmasiSandi.length > 0 && (
                <p
                  className={`text-[11px] mt-1 flex items-center gap-1 ${
                    isMatch ? "text-green-600 font-medium" : "text-red-600"
                  }`}
                >
                  {isMatch ? <Check size={12} /> : <X size={12} />}
                  {isMatch ? "Konfirmasi cocok" : "Konfirmasi kata sandi belum cocok"}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" loading={passwordLoading} className="w-full sm:w-auto">
                Perbarui Kata Sandi
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
