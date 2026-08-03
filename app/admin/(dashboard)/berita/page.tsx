import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const revalidate = 0;

export default async function BeritaAdminPage() {
  const supabase = await createClient();

  const { data: beritaList, error } = await supabase
    .from("berita")
    .select("id, judul, kategori, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <p className="text-red-500">Error memuat data berita.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Berita</h1>
          <p className="text-sm text-text/60">Kelola artikel dan liputan kegiatan kecamatan.</p>
        </div>
        <Button asChild>
          <Link href="/admin/berita/tambah">
            <Plus size={16} />
            Tambah Berita
          </Link>
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text/50 uppercase bg-surface/50 font-mono">
              <tr>
                <th className="px-6 py-3">Judul</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Tanggal Dibuat</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {beritaList?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text/50 italic">
                    Belum ada berita yang diterbitkan.
                  </td>
                </tr>
              ) : (
                beritaList?.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 font-medium text-text">{item.judul}</td>
                    <td className="px-6 py-4 text-text/60">
                      {item.kategori ?? <span className="italic text-text/40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === "published" ? "success" : "default"}>
                        {item.status === "published" ? "Terbit" : "Diarsipkan"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/berita/${item.id}/ubah`}
                        className="inline-flex items-center gap-1 text-secondary hover:text-primary transition-colors text-xs font-medium"
                      >
                        <Edit size={14} /> Ubah
                      </Link>
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
