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

export default async function BeritaAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);
  const filterStatus = params.status || "";
  const filterKategori = params.kategori || "";

  const supabase = await createClient();

  let query = supabase
    .from("berita")
    .select("id, judul, kategori, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("judul", `%${search}%`);
  if (filterStatus) query = query.eq("status", filterStatus);
  if (filterKategori) query = query.ilike("kategori", `%${filterKategori}%`);

  const { data: beritaList, count, error } = await query;

  if (error) {
    return <ErrorState variant="inline" message="Error memuat data berita." />;
  }

  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Berita</h1>
        <p className="text-sm text-text/60">Kelola artikel dan liputan kegiatan kecamatan.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari judul berita..."
        searchValue={search}
        totalCount={count ?? 0}
        addHref="/admin/berita/tambah"
        addLabel="Tambah Berita"
        filters={[
          {
            key: "status",
            label: "Status",
            value: filterStatus,
            options: [
              { value: "published", label: "Terbit" },
              { value: "diarsipkan", label: "Diarsipkan" },
            ],
          },
          {
            key: "kategori",
            label: "Kategori",
            value: filterKategori,
            options: [
              { value: "kegiatan", label: "Kegiatan" },
              { value: "liputan", label: "Liputan" },
              { value: "pengumuman", label: "Pengumuman" },
            ],
          },
        ]}
      />

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
              {!beritaList || beritaList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text/50 italic">
                    {search || filterStatus || filterKategori
                      ? "Tidak ada berita yang cocok dengan filter ini."
                      : "Belum ada berita yang diterbitkan."}
                  </td>
                </tr>
              ) : (
                beritaList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4 font-medium text-text">{item.judul}</td>
                    <td className="px-6 py-4 text-text/60">
                      {item.kategori ?? <span className="italic text-text/40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === "published" ? "success" : "inactive"}>
                        {item.status === "published" ? "Terbit" : "Diarsipkan"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text/60">
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
