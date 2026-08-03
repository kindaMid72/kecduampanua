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
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Bagian: Informasi Dasar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface pb-2">Informasi Dasar</h2>
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
                <label className="block text-sm font-medium mb-1.5">Jumlah Penduduk (Total) <span className="text-red-500">*</span></label>
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
          </div>

          {/* Bagian: Demografi */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface pb-2">Kependudukan (Demografi)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Usia 0-14 Tahun</label>
                <input type="number" {...register("penduduk_usia_0_14")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Usia 15-64 Tahun (Produktif)</label>
                <input type="number" {...register("penduduk_usia_15_64")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Usia &gt; 65 Tahun</label>
                <input type="number" {...register("penduduk_usia_65_ke_atas")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Laki-laki</label>
                <input type="number" {...register("penduduk_laki_laki")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Perempuan</label>
                <input type="number" {...register("penduduk_perempuan")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>

          {/* Bagian: Pendidikan & Kesehatan */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface pb-2">Pendidikan & Kesehatan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Murid SD & SMP</label>
                <input type="number" {...register("jumlah_murid_sd_smp")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Guru SD & SMP</label>
                <input type="number" {...register("jumlah_guru_sd_smp")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Penduduk Usia Sekolah</label>
                <input type="number" {...register("penduduk_usia_sekolah")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Total Sekolah</label>
                <input type="number" {...register("jumlah_sekolah")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <p className="text-xs text-text/60 italic pt-2">Fasilitas Kesehatan (Standar BPS):</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Rumah Sakit</label>
                <input type="number" {...register("jumlah_rumah_sakit")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Puskesmas / Pustu</label>
                <input type="number" {...register("jumlah_puskesmas")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Posyandu</label>
                <input type="number" {...register("jumlah_posyandu")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Klinik / Apotek</label>
                <input type="number" {...register("jumlah_klinik_apotek")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>

          {/* Bagian: Geografi */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface pb-2">Geografi & Aksesibilitas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Luas Wilayah (km²)</label>
                <input type="number" step="0.01" {...register("luas_wilayah_km2")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Jarak ke Ibukota Kecamatan (km)</label>
                <input type="number" step="0.1" {...register("jarak_ke_ibukota_km")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>

          {/* Bagian: Ekonomi */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface pb-2">Ekonomi, Agraria & Kelautan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Produksi Panen (Ton)</label>
                <input type="number" step="0.1" {...register("produksi_panen_ton")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Luas Panen (Ha)</label>
                <input type="number" step="0.1" {...register("luas_panen_ha")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Produksi Tangkapan Ikan (Ton)</label>
                <input type="number" step="0.1" {...register("tangkapan_ikan_ton")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Jumlah Nelayan</label>
                <input type="number" {...register("jumlah_nelayan")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Toko / Minimarket</label>
                <input type="number" {...register("jumlah_toko_minimarket")} className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none" />
              </div>
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
