"use client";

import { useState, useEffect } from "react";
import { invitePenggunaAction, ubahStatusPenggunaAction, resetKataSandiAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, ShieldAlert, CheckCircle, XCircle, KeyRound, Copy } from "lucide-react";

interface UserProfile {
  id: string;
  nama_lengkap: string;
  role: string;
  status: string;
  created_at: string;
}

export default function PenggunaAdminPage() {
  const supabase = createClient();
  const [pengguna, setPengguna] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLink, setActionLink] = useState<string | null>(null);
  const [isSuperAccount, setIsSuperAccount] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchPengguna = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setPengguna(data || []);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "super_account" && isMounted) {
        setIsSuperAccount(true);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (isMounted) {
          setPengguna(data || []);
        }
      }
      if (isMounted) {
        setFetching(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setActionLink(null);

    const formData = new FormData(e.currentTarget);
    const res = await invitePenggunaAction(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Pengguna berhasil ditambahkan. Silakan salin tautan di bawah ini untuk pengguna baru agar dapat mengatur kata sandi.");
      setActionLink(res?.action_link || null);
      e.currentTarget.reset();
      await fetchPengguna();
    }
    setLoading(false);
  }

  async function handleResetPassword(id: string) {
    if (!confirm("Buat tautan reset kata sandi untuk pengguna ini?")) return;
    
    setError(null);
    setSuccess(null);
    setActionLink(null);
    setResetLoadingId(id);
    
    const res = await resetKataSandiAction(id);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Tautan reset kata sandi berhasil dibuat. Silakan salin tautan di bawah ini.");
      setActionLink(res?.action_link || null);
    }
    setResetLoadingId(null);
  }

  const copyToClipboard = () => {
    if (actionLink) {
      navigator.clipboard.writeText(actionLink);
      alert("Tautan disalin ke clipboard!");
    }
  };

  async function handleToggleStatus(id: string, currentStatus: string) {
    if (!confirm(`Yakin ingin mengubah status pengguna ini menjadi ${currentStatus === "aktif" ? "nonaktif" : "aktif"}?`)) return;
    
    setError(null);
    setSuccess(null);
    
    const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";
    const res = await ubahStatusPenggunaAction(id, newStatus);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Status pengguna berhasil diubah.");
      await fetchPengguna();
    }
  }

  if (fetching) return <p className="text-sm p-4">Memuat data...</p>;

  if (!isSuperAccount) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
        <ShieldAlert size={48} className="text-accent" />
        <h1 className="font-display text-xl font-semibold text-primary">Akses Ditolak</h1>
        <p className="text-sm text-text/70">
          Halaman ini hanya dapat diakses oleh akun Pengelola (Super Account).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Kelola Pengguna</h1>
        <p className="text-sm text-text/60">Undang staf baru dan atur hak akses.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)] text-sm rounded border border-[color:var(--color-status-success)]/20">
          <p>{success}</p>
          {actionLink && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={actionLink}
                className="flex-1 bg-white/50 border border-[color:var(--color-status-success)]/30 rounded px-3 py-2 text-xs font-mono text-text outline-none"
              />
              <Button type="button" onClick={copyToClipboard} size="sm" variant="secondary" className="flex items-center gap-1">
                <Copy size={14} /> Salin
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Form Undang Pengguna */}
      <Card padding="md">
        <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <UserPlus size={18} /> Tambah Pengguna Baru
        </h2>
        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              name="nama_lengkap"
              required
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
              placeholder="Nama Staf"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1.5">Email Akses</label>
            <input
              type="email"
              name="email"
              required
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
              placeholder="email@instansi.go.id"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select
              name="role"
              className="w-full h-11 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
            >
              <option value="staf">Staf (Editor)</option>
              <option value="super_account">Pengelola (Admin)</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <Button type="submit" loading={loading} className="w-full">
              Buat Tautan Undangan
            </Button>
          </div>
        </form>
      </Card>

      {/* Tabel Pengguna */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text/50 uppercase bg-surface/50 font-mono">
              <tr>
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {pengguna.map((p) => (
                <tr key={p.id} className="hover:bg-surface/30">
                  <td className="px-6 py-4 font-medium text-text">
                    {p.nama_lengkap}
                    {p.id === currentUserId && <span className="ml-2 text-xs text-text/40">(Anda)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.role === "super_account" ? "warning" : "info"}>
                      {p.role === "super_account" ? "Pengelola" : "Staf"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.status === "aktif" ? "success" : "inactive"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.id !== currentUserId && (
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleResetPassword(p.id)}
                          disabled={resetLoadingId === p.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                          <KeyRound size={14} /> {resetLoadingId === p.id ? "Memproses..." : "Reset Sandi"}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p.id, p.status)}
                          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                            p.status === "aktif" ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {p.status === "aktif" ? (
                            <><XCircle size={14} /> Nonaktifkan</>
                          ) : (
                            <><CheckCircle size={14} /> Aktifkan</>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
