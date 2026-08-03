"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { edaranDokumenSchema, type EdaranDokumenInput } from "@/lib/validations/edaran-dokumen";
import { updateEdaranAction, deleteEdaranAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UbahEdaranPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<EdaranDokumenInput>({
    resolver: zodResolver(edaranDokumenSchema),
  });

  const fileUrl = watch("file_url") || "";

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("dokumen_edaran")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Gagal memuat data. Mungkin sudah dihapus.");
      } else {
        reset({
          judul: data.judul,
          nomor_surat: data.nomor_surat || undefined,
          kategori: data.kategori || undefined,
          deskripsi: data.deskripsi,
          file_url: data.file_url,
          tanggal_terbit: data.tanggal_terbit,
        });
      }
      setFetching(false);
    }
    fetchData();
  }, [id, supabase, reset]);

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

    const res = await updateEdaranAction(id, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus dokumen ini? Aksi ini tidak dapat dibatalkan.")) return;
    setLoading(true);
    const res = await deleteEdaranAction(id);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/edaran-dokumen");
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/edaran-dokumen" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Ubah Edaran & Dokumen</h1>
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

          <div className="pt-4 flex justify-between gap-3 border-t border-surface mt-6">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              className="gap-2"
            >
              <Trash2 size={16} /> Hapus Data
            </Button>
            
            <div className="flex gap-3">
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/edaran-dokumen">Batal</Link>
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
