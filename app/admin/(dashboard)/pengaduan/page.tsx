import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Edit, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function PengaduanPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("pengaduan")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const pengaduan = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Pengaduan Masyarakat</h1>
          <p className="text-sm text-text/60">Kelola dan tindak lanjuti laporan masyarakat.</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">No Tracking</th>
                <th className="px-6 py-4 font-medium">Pelapor</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Tanggal Masuk</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {pengaduan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text/50">
                    Belum ada data pengaduan masuk.
                  </td>
                </tr>
              ) : (
                pengaduan.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-primary">
                      {item.nomor_tracking}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{item.nama_pelapor}</p>
                      <p className="text-xs text-text/60">{item.kontak_pelapor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'baru' ? 'bg-red-100 text-red-700' : 
                        item.status === 'diproses' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right">
                      <div className="flex flex-col items-end">
                        <span>{format(new Date(item.created_at), "dd MMM yyyy", { locale: localeId })}</span>
                        <span className="text-xs">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeId })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                        <Link href={`/admin/pengaduan/${item.id}/ubah`}>
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
