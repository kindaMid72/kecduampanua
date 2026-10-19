import { describe, expect, test } from "vitest";
import { pesanGalatUpload, withMime } from "@/lib/upload-helpers";

describe("withMime", () => {
  test("mengisi tipe dari ekstensi bila kosong atau octet-stream", () => {
    const docx = new File(["x"], "Surat Edaran.DOCX", { type: "" });
    expect(withMime(docx).type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(withMime(new File(["x"], "a.pdf", { type: "application/octet-stream" })).type).toBe("application/pdf");
  });
  test("tipe yang sudah benar tidak diubah; ekstensi tak dikenal dibiarkan", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(withMime(pdf)).toBe(pdf);
    const exe = new File(["x"], "a.exe", { type: "" });
    expect(withMime(exe).type).toBe("");
  });
  test("nama dan isi file tetap", async () => {
    const out = withMime(new File(["isi"], "a.pdf", { type: "" }));
    expect(out.name).toBe("a.pdf");
    expect(await out.text()).toBe("isi");
  });
});

describe("pesanGalatUpload", () => {
  const f = "Gagal mengunggah dokumen.";
  test("memetakan galat Storage (Inggris) ke Bahasa Indonesia", () => {
    expect(pesanGalatUpload(new Error("mime type application/octet-stream is not supported"), f)).toMatch(/Format file tidak didukung/);
    expect(pesanGalatUpload({ message: "The object exceeded the maximum allowed size" }, f)).toMatch(/terlalu besar/);
    expect(pesanGalatUpload(new Error("new row violates row-level security policy"), f)).toMatch(/izin/);
    expect(pesanGalatUpload(new TypeError("Failed to fetch"), f)).toMatch(/Koneksi/);
  });
  test("galat tak dikenal -> pesan cadangan, tidak membocorkan teks mentah", () => {
    expect(pesanGalatUpload(new Error("ECONNRESET internal detail"), f)).toBe(f);
    expect(pesanGalatUpload(undefined, f)).toBe(f);
  });
});
