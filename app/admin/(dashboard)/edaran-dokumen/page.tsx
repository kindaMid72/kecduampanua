import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Plus, Edit, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { parseAdminParams, pageToRange, calcTotalPages } from "@/lib/admin-query";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EdaranDokumenPage({ searchParams }: Props) {
  const params = await searchParams;
  const { search, page, pageSize } = parseAdminParams(params);
  const { from, to } = pageToRange(page, pageSize);

  const supabase = await createClient();

  let query = supabase
    .from("dokumen_edaran")
    .select("id, judul, nomor_surat, kategori, tanggal_terbit, file_url, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`judul.ilike.%${search}%,nomor_surat.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  // error fallback handled by data || []

  const edaran = data || [];
  const totalPages = calcTotalPages(count, pageSize);
  const spString = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== "page" && v != null) as [string, string][]
  ).toString();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Edaran &amp; Dokumen</h1>
        <p className="text-sm text-text/60">Kelola regulasi, panduan, dan laporan untuk publik.</p>
      </div>

      <AdminTableToolbar
        searchPlaceholder="Cari judul atau nomor surat..."
        searchValue={search}
        totalCount={count ?? 0}
        addHref="/admin/edaran-dokumen/tambah"
        addLabel="Tambah Dokumen"
      />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface/50 text-text/70 uppercase text-xs font-mono">
              <tr>
                <th className="px-6 py-3">Judul Dokumen</th>
                <th className="px-6 py-3">Nomor / Kategori</th>
                <th className="px-6 py-3 text-center">Tanggal Terbit</th>
                <th className="px-6 py-3 text-right">Diunggah Pada</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {edaran.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text/50 italic">
                    {search
                      ? "Tidak ada dokumen yang cocok dengan pencarian ini."
                      : "Belum ada edaran dokumen."}
                  </td>
                </tr>
              ) : (
                edaran.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface flex items-center justify-center flex-shrink-0 text-text/40">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-text">{item.judul}</p>
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Lihat File
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-text/80">{item.nomor_surat || "—"}</p>
                      {item.kategori && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-medium capitalize mt-1">
                          {item.kategori}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-text/70">
                      {new Date(item.tanggal_terbit).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-text/60 text-right text-xs">
                      {item.created_at
                        ? formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: localeId,
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                        <Link href={`/admin/edaran-dokumen/${item.id}/ubah`}>
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
