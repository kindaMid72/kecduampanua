import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const revalidate = 0; // Always fresh for admin

export default async function InformasiPublikAdminPage() {
  const supabase = await createClient();

  const { data: infos, error } = await supabase
    .from("informasi_publik")
    .select("id, judul, kategori, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <p className="text-red-500">Error loading data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Informasi Publik</h1>
          <p className="text-sm text-text/60">Kelola pengumuman, kegiatan, dan jadwal rapat.</p>
        </div>
        <Button asChild>
          <Link href="/admin/informasi-publik/tambah">
            <Plus size={16} />
            Tambah Informasi
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
              {infos?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text/50 italic">
                    Belum ada data informasi publik.
                  </td>
                </tr>
              ) : (
                infos?.map((info) => (
                  <tr key={info.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 font-medium text-text">{info.judul}</td>
                    <td className="px-6 py-4 capitalize">{info.kategori.replace("_", " ")}</td>
                    <td className="px-6 py-4">
                      <Badge variant={info.status === "published" ? "success" : "default"}>
                        {info.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(info.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/informasi-publik/${info.id}/ubah`}
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
