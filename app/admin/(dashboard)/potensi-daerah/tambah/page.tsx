"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { potensiDaerahSchema, type PotensiDaerahInput } from "@/lib/validations/potensi-daerah";
import { createPotensiAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function TambahPotensiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PotensiDaerahInput>({
    resolver: zodResolver(potensiDaerahSchema),
    defaultValues: { kategori: "ekonomi", status: "published", urutan: 0 }
  });

  const gambarUrl = watch("gambar_url") || "";

  async function onSubmit(data: PotensiDaerahInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("judul", data.judul);
    if (data.judul_en) formData.append("judul_en", data.judul_en);
    formData.append("kategori", data.kategori);
    formData.append("deskripsi", data.deskripsi);
    if (data.deskripsi_en) formData.append("deskripsi_en", data.deskripsi_en);
    if (data.lokasi) formData.append("lokasi", data.lokasi);
    if (data.gambar_url) formData.append("gambar_url", data.gambar_url);
    formData.append("status", data.status);
    formData.append("urutan", String(data.urutan));

    const res = await createPotensiAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/potensi-daerah" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tambah Potensi Daerah</h1>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Judul Potensi <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("judul")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Kerajinan Rotan"
            />
            {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Kategori <span className="text-red-500">*</span></label>
              <select
                {...register("kategori")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
              >
                <option value="ekonomi">Ekonomi</option>
                <option value="wisata">Wisata</option>
                <option value="pengolahan">Pengolahan</option>
              </select>
              {errors.kategori && <p className="text-red-500 text-xs mt-1">{errors.kategori.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status <span className="text-red-500">*</span></label>
              <select
                {...register("status")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
              >
                <option value="published">Diterbitkan</option>
                <option value="diarsipkan">Diarsipkan</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi Singkat <span className="text-red-500">*</span></label>
            <textarea
              {...register("deskripsi")}
              rows={4}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              placeholder="Jelaskan potensi ini secara singkat..."
            ></textarea>
            {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Lokasi</label>
              <input
                type="text"
                {...register("lokasi")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: Desa Tatae"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Urutan Tampil (Opsional)</label>
              <input
                type="number"
                {...register("urutan")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Gambar Potensi</label>
            <ImageUpload 
              value={gambarUrl}
              onChange={(url) => setValue("gambar_url", url, { shouldValidate: true })}
              folder="potensi"
            />
            {errors.gambar_url && <p className="text-red-500 text-xs mt-1">{errors.gambar_url.message}</p>}
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
                  <label className="block text-sm font-medium mb-1.5">Deskripsi (Bahasa Inggris)</label>
                  <textarea
                    {...register("deskripsi_en")}
                    rows={4}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="English description..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/potensi-daerah">Batal</Link>
            </Button>
            <Button type="submit" loading={loading}>
              Simpan Data
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
