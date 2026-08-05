"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
}

interface AdminTableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  filters?: FilterConfig[];
  totalCount: number;
  addHref?: string;
  addLabel?: string;
}

export function AdminTableToolbar({
  searchPlaceholder = "Cari...",
  searchValue = "",
  filters = [],
  totalCount,
  addHref,
  addLabel = "Tambah",
}: AdminTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync saat searchValue berubah (navigasi balik/maju)
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset ke halaman 1 saat filter/search berubah
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams("search", val);
    }, 350);
  };

  const handleSearchClear = () => {
    setLocalSearch("");
    updateParams("search", "");
  };

  const handleFilterChange = (key: string, value: string) => {
    updateParams(key, value);
  };

  const hasActiveFilters =
    searchValue ||
    filters.some((f) => f.value);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      {/* Kiri: search + filter */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none"
          />
          <input
            id="admin-search"
            type="search"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className={[
              "h-9 pl-9 pr-8 text-sm rounded-[var(--radius-button)]",
              "border border-surface bg-background text-text",
              "placeholder:text-text/40",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
              "transition-colors w-56",
            ].join(" ")}
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/70 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown filter */}
        {filters.map((filter) => (
          <select
            key={filter.key}
            id={`admin-filter-${filter.key}`}
            value={filter.value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className={[
              "h-9 px-3 text-sm rounded-[var(--radius-button)]",
              "border border-surface bg-background text-text",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
              "transition-colors cursor-pointer",
              filter.value ? "border-primary/40 text-primary font-medium" : "text-text/60",
            ].join(" ")}
            aria-label={filter.label}
          >
            <option value="">{filter.label} (Semua)</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Badge filter aktif */}
        {hasActiveFilters && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium">
            Filter aktif
          </span>
        )}
      </div>

      {/* Kanan: info total + tombol tambah */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-text/50 whitespace-nowrap">
          {totalCount.toLocaleString("id-ID")} data
        </span>
        {addHref && (
          <Button asChild size="sm">
            <Link href={addHref}>
              <Plus size={15} />
              {addLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
