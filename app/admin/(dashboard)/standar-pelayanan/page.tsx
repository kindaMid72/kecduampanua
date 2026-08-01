import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const revalidate = 0; // Always fresh for admin

export default async function LayananAdminPage() {
  const supabase = await createClient();

  const { data: layanan, error } = await supabase
    .from("layanan")
    .select("id, nama_layanan, status, urutan, estimasi_waktu")
    .order("urutan", { ascending: true });

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
          <h1 className="font-display text-2xl font-semibold text-primary">Standar Pelayanan</h1>
          <p className="text-sm text-text/60">Kelola prosedur, syarat, dan estimasi waktu layanan.</p>
        </div>
        <Button asChild>
          <Link href="/admin/standar-pelayanan/tambah">
            <Plus size={16} />
            Tambah Layanan
          </Link>
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text/50 uppercase bg-surface/50 font-mono">
              <tr>
                <th className="px-6 py-3">Urutan</th>
                <th className="px-6 py-3">Nama Layanan</th>
                <th className="px-6 py-3">Estimasi Waktu</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {layanan?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text/50 italic">
                    Belum ada data layanan publik.
                  </td>
                </tr>
              ) : (
                layanan?.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 font-mono">{item.urutan}</td>
                    <td className="px-6 py-4 font-medium text-text">{item.nama_layanan}</td>
                    <td className="px-6 py-4">{item.estimasi_waktu || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === "aktif" ? "success" : "default"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/standar-pelayanan/${item.id}/ubah`}
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
