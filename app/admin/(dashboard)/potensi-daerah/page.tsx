import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Image from "next/image";

export default async function PotensiDaerahPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("potensi_daerah")
    .select("*")
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const potensi = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Potensi Daerah</h1>
          <p className="text-sm text-text/60">Kelola informasi potensi ekonomi, wisata, dan pengolahan.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/potensi-daerah/tambah">
            <Plus size={16} /> Tambah Data
          </Link>
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium w-16">No</th>
                <th className="px-6 py-4 font-medium">Potensi</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Terakhir Diperbarui</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {potensi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text/50">
                    Belum ada data potensi daerah.
                  </td>
                </tr>
              ) : (
                potensi.map((item, index) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-text/50">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface overflow-hidden flex-shrink-0">
                          {item.gambar_url ? (
                            <Image src={item.gambar_url} alt={item.judul} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text/30 font-bold">
                              {item.judul.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">{item.judul}</p>
                          <p className="text-xs text-text/50 truncate max-w-[200px]">{item.lokasi || "Lokasi tidak diset"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'published' ? 'bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)]' : 'bg-surface text-text/60'
                      }`}>
                        {item.status === 'published' ? 'Diterbitkan' : 'Diarsipkan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right">
                      {item.updated_at
                        ? formatDistanceToNow(new Date(item.updated_at || item.created_at), { addSuffix: true, locale: localeId })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                        <Link href={`/admin/potensi-daerah/${item.id}/ubah`}>
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
