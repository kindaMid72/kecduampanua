"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dataStatistikSchema, type DataStatistikInput } from "@/lib/validations/data-statistik";
import { createDataStatistikAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TambahDataStatistikPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<DataStatistikInput>({
    resolver: zodResolver(dataStatistikSchema),
    defaultValues: {
      tahun_data: new Date().getFullYear(),
    }
  });

  async function onSubmit(data: DataStatistikInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("nama_desa_kelurahan", data.nama_desa_kelurahan);
    if (data.jumlah_penduduk) formData.append("jumlah_penduduk", String(data.jumlah_penduduk));
    formData.append("tahun_data", String(data.tahun_data));

    const res = await createDataStatistikAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/data-statistik" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tambah Data Statistik</h1>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Desa / Kelurahan <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("nama_desa_kelurahan")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Desa Tatae"
            />
            {errors.nama_desa_kelurahan && <p className="text-red-500 text-xs mt-1">{errors.nama_desa_kelurahan.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Jumlah Penduduk</label>
              <input
                type="number"
                {...register("jumlah_penduduk")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: 1500"
              />
              {errors.jumlah_penduduk && <p className="text-red-500 text-xs mt-1">{errors.jumlah_penduduk.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tahun Data <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...register("tahun_data")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
              {errors.tahun_data && <p className="text-red-500 text-xs mt-1">{errors.tahun_data.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/data-statistik">Batal</Link>
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
