import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Edit } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { parseAdminParams, pageToRange, calcTotalPages } from "@/lib/admin-query";

export const revalidate = 0;

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LayananAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);
  const filterStatus = params.status || "";

  const supabase = await createClient();

  let query = supabase
    .from("layanan")
    .select("id, nama_layanan, status, urutan, estimasi_waktu", { count: "exact" })
    .order("urutan", { ascending: true })
    .range(from, to);

  if (search) query = query.ilike("nama_layanan", `%${search}%`);
  if (filterStatus) query = query.eq("status", filterStatus);

  const { data: layanan, count, error } = await query;

  if (error) {
    return <ErrorState variant="inline" message="Error memuat data layanan." />;
  }

  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Standar Pelayanan</h1>
        <p className="text-sm text-text/60">Kelola prosedur, syarat, dan estimasi waktu layanan.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari nama layanan..."
        searchValue={search}
        totalCount={count ?? 0}
        addHref="/admin/standar-pelayanan/tambah"
        addLabel="Tambah Layanan"
        filters={[
          {
            key: "status",
            label: "Status",
            value: filterStatus,
            options: [
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ],
          },
        ]}
      />

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
              {!layanan || layanan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text/50 italic">
                    {search || filterStatus
                      ? "Tidak ada layanan yang cocok dengan filter ini."
                      : "Belum ada data layanan publik."}
                  </td>
                </tr>
              ) : (
                layanan.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 font-mono text-text/60">{item.urutan}</td>
                    <td className="px-6 py-4 font-medium text-text">{item.nama_layanan}</td>
                    <td className="px-6 py-4 text-text/60">{item.estimasi_waktu || "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === "aktif" ? "success" : "inactive"}>
                        {item.status === "aktif" ? "Aktif" : "Nonaktif"}
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
