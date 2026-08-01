"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { informasiPublikSchema, type InformasiPublikInput } from "@/lib/validations/informasi-publik";
import { updateInformasiAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UbahInformasiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InformasiPublikInput>({
    resolver: zodResolver(informasiPublikSchema),
  });

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
          kategori: data.kategori,
          konten: data.konten,
          tanggal_acara: data.tanggal_acara ? data.tanggal_acara.slice(0, 16) : "",
          lokasi: data.lokasi || "",
          gambar_cover_url: data.gambar_cover_url || "",
        });
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
    formData.append("kategori", data.kategori);
    formData.append("konten", data.konten);
    if (data.tanggal_acara) formData.append("tanggal_acara", data.tanggal_acara);
    if (data.lokasi) formData.append("lokasi", data.lokasi);
    if (data.gambar_cover_url) formData.append("gambar_cover_url", data.gambar_cover_url);

    const res = await updateInformasiAction(id, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

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

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/informasi-publik">Batal</Link>
            </Button>
            <Button type="submit" loading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
