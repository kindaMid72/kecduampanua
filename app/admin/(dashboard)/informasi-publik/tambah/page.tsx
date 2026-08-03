"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { informasiPublikSchema, type InformasiPublikInput } from "@/lib/validations/informasi-publik";
import { createInformasiAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function TambahInformasiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InformasiPublikInput>({
    resolver: zodResolver(informasiPublikSchema),
    defaultValues: { kategori: "pengumuman" }
  });

  const gambarCoverUrl = watch("gambar_cover_url") || "";

  async function onSubmit(data: InformasiPublikInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("judul", data.judul);
    if (data.judul_en) formData.append("judul_en", data.judul_en);
    formData.append("kategori", data.kategori);
    formData.append("konten", data.konten);
    if (data.konten_en) formData.append("konten_en", data.konten_en);
    if (data.tanggal_acara) formData.append("tanggal_acara", data.tanggal_acara);
    if (data.lokasi) formData.append("lokasi", data.lokasi);
    if (data.gambar_cover_url) formData.append("gambar_cover_url", data.gambar_cover_url);

    const res = await createInformasiAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/informasi-publik" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tambah Informasi Publik</h1>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Judul Informasi <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("judul")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Jadwal Posyandu Bulan Ini"
            />
            {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Kategori <span className="text-red-500">*</span></label>
            <select
              {...register("kategori")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
            >
              <option value="pengumuman">Pengumuman</option>
              <option value="kegiatan">Kegiatan</option>
              <option value="jadwal_rapat">Jadwal Rapat</option>
            </select>
            {errors.kategori && <p className="text-red-500 text-xs mt-1">{errors.kategori.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Isi Konten <span className="text-red-500">*</span></label>
            <textarea
              {...register("konten")}
              rows={6}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              placeholder="Tuliskan isi informasi di sini..."
            ></textarea>
            {errors.konten && <p className="text-red-500 text-xs mt-1">{errors.konten.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tanggal Acara (opsional)</label>
              <input
                type="datetime-local"
                {...register("tanggal_acara")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Lokasi (opsional)</label>
              <input
                type="text"
                {...register("lokasi")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: Aula Kecamatan"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Gambar Cover (opsional)</label>
            <ImageUpload 
              value={gambarCoverUrl}
              onChange={(url) => setValue("gambar_cover_url", url, { shouldValidate: true })}
              folder="informasi"
            />
            {errors.gambar_cover_url && <p className="text-red-500 text-xs mt-1">{errors.gambar_cover_url.message}</p>}
          </div>

          {/* Section Bahasa Inggris */}
          <div className="border border-surface rounded-lg">
            <button
              type="button"
              onClick={() => setShowEn(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text/70 hover:text-text hover:bg-surface/40 rounded-lg transition-colors text-left"
            >
              <Globe size={15} className="text-secondary flex-shrink-0" />
              <span className="font-medium">Versi Bahasa Inggris (opsional)</span>
              <span className="ml-auto text-xs text-text/40">
                {showEn ? "Sembunyikan" : "Tampilkan"}
              </span>
            </button>
            {showEn && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface pt-4">
                <p className="text-xs text-text/50">
                  Kosongkan jika tidak diperlukan — halaman <span className="font-mono">/en/</span> akan otomatis menampilkan versi Indonesia sebagai fallback.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Judul (Bahasa Inggris)</label>
                  <input
                    type="text"
                    {...register("judul_en")}
                    className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                    placeholder="English title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Isi Konten (Bahasa Inggris)</label>
                  <textarea
                    {...register("konten_en")}
                    rows={6}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="English content..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/informasi-publik">Batal</Link>
            </Button>
            <Button type="submit" loading={loading}>
              Simpan & Terbitkan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
