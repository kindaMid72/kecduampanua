interface SectionDividerProps {
  className?: string;
  /** Orientasi gradient — default horizontal */
  vertical?: boolean;
}

/**
 * Garis horizon tipis gradient primary→secondary→accent.
 * Dipakai TERBATAS: top bar navbar dan pembatas antar section besar.
 * Bukan dekorasi berulang di setiap sub-bagian.
 */
export function SectionDivider({ className = "", vertical = false }: SectionDividerProps) {
  if (vertical) {
    return (
      <div
        aria-hidden="true"
        className={["w-[3px] self-stretch bg-gradient-to-b from-primary via-secondary to-accent", className].join(" ")}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={["h-[3px] w-full bg-gradient-to-r from-primary via-secondary to-accent", className].join(" ")}
    />
  );
}
