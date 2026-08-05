import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Edit } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { parseAdminParams, pageToRange, calcTotalPages } from "@/lib/admin-query";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PengaduanPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);
  const filterStatus = params.status || "";
  const filterKategori = params.kategori || "";

  const supabase = await createClient();

  let query = supabase
    .from("pengaduan")
    .select(
      "id, nomor_tracking, nama_pelapor, kontak_pelapor, kategori, status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `nama_pelapor.ilike.%${search}%,nomor_tracking.ilike.%${search}%`
    );
  }
  if (filterStatus) query = query.eq("status", filterStatus);
  if (filterKategori) query = query.ilike("kategori", `%${filterKategori}%`);

  const { data, count, error } = await query;
  if (error) console.error(error);

  const pengaduan = data || [];
  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  const statusStyle: Record<string, string> = {
    baru: "bg-red-100 text-red-700",
    diproses: "bg-amber-100 text-amber-700",
    selesai: "bg-green-100 text-green-700",
  };
  const statusLabel: Record<string, string> = {
    baru: "Baru",
    diproses: "Diproses",
    selesai: "Selesai",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Pengaduan Masyarakat</h1>
        <p className="text-sm text-text/60">Kelola dan tindak lanjuti laporan masyarakat.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari pelapor atau no. tracking..."
        searchValue={search}
        totalCount={count ?? 0}
        filters={[
          {
            key: "status",
            label: "Status",
            value: filterStatus,
            options: [
              { value: "baru", label: "Baru" },
              { value: "diproses", label: "Diproses" },
              { value: "selesai", label: "Selesai" },
            ],
          },
          {
            key: "kategori",
            label: "Kategori",
            value: filterKategori,
            options: [
              { value: "infrastruktur", label: "Infrastruktur" },
              { value: "pelayanan", label: "Pelayanan" },
              { value: "keamanan", label: "Keamanan" },
              { value: "lingkungan", label: "Lingkungan" },
              { value: "lainnya", label: "Lainnya" },
            ],
          },
        ]}
      />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs font-mono">
              <tr>
                <th className="px-6 py-3">No Tracking</th>
                <th className="px-6 py-3">Pelapor</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Tanggal Masuk</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {pengaduan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text/50 italic">
                    {search || filterStatus || filterKategori
                      ? "Tidak ada pengaduan yang cocok dengan filter ini."
                      : "Belum ada data pengaduan masuk."}
                  </td>
                </tr>
              ) : (
                pengaduan.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-primary text-xs">
                      {item.nomor_tracking}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-text">{item.nama_pelapor}</p>
                      <p className="text-xs text-text/60">{item.kontak_pelapor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize">
                        {item.kategori || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          statusStyle[item.status] || "bg-surface text-text/60"
                        }`}
                      >
                        {statusLabel[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xs">
                          {format(new Date(item.created_at), "dd MMM yyyy", { locale: localeId })}
                        </span>
                        <span className="text-xs text-text/40">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: localeId,
                          })}
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

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={count ?? 0}
        pageSize={pageSize}
        searchParamsString={spString}
      />
    </div>
  );
}
