"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { edaranDokumenSchema, type EdaranDokumenInput } from "@/lib/validations/edaran-dokumen";
import { createEdaranAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";

export default function TambahEdaranPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EdaranDokumenInput>({
    resolver: zodResolver(edaranDokumenSchema),
    defaultValues: { 
      tanggal_terbit: new Date().toISOString().split('T')[0]
    }
  });

  const fileUrl = watch("file_url") || "";

  async function onSubmit(data: EdaranDokumenInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("judul", data.judul);
    if (data.nomor_surat) formData.append("nomor_surat", data.nomor_surat);
    if (data.kategori) formData.append("kategori", data.kategori);
    formData.append("deskripsi", data.deskripsi);
    formData.append("file_url", data.file_url);
    formData.append("tanggal_terbit", data.tanggal_terbit);

    const res = await createEdaranAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/edaran-dokumen" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tambah Edaran & Dokumen</h1>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Judul Dokumen <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register("judul")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Peraturan Camat No 1 Tahun 2026"
            />
            {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nomor Surat / Dokumen</label>
              <input
                type="text"
                {...register("nomor_surat")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Opsional, misal: 100/123/Kec.Dua"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kategori</label>
              <input
                type="text"
                {...register("kategori")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                placeholder="Contoh: Regulasi, Panduan, dll"
              />
              {errors.kategori && <p className="text-red-500 text-xs mt-1">{errors.kategori.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tanggal Terbit <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register("tanggal_terbit")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
              {errors.tanggal_terbit && <p className="text-red-500 text-xs mt-1">{errors.tanggal_terbit.message}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi Ringkas <span className="text-red-500">*</span></label>
            <textarea
              {...register("deskripsi")}
              rows={3}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Jelaskan isi atau tujuan dari dokumen ini..."
            />
            {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">File Dokumen (PDF, max 10MB) <span className="text-red-500">*</span></label>
            <FileUpload 
              value={fileUrl}
              onChange={(url) => setValue("file_url", url, { shouldValidate: true })}
              folder="dokumen"
              accept=".pdf"
            />
            {errors.file_url && <p className="text-red-500 text-xs mt-1">{errors.file_url.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface mt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/edaran-dokumen">Batal</Link>
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
