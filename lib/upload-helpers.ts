/**
 * Pembantu upload ke Storage (bucket 'uploads').
 * Whitelist tipe file ditegakkan server (migrasi 013); helper ini membuat
 * perilaku di browser konsisten dan pesan galatnya bisa dipahami staf.
 */

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Sebagian browser/OS (mis. .docx di Windows tanpa Office, sebagian file picker
 * Android) memberi `file.type` kosong. Storage lalu menerimanya sebagai
 * application/octet-stream dan menolaknya. Bungkus ulang dengan tipe dari ekstensi.
 */
export function withMime(file: File): File {
  if (file.type && file.type !== "application/octet-stream") return file;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME_BY_EXT[ext];
  return type ? new File([file], file.name, { type }) : file;
}

/** Ubah galat dari Storage (Inggris/teknis) menjadi pesan Bahasa Indonesia. */
export function pesanGalatUpload(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  const msg = raw.toLowerCase();

  if (/mime|invalid_mime|not supported|unsupported/.test(msg)) {
    return "Format file tidak didukung. Gunakan format yang tercantum di kotak unggah.";
  }
  if (/maximum allowed size|too large|payload|413/.test(msg)) {
    return "Ukuran file terlalu besar.";
  }
  if (/row-level security|unauthori|forbidden|jwt|403|401/.test(msg)) {
    return "Anda tidak punya izin mengunggah. Coba keluar lalu masuk kembali.";
  }
  if (/network|failed to fetch|load failed|timeout/.test(msg)) {
    return "Koneksi bermasalah. Periksa internet Anda lalu coba lagi.";
  }
  return fallback;
}
