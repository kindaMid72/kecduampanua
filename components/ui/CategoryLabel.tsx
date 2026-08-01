interface CategoryLabelProps {
  label: string;
  className?: string;
}

/**
 * Label kategori gaya monospace kecil huruf kapital — ala cap stempel.
 * Contoh: LAYANAN, PENGUMUMAN, KEGIATAN.
 * Bukan angka urutan 01/02/03 kecuali memang sequence asli.
 */
export function CategoryLabel({ label, className = "" }: CategoryLabelProps) {
  return (
    <span
      className={[
        "inline-block font-mono text-[11px] font-medium uppercase tracking-[0.12em]",
        "text-secondary",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
