"use client";

import { useState, useEffect } from "react";
import { updateProfilAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Globe, UserCircle } from "lucide-react";
import PejabatSection from "./PejabatSection";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function ProfilAdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  
  const [showEn, setShowEn] = useState(false);

  const [formData, setFormData] = useState({
    nama_kecamatan: "",
    sejarah: "",
    sejarah_en: "",
    visi: "",
    visi_en: "",
    misi: "",
    misi_en: "",
    jumlah_asn: "",
    alamat: "",
    telepon: "",
    email: "",
    jam_operasional: "",
    koordinat_lat: "",
    koordinat_lng: "",
    ppid_dasar_hukum: "",
    ppid_nama_petugas: "",
    ppid_kontak: "",
    ppid_jam_layanan: "",
    maklumat_pelayanan: "",
    maklumat_pelayanan_en: "",
    // Pejabat utama — hero slide 2
    nama_pejabat_utama: "",
    jabatan_pejabat_utama: "",
    foto_pejabat_utama_url: "",
    sambutan_pejabat_utama: "",
  });

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("profil_kecamatan")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setFormData({
          nama_kecamatan: data.nama_kecamatan || "",
          sejarah: data.sejarah || "",
          sejarah_en: data.sejarah_en || "",
          visi: data.visi || "",
          visi_en: data.visi_en || "",
          misi: data.misi || "",
          misi_en: data.misi_en || "",
          jumlah_asn: data.jumlah_asn ? String(data.jumlah_asn) : "",
          alamat: data.alamat || "",
          telepon: data.telepon || "",
          email: data.email || "",
          jam_operasional: data.jam_operasional || "",
          koordinat_lat: data.koordinat_lat ? String(data.koordinat_lat) : "",
          koordinat_lng: data.koordinat_lng ? String(data.koordinat_lng) : "",
          ppid_dasar_hukum: data.ppid_dasar_hukum || "",
          ppid_nama_petugas: data.ppid_nama_petugas || "",
          ppid_kontak: data.ppid_kontak || "",
          ppid_jam_layanan: data.ppid_jam_layanan || "",
          maklumat_pelayanan: data.maklumat_pelayanan || "",
          maklumat_pelayanan_en: data.maklumat_pelayanan_en || "",
          nama_pejabat_utama: data.nama_pejabat_utama || "",
          jabatan_pejabat_utama: data.jabatan_pejabat_utama || "",
          foto_pejabat_utama_url: data.foto_pejabat_utama_url || "",
          sambutan_pejabat_utama: data.sambutan_pejabat_utama || "",
        });
        // Auto-buka section EN jika sudah ada konten EN
        if (data.sejarah_en || data.visi_en || data.misi_en || data.maklumat_pelayanan_en) {
          setShowEn(true);
        }
      }
      setFetching(false);
    }
    fetchData();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val) fd.append(key, val);
    });

    const res = await updateProfilAction(fd);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Profil &amp; Kontak</h1>
        <p className="text-sm text-text/60">Kelola identitas instansi, kontak, jam operasional, dan PPID.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)] text-sm rounded border border-[color:var(--color-status-success)]/20 flex items-center gap-2">
            <CheckCircle size={16} /> Data profil berhasil disimpan.
          </div>
        )}

        {/* Identitas Utama */}
        <Card padding="md" className="space-y-5">
          <h2 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Identitas Utama</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Instansi</label>
            <input
              type="text"
              name="nama_kecamatan"
              value={formData.nama_kecamatan}
              onChange={handleChange}
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Contoh: Kecamatan Duampanua"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Visi</label>
              <textarea
                name="visi"
                value={formData.visi}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Misi</label>
              <textarea
                name="misi"
                value={formData.misi}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              ></textarea>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Sejarah</label>
            <textarea
              name="sejarah"
              value={formData.sejarah}
              onChange={handleChange}
              rows={5}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
            ></textarea>
          </div>

          {/* Section Bahasa Inggris — Identitas */}
          <div className="border border-surface rounded-lg">
            <button
              type="button"
              onClick={() => setShowEn(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text/70 hover:text-text hover:bg-surface/40 rounded-lg transition-colors text-left"
            >
              <Globe size={15} className="text-secondary flex-shrink-0" />
              <span className="font-medium">Versi Bahasa Inggris (opsional)</span>
              <span className="ml-auto text-xs text-text/40">{showEn ? "Sembunyikan" : "Tampilkan"}</span>
            </button>
            {showEn && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface pt-4">
                <p className="text-xs text-text/50">
                  Kosongkan jika tidak diperlukan — halaman <span className="font-mono">/en/</span> akan otomatis menampilkan versi Indonesia sebagai fallback.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Visi (Bahasa Inggris)</label>
                    <textarea
                      name="visi_en"
                      value={formData.visi_en}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                      placeholder="English vision..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Misi (Bahasa Inggris)</label>
                    <textarea
                      name="misi_en"
                      value={formData.misi_en}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                      placeholder="English mission..."
                    ></textarea>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sejarah (Bahasa Inggris)</label>
                  <textarea
                    name="sejarah_en"
                    value={formData.sejarah_en}
                    onChange={handleChange}
                    rows={5}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                    placeholder="English history..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Jumlah ASN</label>
            <input
              type="number"
              name="jumlah_asn"
              value={formData.jumlah_asn}
              onChange={handleChange}
              className="w-full md:w-1/3 h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </Card>

        {/* Kontak & Operasional */}
        <Card padding="md" className="space-y-5">
          <h2 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Kontak &amp; Operasional</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Alamat Lengkap</label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              rows={2}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Telepon</label>
              <input
                type="text"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Jam Operasional</label>
              <input
                type="text"
                name="jam_operasional"
                value={formData.jam_operasional}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Senin–Jumat, 08.00–16.00 WIB"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Koordinat Latitude (Peta)</label>
              <input
                type="text"
                name="koordinat_lat"
                value={formData.koordinat_lat}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: -3.8182"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Koordinat Longitude (Peta)</label>
              <input
                type="text"
                name="koordinat_lng"
                value={formData.koordinat_lng}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: 119.5934"
              />
            </div>
          </div>
        </Card>

        {/* Layanan Publik & PPID */}
        <Card padding="md" className="space-y-5">
          <h2 className="text-lg font-semibold text-primary mb-4 border-b pb-2">PPID &amp; Layanan Publik</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Maklumat Pelayanan</label>
            <textarea
              name="maklumat_pelayanan"
              value={formData.maklumat_pelayanan}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
            ></textarea>
          </div>

          {showEn && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Maklumat Pelayanan (Bahasa Inggris)</label>
              <textarea
                name="maklumat_pelayanan_en"
                value={formData.maklumat_pelayanan_en}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
                placeholder="English service declaration..."
              ></textarea>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Dasar Hukum PPID</label>
            <textarea
              name="ppid_dasar_hukum"
              value={formData.ppid_dasar_hukum}
              onChange={handleChange}
              rows={2}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Petugas PPID</label>
              <input
                type="text"
                name="ppid_nama_petugas"
                value={formData.ppid_nama_petugas}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kontak PPID</label>
              <input
                type="text"
                name="ppid_kontak"
                value={formData.ppid_kontak}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Jam Layanan PPID</label>
              <input
                type="text"
                name="ppid_jam_layanan"
                value={formData.ppid_jam_layanan}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Sambutan Pejabat Utama — untuk Hero Slide 2 */}
        <Card padding="md" className="space-y-5">
          <div className="border-b pb-2 mb-4 flex items-start gap-3">
            <UserCircle size={20} className="text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-primary">Sambutan Pejabat Utama</h2>
              <p className="text-xs text-text/50 mt-0.5">
                Ditampilkan di slide kedua halaman Beranda. Kosongkan semua field untuk menyembunyikan slide ini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Pejabat</label>
              <input
                type="text"
                name="nama_pejabat_utama"
                value={formData.nama_pejabat_utama}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: H. Ahmad Rifai, S.Sos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Jabatan</label>
              <input
                type="text"
                name="jabatan_pejabat_utama"
                value={formData.jabatan_pejabat_utama}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
                placeholder="Contoh: Camat Duampanua"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Teks Sambutan</label>
            <textarea
              name="sambutan_pejabat_utama"
              value={formData.sambutan_pejabat_utama}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary outline-none resize-y"
              placeholder="Selamat datang di website resmi Kecamatan Duampanua..."
            />
            <p className="text-xs text-text/40 mt-1 text-right">
              {formData.sambutan_pejabat_utama.length}/500 karakter
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Foto Pejabat</label>
            <div className="max-w-xs">
              <ImageUpload
                value={formData.foto_pejabat_utama_url}
                onChange={(url) => setFormData(prev => ({ ...prev, foto_pejabat_utama_url: url }))}
                bucket="uploads"
                folder="pejabat"
                aspectRatio="aspect-square"
              />
            </div>
            {/* Hidden input agar foto_url ikut di-submit ke FormData */}
            <input type="hidden" name="foto_pejabat_utama_url" value={formData.foto_pejabat_utama_url} />
          </div>
        </Card>

        <div className="flex justify-end border-b pb-6 mb-6">
          <Button type="submit" loading={loading} size="lg">
            Simpan Semua Perubahan
          </Button>
        </div>

      </form>

      {/* Daftar Pejabat di luar form profil */}
      <PejabatSection />

    </div>
  );
}
