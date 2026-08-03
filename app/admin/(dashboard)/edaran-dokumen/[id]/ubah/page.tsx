"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { edaranDokumenSchema, type EdaranDokumenInput } from "@/lib/validations/edaran-dokumen";
import { updateEdaranAction, deleteEdaranAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Globe, Trash2 } from "lucide-react";
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
  const [showEn, setShowEn] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<EdaranDokumenInput>({
    resolver: zodResolver(edaranDokumenSchema),
  });

  const fileUrl = watch("file_url") || "";

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("edaran_dokumen")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Gagal memuat data. Mungkin sudah dihapus.");
      } else {
        reset({
          judul: data.judul,
          judul_en: data.judul_en || undefined,
          nomor_dokumen: data.nomor_dokumen || undefined,
          kategori: data.kategori,
          file_url: data.file_url,
          status: data.status,
        });
        if (data.judul_en) {
          setShowEn(true);
        }
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
    if (data.judul_en) formData.append("judul_en", data.judul_en);
    if (data.nomor_dokumen) formData.append("nomor_dokumen", data.nomor_dokumen);
    formData.append("kategori", data.kategori);
    formData.append("file_url", data.file_url);
    formData.append("status", data.status);

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
              <label className="block text-sm font-medium mb-1.5">Nomor Dokumen</label>
              <input
                type="text"
                {...register("nomor_dokumen")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Opsional, misal: 100/123/Kec.Dua"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kategori <span className="text-red-500">*</span></label>
              <select
                {...register("kategori")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
              >
                <option value="regulasi">Regulasi</option>
                <option value="panduan">Panduan</option>
                <option value="laporan">Laporan</option>
                <option value="lainnya">Lainnya</option>
              </select>
              {errors.kategori && <p className="text-red-500 text-xs mt-1">{errors.kategori.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Status <span className="text-red-500">*</span></label>
            <select
              {...register("status")}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white max-w-[200px]"
            >
              <option value="published">Diterbitkan</option>
              <option value="diarsipkan">Diarsipkan</option>
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
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
              </div>
            )}
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
