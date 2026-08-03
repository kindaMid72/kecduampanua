"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { createPejabatAction, updatePejabatAction, deletePejabatAction } from "./actions";

type Pejabat = {
  id: string;
  nama_pejabat: string;
  jabatan: string;
  foto_url: string | null;
  urutan: number;
};

export default function PejabatSection() {
  const supabase = createClient();
  const [pejabats, setPejabats] = useState<Pejabat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nama_pejabat: "",
    jabatan: "",
    foto_url: "",
    urutan: 0,
  });

  const fetchPejabat = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("struktur_organisasi")
      .select("*")
      .order("urutan", { ascending: true });
      
    if (error) {
      setError("Gagal memuat data pejabat.");
    } else {
      setPejabats(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPejabat();
  }, []);

  const openForm = (pejabat?: Pejabat) => {
    if (pejabat) {
      setEditingId(pejabat.id);
      setFormData({
        nama_pejabat: pejabat.nama_pejabat,
        jabatan: pejabat.jabatan,
        foto_url: pejabat.foto_url || "",
        urutan: pejabat.urutan || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        nama_pejabat: "",
        jabatan: "",
        foto_url: "",
        urutan: pejabats.length > 0 ? pejabats[pejabats.length - 1].urutan + 1 : 0,
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const fd = new FormData();
    fd.append("nama_pejabat", formData.nama_pejabat);
    fd.append("jabatan", formData.jabatan);
    if (formData.foto_url) fd.append("foto_url", formData.foto_url);
    fd.append("urutan", String(formData.urutan));

    let res;
    if (editingId) {
      res = await updatePejabatAction(editingId, fd);
    } else {
      res = await createPejabatAction(fd);
    }

    if (res.error) {
      alert(res.error);
    } else {
      closeForm();
      fetchPejabat();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pejabat ini?")) return;
    setLoading(true);
    const res = await deletePejabatAction(id);
    if (res.error) {
      alert(res.error);
    } else {
      fetchPejabat();
    }
    setLoading(false);
  };

  return (
    <Card padding="md" className="space-y-5">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Struktur Organisasi</h2>
          <p className="text-sm text-text/60">Kelola daftar pejabat dan struktur instansi.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => openForm()} size="sm" className="gap-2">
            <Plus size={16} /> Tambah Pejabat
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      {isFormOpen ? (
        <div className="border border-surface rounded-lg p-4 space-y-4 bg-surface/10">
          <h3 className="font-medium text-primary">{editingId ? "Ubah Pejabat" : "Tambah Pejabat"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Lengkap & Gelar</label>
              <input
                type="text"
                name="nama_pejabat"
                required
                value={formData.nama_pejabat}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Jabatan</label>
              <input
                type="text"
                name="jabatan"
                required
                value={formData.jabatan}
                onChange={handleChange}
                className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Urutan Tampil (Makin kecil makin di atas)</label>
              <input
                type="number"
                name="urutan"
                required
                value={formData.urutan}
                onChange={handleChange}
                className="w-full md:w-1/3 h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Foto Pejabat (opsional)</label>
              <ImageUpload
                value={formData.foto_url}
                onChange={(url) => setFormData(prev => ({ ...prev, foto_url: url }))}
                folder="pejabat"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-surface/50">
              <Button type="button" variant="ghost" onClick={closeForm}>Batal</Button>
              <Button type="submit" loading={loading}>Simpan</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm">Memuat data...</p>
          ) : pejabats.length === 0 ? (
            <p className="text-sm text-text/50">Belum ada data pejabat.</p>
          ) : (
            pejabats.map(pejabat => (
              <div key={pejabat.id} className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface flex items-center justify-center flex-shrink-0">
                  {pejabat.foto_url ? (
                    <img src={pejabat.foto_url} alt={pejabat.nama_pejabat} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-text/30">{pejabat.nama_pejabat.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{pejabat.nama_pejabat}</p>
                  <p className="text-sm text-text/60 truncate">{pejabat.jabatan}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openForm(pejabat)} className="p-2 text-text/50 hover:text-primary transition-colors" title="Ubah">
                    <Edit size={16} />
                  </button>
                  <button type="button" onClick={() => handleDelete(pejabat.id)} className="p-2 text-text/50 hover:text-red-500 transition-colors" title="Hapus">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
