import { CategoryLabel } from "./CategoryLabel";

interface JamLayanan {
  hari: string;   // e.g. "Senin – Jumat"
  jam: string;    // e.g. "08.00 – 16.00 WITA"
}

interface AksesCepat {
  label: string;
  href: string;
}

interface PapanInformasiLabels {
  papanInformasi?: string;
  statusDiperbarui?: string;
  kantorBuka?: string;
  kantorTutup?: string;
  jamLayanan?: string;
  jamLayananDiperbarui?: string;
  aksesCepat?: string;
}

interface PapanInformasiPanelProps {
  statusBuka?: boolean | null;
  jamLayanan?: JamLayanan | null;
  aksesCapt?: AksesCepat[];
  /** Pesan tambahan opsional di bawah status */
  catatan?: string | null;
  labels?: PapanInformasiLabels;
}

/**
 * Papan Informasi — signature element khas Beranda.
 * Menampilkan info nyata (status kantor, jam layanan, akses cepat).
 * HANYA dipakai di Beranda — jangan diulang di halaman lain.
 */
export function PapanInformasiPanel({
  statusBuka,
  jamLayanan,
  aksesCapt,
  catatan,
  labels,
}: PapanInformasiPanelProps) {
  const statusTampil =
    statusBuka === null || statusBuka === undefined ? null : statusBuka;

  const lblPapan = labels?.papanInformasi ?? "Papan Informasi";
  const lblStatusDiperbarui = labels?.statusDiperbarui ?? "Status kantor sedang diperbarui";
  const lblKantorBuka = labels?.kantorBuka ?? "Kantor Buka";
  const lblKantorTutup = labels?.kantorTutup ?? "Kantor Tutup";
  const lblJamLayanan = labels?.jamLayanan ?? "Jam Layanan";
  const lblJamDiperbarui = labels?.jamLayananDiperbarui ?? "Informasi jam layanan sedang dilengkapi";
  const lblAksesCepat = labels?.aksesCepat ?? "Akses Cepat";

  return (
    <div className="relative border-[1.5px] border-primary rounded-[var(--radius-card)] bg-surface/50 p-6">
      {/* Tag label mengambang pojok kiri atas */}
      <div className="absolute -top-3 left-4 bg-primary px-3 py-0.5">
        <CategoryLabel label={lblPapan} className="text-white" />
      </div>

      <div className="pt-2 space-y-5">
        {/* Status kantor */}
        <div className="flex items-center gap-3">
          {statusTampil === null ? (
            <span className="text-sm text-text/50 italic">
              {lblStatusDiperbarui}
            </span>
          ) : (
            <>
              <span
                aria-hidden="true"
                className={[
                  "inline-block h-2.5 w-2.5 rounded-full flex-shrink-0",
                  statusBuka
                    ? "bg-[color:var(--color-status-success)]"
                    : "bg-red-600",
                ].join(" ")}
              />
              <span className="text-sm font-medium text-text">
                {statusBuka ? lblKantorBuka : lblKantorTutup}
              </span>
              {catatan && (
                <span className="text-sm text-text/60">— {catatan}</span>
              )}
            </>
          )}
        </div>

        {/* Jam layanan */}
        <div>
          <p className="text-xs text-text/50 uppercase tracking-wide font-mono mb-1">
            {lblJamLayanan}
          </p>
          {jamLayanan ? (
            <p className="text-sm text-text">
              <span className="font-mono">{jamLayanan.hari}</span>
              <span className="mx-2 text-text/30">|</span>
              <span className="font-mono">{jamLayanan.jam}</span>
            </p>
          ) : (
            <p className="text-sm text-text/50 italic">
              {lblJamDiperbarui}
            </p>
          )}
        </div>

        {/* Akses cepat */}
        {aksesCapt && aksesCapt.length > 0 && (
          <div>
            <p className="text-xs text-text/50 uppercase tracking-wide font-mono mb-2">
              {lblAksesCepat}
            </p>
            <div className="flex flex-wrap gap-2">
              {aksesCapt.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-[var(--radius-button)] border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors duration-150 min-h-[44px]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
