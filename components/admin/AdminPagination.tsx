import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  /** Diteruskan ke URL params yang sudah ada (search, filter, dll) */
  searchParamsString?: string;
}

/** Hasilkan array nomor halaman dengan elipsis "..." */
function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}

function buildHref(page: number, searchParamsString?: string): string {
  const params = new URLSearchParams(searchParamsString || "");
  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  searchParamsString,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      {/* Info rentang */}
      <p className="font-mono text-xs text-text/50 order-2 sm:order-1">
        Menampilkan{" "}
        <span className="text-text/70 font-semibold">{from}–{to}</span>{" "}
        dari{" "}
        <span className="text-text/70 font-semibold">{totalCount.toLocaleString("id-ID")}</span>{" "}
        data
      </p>

      {/* Tombol navigasi */}
      <nav
        aria-label="Navigasi halaman"
        className="flex items-center gap-1 order-1 sm:order-2"
      >
        {/* Sebelumnya */}
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1, searchParamsString)}
            className={[
              "inline-flex items-center justify-center h-8 px-2 rounded-[var(--radius-button)]",
              "text-sm text-text/60 hover:bg-surface hover:text-text transition-colors",
              "border border-surface",
            ].join(" ")}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={15} />
          </Link>
        ) : (
          <span
            className={[
              "inline-flex items-center justify-center h-8 px-2 rounded-[var(--radius-button)]",
              "text-sm text-text/30 border border-surface cursor-not-allowed",
            ].join(" ")}
            aria-disabled="true"
          >
            <ChevronLeft size={15} />
          </span>
        )}

        {/* Nomor halaman */}
        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center h-8 w-8 text-sm text-text/40 select-none"
            >
              …
            </span>
          ) : (
            <Link
              key={num}
              href={buildHref(num, searchParamsString)}
              aria-current={num === currentPage ? "page" : undefined}
              className={[
                "inline-flex items-center justify-center h-8 w-8 rounded-[var(--radius-button)]",
                "text-sm font-medium transition-colors border",
                num === currentPage
                  ? "bg-primary text-white border-primary"
                  : "text-text/60 border-surface hover:bg-surface hover:text-text",
              ].join(" ")}
            >
              {num}
            </Link>
          )
        )}

        {/* Berikutnya */}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1, searchParamsString)}
            className={[
              "inline-flex items-center justify-center h-8 px-2 rounded-[var(--radius-button)]",
              "text-sm text-text/60 hover:bg-surface hover:text-text transition-colors",
              "border border-surface",
            ].join(" ")}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={15} />
          </Link>
        ) : (
          <span
            className={[
              "inline-flex items-center justify-center h-8 px-2 rounded-[var(--radius-button)]",
              "text-sm text-text/30 border border-surface cursor-not-allowed",
            ].join(" ")}
            aria-disabled="true"
          >
            <ChevronRight size={15} />
          </span>
        )}
      </nav>
    </div>
  );
}
