import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { parseAdminParams, pageToRange, calcTotalPages } from "@/lib/admin-query";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DataStatistikPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);
  const filterTahun = params.tahun || "";

  const supabase = await createClient();

  // Ambil daftar tahun unik untuk dropdown filter
  const { data: tahunList } = await supabase
    .from("data_statistik")
    .select("tahun_data")
    .order("tahun_data", { ascending: false });

  const uniqueTahun = [...new Set((tahunList || []).map((r) => r.tahun_data))];

  let query = supabase
    .from("data_statistik")
    .select("id, nama_desa_kelurahan, jumlah_penduduk, tahun_data, updated_at", { count: "exact" })
    .order("tahun_data", { ascending: false })
    .order("nama_desa_kelurahan", { ascending: true })
    .range(from, to);

  if (search) query = query.ilike("nama_desa_kelurahan", `%${search}%`);
  if (filterTahun) query = query.eq("tahun_data", parseInt(filterTahun, 10));

  const { data, count, error } = await query;
  if (error) console.error(error);

  const statistik = data || [];
  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Data Statistik</h1>
        <p className="text-sm text-text/60">Kelola data jumlah penduduk desa/kelurahan.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari desa atau kelurahan..."
        searchValue={search}
        totalCount={count ?? 0}
        addHref="/admin/data-statistik/tambah"
        addLabel="Tambah Data"
        filters={[
          {
            key: "tahun",
            label: "Tahun",
            value: filterTahun,
            options: uniqueTahun.map((t) => ({
              value: String(t),
              label: String(t),
            })),
          },
        ]}
      />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs font-mono">
              <tr>
                <th className="px-6 py-3">Desa / Kelurahan</th>
                <th className="px-6 py-3 text-right">Jumlah Penduduk</th>
                <th className="px-6 py-3 text-center">Tahun</th>
                <th className="px-6 py-3 text-right">Terakhir Diperbarui</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {statistik.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text/50 italic">
                    {search || filterTahun
                      ? "Tidak ada data yang cocok dengan filter ini."
                      : "Belum ada data statistik."}
                  </td>
                </tr>
              ) : (
                statistik.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-text">{item.nama_desa_kelurahan}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {item.jumlah_penduduk
                        ? new Intl.NumberFormat("id-ID").format(item.jumlah_penduduk)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono font-medium">
                        {item.tahun_data}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right text-xs">
                      {item.updated_at
                        ? formatDistanceToNow(new Date(item.updated_at), {
                            addSuffix: true,
                            locale: localeId,
                          })
                        : "—"}
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
