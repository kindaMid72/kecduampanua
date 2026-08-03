"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { layananSchema, type LayananInput } from "@/lib/validations/standar-pelayanan";
import { updateLayananAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FileUpload } from "@/components/ui/FileUpload";
import { useRouter } from "next/navigation";

export default function UbahLayananPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);

  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<LayananInput>({
    resolver: zodResolver(layananSchema),
  });

  const syarat = watch("syarat_dokumen") || [];
  const dokumenStandarUrl = watch("dokumen_standar_pelayanan_url") || "";

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("layanan")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Gagal memuat data. Mungkin sudah dihapus.");
      } else {
        reset({
          nama_layanan: data.nama_layanan,
          nama_layanan_en: data.nama_layanan_en || "",
          deskripsi: data.deskripsi || "",
          deskripsi_en: data.deskripsi_en || "",
          syarat_dokumen: data.syarat_dokumen?.length ? data.syarat_dokumen : [""],
          alur_proses: data.alur_proses || "",
          alur_proses_en: data.alur_proses_en || "",
          estimasi_waktu: data.estimasi_waktu || "",
          link_formulir_url: data.link_formulir_url || "",
          dokumen_standar_pelayanan_url: data.dokumen_standar_pelayanan_url || "",
          status: data.status,
          urutan: data.urutan,
        });
        // Auto-buka section EN jika sudah ada konten EN tersimpan
        if (data.nama_layanan_en || data.deskripsi_en || data.alur_proses_en) setShowEn(true);
      }
      setFetching(false);
    }
    fetchData();
  }, [id, supabase, reset]);

  async function onSubmit(data: LayananInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("nama_layanan", data.nama_layanan);
    if (data.nama_layanan_en) formData.append("nama_layanan_en", data.nama_layanan_en);
    if (data.deskripsi) formData.append("deskripsi", data.deskripsi);
    if (data.deskripsi_en) formData.append("deskripsi_en", data.deskripsi_en);
    if (data.alur_proses) formData.append("alur_proses", data.alur_proses);
    if (data.alur_proses_en) formData.append("alur_proses_en", data.alur_proses_en);
    if (data.estimasi_waktu) formData.append("estimasi_waktu", data.estimasi_waktu);
    if (data.link_formulir_url) formData.append("link_formulir_url", data.link_formulir_url);
    if (data.dokumen_standar_pelayanan_url) formData.append("dokumen_standar_pelayanan_url", data.dokumen_standar_pelayanan_url);
    if (data.status) formData.append("status", data.status);
    formData.append("urutan", String(data.urutan));

    data.syarat_dokumen?.forEach(s => {
      if (s.trim()) formData.append("syarat_dokumen", s);
    });

    const res = await updateLayananAction(id, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus standar pelayanan ini? Aksi ini tidak dapat dibatalkan.")) return;
    setLoading(true);
    
    // Asumsikan deleteLayananAction sudah dibuat
    const { deleteLayananAction } = await import("../../actions");
    const res = await deleteLayananAction(id);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/standar-pelayanan");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/standar-pelayanan" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Ubah Standar Pelayanan</h1>
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
            />
            {errors.nama_layanan && <p className="text-red-500 text-xs mt-1">{errors.nama_layanan.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi (opsional)</label>
            <textarea
              {...register("deskripsi")}
              rows={3}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
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
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Estimasi Waktu (opsional)</label>
              <input
                type="text"
                {...register("estimasi_waktu")}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
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
              />
              {errors.link_formulir_url && <p className="text-red-500 text-xs mt-1">{errors.link_formulir_url.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Dokumen Standar (opsional)</label>
              <FileUpload 
                value={dokumenStandarUrl}
                onChange={(url) => setValue("dokumen_standar_pelayanan_url", url, { shouldValidate: true })}
                folder="dokumen"
                accept=".pdf,.doc,.docx"
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

          {/* Section Bahasa Inggris */}
          <div className="border border-surface rounded-lg">
            <button
              type="button"
              onClick={() => setShowEn(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text/70 hover:text-text hover:bg-surface/40 rounded-lg transition-colors text-left"
            >
              <Globe size={15} className="text-secondary flex-shrink-0" />
              <span className="font-medium">Versi Bahasa Inggris (opsional)</span>
              <span className="ml-auto text-xs text-text/40">{showEn ? "Sembunyikan" : "Tampilkan"}</span>
            </button>
            {showEn && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface pt-4">
                <p className="text-xs text-text/50">
                  Kosongkan jika tidak diperlukan — halaman <span className="font-mono">/en/</span> akan otomatis menampilkan versi Indonesia sebagai fallback.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Layanan (Bahasa Inggris)</label>
                  <input
                    type="text"
                    {...register("nama_layanan_en")}
                    className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                    placeholder="English service name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Deskripsi (Bahasa Inggris)</label>
                  <textarea
                    {...register("deskripsi_en")}
                    rows={3}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="English description..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Alur Proses (Bahasa Inggris)</label>
                  <textarea
                    {...register("alur_proses_en")}
                    rows={4}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="English process flow..."
                  ></textarea>
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
              <Trash2 size={16} /> Hapus Pelayanan
            </Button>
            
            <div className="flex gap-3">
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/standar-pelayanan">Batal</Link>
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
