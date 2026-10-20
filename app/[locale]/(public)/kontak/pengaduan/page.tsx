"use client";

import { useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pengaduanPublikSchema, type PengaduanPublikInput } from "@/lib/validations/pengaduan";
import { submitPengaduanAction, cekStatusPengaduanAction, type StatusPengaduan } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PengaduanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations("pengaduan");
  const isEn = locale === "en";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ trackingId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Status check states
  const [checkMode, setCheckMode] = useState(false);
  const [checkTracking, setCheckTracking] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<StatusPengaduan | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<PengaduanPublikInput>({
    resolver: zodResolver(pengaduanPublikSchema),
    defaultValues: { kategori: "", setuju_data_pribadi: false }
  });

  async function onSubmit(data: PengaduanPublikInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("nama_pelapor", data.nama_pelapor);
    formData.append("kontak_pelapor", data.kontak_pelapor);
    formData.append("kategori", data.kategori);
    formData.append("deskripsi", data.deskripsi);
    formData.append("setuju_data_pribadi", String(data.setuju_data_pribadi));
    if (data.honeypot) formData.append("honeypot", data.honeypot);

    const res = await submitPengaduanAction(formData);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success && res.trackingId) {
      setSuccess({ trackingId: res.trackingId });
      reset();
    }
    setLoading(false);
  }

  function handleCopy() {
    if (success?.trackingId) {
      navigator.clipboard.writeText(success.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCheckStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!checkTracking.trim()) return;

    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);

    // Query lewat Server Action (rate limit + RPC), bukan dari browser.
    const res = await cekStatusPengaduanAction(checkTracking);

    if ("data" in res) {
      setCheckResult(res.data);
    } else {
      setCheckError(
        res.error === "rateLimited"
          ? t("status.rateLimited")
          : res.error === "unavailable"
            ? t("status.unavailable")
            : t("status.notFound")
      );
    }

    setCheckLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary mb-4">
          {t("title")}
        </h1>
        <p className="text-text/60 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-surface/50 p-1 rounded-lg">
          <button
            onClick={() => setCheckMode(false)}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              !checkMode ? "bg-paper text-primary shadow-sm" : "text-text/60 hover:text-text"
            }`}
          >
            Formulir Laporan
          </button>
          <button
            onClick={() => setCheckMode(true)}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              checkMode ? "bg-paper text-primary shadow-sm" : "text-text/60 hover:text-text"
            }`}
          >
            {t("form.cekStatus")}
          </button>
        </div>
      </div>

      {!checkMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {success ? (
              <Card padding="lg" className="text-center bg-status-success/10/50 border-status-success">
                <div className="w-16 h-16 bg-status-success/10 text-status-success-ink rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-semibold text-status-success-ink mb-2">{t("form.success")}</h3>
                <p className="text-status-success-ink/80 mb-6">{t("form.successDesc")}</p>
                
                <div className="bg-paper border border-status-success/30 rounded-lg p-4 flex items-center justify-between max-w-sm mx-auto mb-6">
                  <span className="font-mono text-xl font-bold tracking-widest text-primary">
                    {success.trackingId}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-text/50 hover:text-primary transition-colors bg-surface/50 hover:bg-surface rounded"
                    title={t("form.copy")}
                  >
                    {copied ? <span className="text-xs font-medium text-status-success-ink">{t("form.copied")}</span> : <Copy size={18} />}
                  </button>
                </div>

                <Button onClick={() => setSuccess(null)} variant="ghost">
                  {t("form.buatBaru")}
                </Button>
              </Card>
            ) : (
              <Card padding="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <div role="alert" className="p-3 bg-danger/10 text-danger text-sm rounded border border-danger/30 flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Honeypot field (hidden from users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="pengaduan-honeypot">{t("form.honeypot")}</label>
                    <input id="pengaduan-honeypot" type="text" {...register("honeypot")} tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="pengaduan-nama" className="block text-sm font-medium mb-1.5">{t("form.nama")} <span className="text-danger">*</span></label>
                      <input
                        id="pengaduan-nama"
                        type="text"
                        aria-invalid={errors.nama_pelapor ? true : undefined}
                        aria-describedby={errors.nama_pelapor ? "pengaduan-nama-galat" : undefined}
                        {...register("nama_pelapor")}
                        className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                      />
                      {errors.nama_pelapor && <p id="pengaduan-nama-galat" role="alert" className="text-danger text-xs mt-1">{errors.nama_pelapor.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="pengaduan-kontak" className="block text-sm font-medium mb-1.5">{t("form.kontak")} <span className="text-danger">*</span></label>
                      <input
                        id="pengaduan-kontak"
                        type="text"
                        aria-invalid={errors.kontak_pelapor ? true : undefined}
                        aria-describedby={errors.kontak_pelapor ? "pengaduan-kontak-galat" : undefined}
                        {...register("kontak_pelapor")}
                        className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                      />
                      {errors.kontak_pelapor && <p id="pengaduan-kontak-galat" role="alert" className="text-danger text-xs mt-1">{errors.kontak_pelapor.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pengaduan-kategori" className="block text-sm font-medium mb-1.5">{t("form.kategori")} <span className="text-danger">*</span></label>
                    <select
                      id="pengaduan-kategori"
                      aria-invalid={errors.kategori ? true : undefined}
                      aria-describedby={errors.kategori ? "pengaduan-kategori-galat" : undefined}
                      {...register("kategori")}
                      className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-paper"
                    >
                      <option value="" disabled>{t("kategori.pilih")}</option>
                      <option value="infrastruktur">{t("kategori.infrastruktur")}</option>
                      <option value="pelayanan">{t("kategori.pelayanan")}</option>
                      <option value="keamanan">{t("kategori.keamanan")}</option>
                      <option value="lingkungan">{t("kategori.lingkungan")}</option>
                      <option value="lainnya">{t("kategori.lainnya")}</option>
                    </select>
                    {errors.kategori && <p id="pengaduan-kategori-galat" role="alert" className="text-danger text-xs mt-1">{errors.kategori.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="pengaduan-deskripsi" className="block text-sm font-medium mb-1.5">{t("form.deskripsi")} <span className="text-danger">*</span></label>
                    <textarea
                      id="pengaduan-deskripsi"
                      aria-invalid={errors.deskripsi ? true : undefined}
                      aria-describedby={errors.deskripsi ? "pengaduan-deskripsi-galat" : undefined}
                      {...register("deskripsi")}
                      className="w-full h-32 px-3 py-2 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    />
                    {errors.deskripsi && <p id="pengaduan-deskripsi-galat" role="alert" className="text-danger text-xs mt-1">{errors.deskripsi.message}</p>}
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 p-3 bg-surface/30 rounded border border-surface cursor-pointer">
                      <input
                        id="pengaduan-setuju"
                        type="checkbox"
                        aria-invalid={errors.setuju_data_pribadi ? true : undefined}
                        aria-describedby={errors.setuju_data_pribadi ? "pengaduan-setuju-galat" : undefined}
                        {...register("setuju_data_pribadi")}
                        className="mt-1"
                      />
                      <span className="text-sm text-text/70">{t("form.pdp")}</span>
                    </label>
                    {errors.setuju_data_pribadi && <p id="pengaduan-setuju-galat" role="alert" className="text-danger text-xs mt-1">{errors.setuju_data_pribadi.message}</p>}
                  </div>

                  <div className="pt-4 border-t border-surface">
                    <Button type="submit" loading={loading} className="w-full py-6">
                      {loading ? t("form.submitting") : t("form.submit")}
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>

          <div>
            <Card padding="md" className="bg-surface/50 border border-surface shadow-sm">
              <h3 className="font-display text-lg font-semibold mb-3 text-primary">{t("lapor.title")}</h3>
              <p className="text-text/80 text-sm mb-6 leading-relaxed">
                {t("lapor.desc")}
              </p>
              <a 
                href="https://www.lapor.go.id/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-paper rounded font-medium hover:bg-primary-hover transition-colors"
              >
                <span>{t("lapor.btn")}</span>
                <ExternalLink size={16} />
              </a>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card padding="lg">
            <div className="text-center mb-6">
              <h2 className="font-display text-xl font-semibold text-primary mb-2">{t("status.title")}</h2>
              <p className="text-sm text-text/60">{t("status.subtitle")}</p>
            </div>

            <form onSubmit={handleCheckStatus} className="flex gap-2 mb-8">
              <input
                type="text"
                value={checkTracking}
                onChange={(e) => setCheckTracking(e.target.value)}
                placeholder={t("status.placeholder")}
                className="flex-1 h-12 px-4 border rounded focus:ring-2 focus:ring-primary outline-none uppercase font-mono tracking-wider"
                required
              />
              <Button type="submit" loading={checkLoading} className="h-12 px-6">
                <Search size={18} className="mr-2" /> {t("status.cek")}
              </Button>
            </form>

            {checkError && (
              <div className="p-4 bg-danger/10 text-danger text-sm rounded border border-danger/30 text-center">
                {checkError}
              </div>
            )}

            {checkResult && (
              <div className="border border-surface rounded-lg overflow-hidden">
                <div className="bg-surface/50 px-4 py-3 border-b border-surface flex items-center justify-between">
                  <span className="text-sm font-medium text-text/70">{t("status.placeholder")}</span>
                  <span className="font-mono font-bold text-primary">{checkTracking.toUpperCase()}</span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text/60">{t("status.label")}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      checkResult.status === 'baru' ? 'bg-danger/10 text-danger' : 
                      checkResult.status === 'diproses' ? 'bg-status-warning/10 text-status-warning-ink' :
                      'bg-status-success/10 text-status-success-ink'
                    }`}>
                      {t(`status.${checkResult.status}`)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text/60">{t("status.tanggal")}</span>
                    <span className="text-sm font-medium text-text">
                      {format(new Date(checkResult.created_at), "dd MMMM yyyy", { locale: isEn ? undefined : localeId })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text/60">{t("form.kategori")}</span>
                    <span className="text-sm font-medium text-text capitalize">
                      {t(`kategori.${checkResult.kategori}`)}
                    </span>
                  </div>

                  {checkResult.catatan_tindak_lanjut && (
                    <div className="pt-4 mt-4 border-t border-surface">
                      <span className="block text-sm text-text/60 mb-2">{t("status.catatan")}</span>
                      <div className="bg-surface/30 p-3 rounded text-sm text-text border border-surface">
                        {checkResult.catatan_tindak_lanjut}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
