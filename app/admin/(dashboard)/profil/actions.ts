"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfilAction(formData: FormData) {
  const raw = {
    nama_kecamatan: formData.get("nama_kecamatan") || null,
    sejarah: formData.get("sejarah") || null,
    visi: formData.get("visi") || null,
    misi: formData.get("misi") || null,
    jumlah_asn: formData.get("jumlah_asn") ? parseInt(formData.get("jumlah_asn") as string) : null,
    
    // Kontak
    alamat: formData.get("alamat") || null,
    telepon: formData.get("telepon") || null,
    email: formData.get("email") || null,
    jam_operasional: formData.get("jam_operasional") || null,
    koordinat_lat: formData.get("koordinat_lat") ? parseFloat(formData.get("koordinat_lat") as string) : null,
    koordinat_lng: formData.get("koordinat_lng") ? parseFloat(formData.get("koordinat_lng") as string) : null,

    // PPID & Layanan
    ppid_dasar_hukum: formData.get("ppid_dasar_hukum") || null,
    ppid_nama_petugas: formData.get("ppid_nama_petugas") || null,
    ppid_kontak: formData.get("ppid_kontak") || null,
    ppid_jam_layanan: formData.get("ppid_jam_layanan") || null,
    maklumat_pelayanan: formData.get("maklumat_pelayanan") || null,
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  // Auto-translate best effort
  let sejarah_en = null;
  let visi_en = null;
  let misi_en = null;
  let maklumat_pelayanan_en = null;

  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const trans = async (text: string) => {
        const res = await fetch("http://localhost:3000/api/translate", {
          method: "POST",
          body: JSON.stringify({ text, target: "en" })
        });
        const data = await res.json();
        return data.translated;
      };

      if (raw.sejarah) sejarah_en = await trans(raw.sejarah as string);
      if (raw.visi) visi_en = await trans(raw.visi as string);
      if (raw.misi) misi_en = await trans(raw.misi as string);
      if (raw.maklumat_pelayanan) maklumat_pelayanan_en = await trans(raw.maklumat_pelayanan as string);
    } catch {
      // ignore
    }
  }

  // Karena profil_kecamatan adalah single-row (id=1), kita coba update, jika belum ada kita insert
  const { error } = await supabase.from("profil_kecamatan").upsert({
    id: 1,
    ...raw,
    sejarah_en,
    visi_en,
    misi_en,
    maklumat_pelayanan_en,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data profil." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
