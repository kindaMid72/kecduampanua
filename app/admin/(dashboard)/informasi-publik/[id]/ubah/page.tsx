"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { informasiPublikSchema, type InformasiPublikInput } from "@/lib/validations/informasi-publik";
import { updateInformasiAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Globe, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useRouter } from "next/navigation";

export default function UbahInformasiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);

  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<InformasiPublikInput>({
    resolver: zodResolver(informasiPublikSchema),
  });

  const gambarCoverUrl = watch("gambar_cover_url") || "";

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("informasi_publik")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Gagal memuat data. Mungkin sudah dihapus.");
      } else {
        reset({
          judul: data.judul,
          judul_en: data.judul_en || "",
          kategori: data.kategori,
          konten: data.konten,
          konten_en: data.konten_en || "",
          tanggal_acara: data.tanggal_acara ? data.tanggal_acara.slice(0, 16) : "",
          lokasi: data.lokasi || "",
          gambar_cover_url: data.gambar_cover_url || "",
          status: data.status,
        });
        // Auto-buka section EN jika sudah ada konten EN tersimpan
        if (data.judul_en || data.konten_en) setShowEn(true);
      }
      setFetching(false);
    }
    fetchData();
  }, [id, supabase, reset]);

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
    if (data.status) formData.append("status", data.status);

    const res = await updateInformasiAction(id, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus informasi publik ini? Aksi ini tidak dapat dibatalkan.")) return;
    setLoading(true);
    
    // Asumsikan `deleteInformasiAction` sudah dibuat.
    const { deleteInformasiAction } = await import("../../actions");
    const res = await deleteInformasiAction(id);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/informasi-publik");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/informasi-publik" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Ubah Informasi Publik</h1>
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

          {/* Opsi Status */}
          <div className="pt-4 border-t border-surface mt-6">
            <label className="block text-sm font-medium mb-1.5">Status Publikasi</label>
            <select
              {...register("status")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
            >
              <option value="published">Diterbitkan</option>
              <option value="diarsipkan">Diarsipkan (Draft / Sembunyikan)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-between gap-3 border-t border-surface mt-6">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              className="gap-2"
            >
              <Trash2 size={16} /> Hapus Informasi
            </Button>
            
            <div className="flex gap-3">
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/informasi-publik">Batal</Link>
              </Button>
              <Button type="submit" loading={loading}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
