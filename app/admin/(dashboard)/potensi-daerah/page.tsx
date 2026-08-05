import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Edit } from "lucide-react";
import Image from "next/image";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { parseAdminParams, pageToRange, calcTotalPages } from "@/lib/admin-query";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PotensiDaerahPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);
  const filterKategori = params.kategori || "";
  const filterStatus = params.status || "";

  const supabase = await createClient();

  let query = supabase
    .from("potensi_daerah")
    .select("id, judul, kategori, status, lokasi, gambar_url, created_at", { count: "exact" })
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`judul.ilike.%${search}%,lokasi.ilike.%${search}%`);
  }
  if (filterKategori) query = query.eq("kategori", filterKategori);
  if (filterStatus) query = query.eq("status", filterStatus);

  const { data, count, error } = await query;
  // error fallback handled by data || []

  const potensi = data || [];
  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Potensi Daerah</h1>
        <p className="text-sm text-text/60">Kelola informasi potensi ekonomi, wisata, dan pengolahan.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari judul atau lokasi..."
        searchValue={search}
        totalCount={count ?? 0}
        addHref="/admin/potensi-daerah/tambah"
        addLabel="Tambah Data"
        filters={[
          {
            key: "kategori",
            label: "Kategori",
            value: filterKategori,
            options: [
              { value: "ekonomi", label: "Ekonomi" },
              { value: "wisata", label: "Wisata" },
              { value: "pengolahan", label: "Pengolahan" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: filterStatus,
            options: [
              { value: "published", label: "Diterbitkan" },
              { value: "diarsipkan", label: "Diarsipkan" },
            ],
          },
        ]}
      />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs font-mono">
              <tr>
                <th className="px-6 py-3 w-10">No</th>
                <th className="px-6 py-3">Potensi</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {potensi.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text/50 italic">
                    {search || filterKategori || filterStatus
                      ? "Tidak ada potensi daerah yang cocok dengan filter ini."
                      : "Belum ada data potensi daerah."}
                  </td>
                </tr>
              ) : (
                potensi.map((item, index) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-xs text-text/50">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface overflow-hidden flex-shrink-0">
                          {item.gambar_url ? (
                            <Image
                              src={item.gambar_url}
                              alt={item.judul}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text/30 font-bold text-sm">
                              {item.judul.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">{item.judul}</p>
                          <p className="text-xs text-text/50 truncate max-w-[200px]">
                            {item.lokasi || "Lokasi tidak diset"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.status === "published"
                            ? "bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)]"
                            : "bg-surface text-text/60"
                        }`}
                      >
                        {item.status === "published" ? "Diterbitkan" : "Diarsipkan"}
                      </span>
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
