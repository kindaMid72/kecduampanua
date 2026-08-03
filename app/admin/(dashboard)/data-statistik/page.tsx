import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function DataStatistikPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("data_statistik")
    .select("*")
    .order("tahun_data", { ascending: false })
    .order("nama_desa_kelurahan", { ascending: true });

  if (error) {
    console.error(error);
  }

  const statistik = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Data Statistik</h1>
          <p className="text-sm text-text/60">Kelola data jumlah penduduk desa/kelurahan.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/data-statistik/tambah">
            <Plus size={16} /> Tambah Data
          </Link>
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Desa / Kelurahan</th>
                <th className="px-6 py-4 font-medium text-right">Jumlah Penduduk</th>
                <th className="px-6 py-4 font-medium text-center">Tahun</th>
                <th className="px-6 py-4 font-medium text-right">Terakhir Diperbarui</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {statistik.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text/50">
                    Belum ada data statistik.
                  </td>
                </tr>
              ) : (
                statistik.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-text">
                      {item.nama_desa_kelurahan}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.jumlah_penduduk ? new Intl.NumberFormat("id-ID").format(item.jumlah_penduduk) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {item.tahun_data}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right">
                      {item.updated_at
                        ? formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: localeId })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                        <Link href={`/admin/data-statistik/${item.id}/ubah`}>
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
