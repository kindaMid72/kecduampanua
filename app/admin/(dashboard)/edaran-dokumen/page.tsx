import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Plus, Edit, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function EdaranDokumenPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dokumen_edaran")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const edaran = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Edaran & Dokumen</h1>
          <p className="text-sm text-text/60">Kelola regulasi, panduan, dan laporan untuk publik.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/edaran-dokumen/tambah">
            <Plus size={16} /> Tambah Dokumen
          </Link>
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Judul Dokumen</th>
                <th className="px-6 py-4 font-medium">Nomor / Kategori</th>
                <th className="px-6 py-4 font-medium text-center">Tanggal Terbit</th>
                <th className="px-6 py-4 font-medium text-right">Diunggah Pada</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {edaran.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text/50">
                    Belum ada edaran dokumen.
                  </td>
                </tr>
              ) : (
                edaran.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface flex items-center justify-center flex-shrink-0 text-text/40">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-text">{item.judul}</p>
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            Lihat File
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{item.nomor_surat || "-"}</p>
                      {item.kategori && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize mt-1">
                          {item.kategori}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-text/80">
                        {new Date(item.tanggal_terbit).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right">
                      {item.created_at
                        ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeId })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                        <Link href={`/admin/edaran-dokumen/${item.id}/ubah`}>
                          <Edit size={16} />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
