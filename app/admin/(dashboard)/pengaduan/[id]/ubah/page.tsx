"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pengaduanAdminSchema, type PengaduanAdminInput } from "@/lib/validations/pengaduan";
import { updatePengaduanAction, deletePengaduanAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Trash2, Download, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function UbahPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pengaduan, setPengaduan] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PengaduanAdminInput>({
    resolver: zodResolver(pengaduanAdminSchema),
  });

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("pengaduan")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Gagal memuat data. Mungkin sudah dihapus.");
      } else {
        setPengaduan(data);
        reset({
          status: data.status,
          catatan_tindak_lanjut: data.catatan_tindak_lanjut || undefined,
        });
      }
      setFetching(false);
    }
    fetchData();
  }, [id, supabase, reset]);

  async function onSubmit(data: PengaduanAdminInput) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("status", data.status);
    if (data.catatan_tindak_lanjut) formData.append("catatan_tindak_lanjut", data.catatan_tindak_lanjut);

    const res = await updatePengaduanAction(id, formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus pengaduan ini? Aksi ini tidak dapat dibatalkan.")) return;
    setLoading(true);
    const res = await deletePengaduanAction(id);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/pengaduan");
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/pengaduan" className="inline-flex items-center gap-1 text-sm text-text/50 hover:text-text mb-4">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <h1 className="font-display text-2xl font-semibold text-primary">Tindak Lanjut Pengaduan</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      {pengaduan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card padding="md" className="space-y-4 bg-surface/30">
              <div className="flex items-center justify-between border-b border-surface pb-3">
                <span className="text-sm font-medium text-text/60">No. Tracking</span>
                <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded">
                  {pengaduan.nomor_tracking}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Pelapor</p>
                  <p className="font-medium text-text">{pengaduan.nama_pelapor}</p>
                </div>
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Kontak</p>
                  <p className="text-text">{pengaduan.kontak_pelapor}</p>
                </div>
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Tanggal Laporan</p>
                  <p className="text-text">
                    {format(new Date(pengaduan.created_at), "dd MMMM yyyy HH:mm", { locale: localeId })} WIB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Kategori</p>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize">
                    {pengaduan.kategori}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Deskripsi Pengaduan</p>
                  <div className="bg-white p-3 rounded border border-surface text-sm text-text/80 whitespace-pre-wrap">
                    {pengaduan.deskripsi}
                  </div>
                </div>
                
                {pengaduan.lampiran_url && (
                  <div>
                    <p className="text-xs text-text/50 uppercase tracking-wider mb-1">Lampiran</p>
                    <a 
                      href={pengaduan.lampiran_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface/80 rounded text-sm transition-colors text-primary"
                    >
                      <Download size={14} /> Lihat/Unduh Lampiran
                    </a>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card padding="md">
              <h2 className="font-medium text-lg mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-accent" /> Tindak Lanjut
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status Pengaduan <span className="text-red-500">*</span></label>
                  <select
                    {...register("status")}
                    className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="baru">Baru Masuk</option>
                    <option value="diproses">Sedang Diproses</option>
                    <option value="selesai">Selesai / Selesai Ditangani</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Catatan Tindak Lanjut</label>
                  <p className="text-xs text-text/50 mb-2">
                    Catatan ini dapat dilihat oleh pelapor saat mengecek status tiket mereka. Gunakan bahasa yang profesional.
                  </p>
                  <textarea
                    {...register("catatan_tindak_lanjut")}
                    className="w-full h-32 px-3 py-2 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="Contoh: Laporan sedang ditinjau oleh pihak terkait..."
                  />
                  {errors.catatan_tindak_lanjut && <p className="text-red-500 text-xs mt-1">{errors.catatan_tindak_lanjut.message}</p>}
                </div>

                <div className="pt-4 flex justify-between gap-3 border-t border-surface mt-6">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    loading={loading}
                    className="gap-2"
                  >
                    <Trash2 size={16} /> Hapus
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" asChild>
                      <Link href="/admin/pengaduan">Batal</Link>
                    </Button>
                    <Button type="submit" loading={loading}>
                      Simpan Update
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
