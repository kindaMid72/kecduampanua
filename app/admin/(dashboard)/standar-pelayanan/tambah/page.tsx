"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { layananSchema, type LayananInput } from "@/lib/validations/standar-pelayanan";
import { createLayananAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function TambahLayananPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<LayananInput>({
    resolver: zodResolver(layananSchema),
    defaultValues: { status: "aktif", urutan: 0, syarat_dokumen: [""] }
  });

  const syarat = watch("syarat_dokumen") || [];

  async function onSubmit(data: LayananInput) {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("nama_layanan", data.nama_layanan);
    if (data.deskripsi) formData.append("deskripsi", data.deskripsi);
    if (data.alur_proses) formData.append("alur_proses", data.alur_proses);
    if (data.estimasi_waktu) formData.append("estimasi_waktu", data.estimasi_waktu);
    if (data.link_formulir_url) formData.append("link_formulir_url", data.link_formulir_url);
    if (data.dokumen_standar_pelayanan_url) formData.append("dokumen_standar_pelayanan_url", data.dokumen_standar_pelayanan_url);
    if (data.status) formData.append("status", data.status);
    formData.append("urutan", String(data.urutan));

    data.syarat_dokumen?.forEach(s => {
      if (s.trim()) formData.append("syarat_dokumen", s);
    });

    const res = await createLayananAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/standar-pelayanan" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tambah Standar Pelayanan</h1>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Layanan <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("nama_layanan")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Pembuatan KTP Baru"
            />
            {errors.nama_layanan && <p className="text-red-500 text-xs mt-1">{errors.nama_layanan.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi (opsional)</label>
            <textarea
              {...register("deskripsi")}
              rows={3}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              placeholder="Penjelasan singkat layanan..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Syarat Dokumen</label>
            <div className="space-y-2">
              {syarat.map((s, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    {...register(`syarat_dokumen.${index}` as const)}
                    className="flex-1 h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Contoh: Fotokopi Kartu Keluarga"
                  />
                  {syarat.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSyarat = [...syarat];
                        newSyarat.splice(index, 1);
                        setValue("syarat_dokumen", newSyarat);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("syarat_dokumen", [...syarat, ""])}
              >
                <Plus size={14} /> Tambah Syarat
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Alur Proses (opsional)</label>
            <textarea
              {...register("alur_proses")}
              rows={4}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              placeholder="Tulis tiap langkah di baris baru..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Estimasi Waktu (opsional)</label>
              <input
                type="text"
                {...register("estimasi_waktu")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: 1 Hari Kerja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Urutan Tampil</label>
              <input
                type="number"
                {...register("urutan", { valueAsNumber: true })}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Link Formulir (opsional)</label>
              <input
                type="url"
                {...register("link_formulir_url")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://..."
              />
              {errors.link_formulir_url && <p className="text-red-500 text-xs mt-1">{errors.link_formulir_url.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Dokumen Standar (opsional)</label>
              <input
                type="url"
                {...register("dokumen_standar_pelayanan_url")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://..."
              />
              {errors.dokumen_standar_pelayanan_url && <p className="text-red-500 text-xs mt-1">{errors.dokumen_standar_pelayanan_url.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              {...register("status")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
            >
              <option value="aktif">Aktif (Ditampilkan)</option>
              <option value="nonaktif">Nonaktif (Disembunyikan)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/standar-pelayanan">Batal</Link>
            </Button>
            <Button type="submit" loading={loading}>
              Simpan Layanan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
