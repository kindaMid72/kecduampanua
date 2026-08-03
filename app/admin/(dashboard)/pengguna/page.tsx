"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDaftarPenggunaAction,
  invitePenggunaAction,
  ubahStatusPenggunaAction,
  resetKataSandiAction,
  editPenggunaAction,
  hapusPenggunaAction,
  type PenggunaItem,
} from "./actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  ShieldAlert,
  CheckCircle,
  XCircle,
  KeyRound,
  Copy,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function PenggunaAdminPage() {
  const supabase = createClient();
  const [pengguna, setPengguna] = useState<PenggunaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLink, setActionLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuperAccount, setIsSuperAccount] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // State untuk modal edit
  const [editingUser, setEditingUser] = useState<PenggunaItem | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editRole, setEditRole] = useState<"super_account" | "staf">("staf");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State untuk modal hapus
  const [deletingUser, setDeletingUser] = useState<PenggunaItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPengguna = useCallback(async () => {
    try {
      const res = await getDaftarPenggunaAction();
      if (res.error) {
        if (res.error.includes("Hanya akun Pengelola") || res.error.includes("Hanya Pengelola")) {
          setIsSuperAccount(false);
        } else {
          setError(res.error);
        }
      } else {
        setIsSuperAccount(true);
        setPengguna(res.data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data pengguna.";
      setError(message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setFetching(true);
      setError(null);
      try {
        // 1. Ambil info user yang login
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && isMounted) {
          setCurrentUserId(user.id);
        }

        // 2. Ambil data pengguna langsung dari Server Action
        const res = await getDaftarPenggunaAction();
        if (isMounted) {
          if (res.error) {
            if (res.error.includes("Hanya akun Pengelola") || res.error.includes("Hanya Pengelola")) {
              setIsSuperAccount(false);
            } else {
              setError(res.error);
              setIsSuperAccount(true);
            }
          } else {
            setIsSuperAccount(true);
            setPengguna(res.data || []);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data pengguna.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setFetching(false);
        }
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
    setCopied(false);

    const formData = new FormData(e.currentTarget);
    const res = await invitePenggunaAction(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(
        "Pengguna berhasil ditambahkan. Silakan salin tautan di bawah ini untuk pengguna baru agar dapat mengatur kata sandi."
      );
      setActionLink(res?.action_link || null);
      e.currentTarget.reset();
      await fetchPengguna();
    }
    setLoading(false);
  }

  async function handleResetPassword(userItem: PenggunaItem) {
    const isSelf = userItem.id === currentUserId;
    const confirmMsg = isSelf
      ? "Buat tautan reset kata sandi untuk akun Anda sendiri?"
      : `Buat tautan reset kata sandi untuk ${userItem.nama_lengkap}?`;

    if (!confirm(confirmMsg)) return;

    setError(null);
    setSuccess(null);
    setActionLink(null);
    setCopied(false);
    setResetLoadingId(userItem.id);

    const res = await resetKataSandiAction(userItem.id);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(
        isSelf
          ? "Tautan reset kata sandi untuk akun Anda berhasil dibuat. Silakan salin atau buka tautan di bawah ini."
          : `Tautan reset kata sandi untuk ${userItem.nama_lengkap} berhasil dibuat. Silakan salin tautan di bawah ini.`
      );
      setActionLink(res?.action_link || null);
    }
    setResetLoadingId(null);
  }

  const copyToClipboard = () => {
    if (actionLink) {
      navigator.clipboard.writeText(actionLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  async function handleToggleStatus(id: string, currentStatus: string) {
    if (
      !confirm(
        `Yakin ingin mengubah status pengguna ini menjadi ${
          currentStatus === "aktif" ? "nonaktif" : "aktif"
        }?`
      )
    )
      return;

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

  // Buka Modal Edit
  function openEditModal(u: PenggunaItem) {
    setEditingUser(u);
    setEditNama(u.nama_lengkap);
    setEditRole(u.role);
    setEditError(null);
  }

  // Simpan Perubahan Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setEditSubmitting(true);
    setEditError(null);

    const res = await editPenggunaAction(editingUser.id, {
      nama_lengkap: editNama,
      role: editRole,
    });

    if (res?.error) {
      setEditError(res.error);
      setEditSubmitting(false);
    } else {
      setSuccess("Data pengguna berhasil diperbarui.");
      setEditingUser(null);
      setEditSubmitting(false);
      await fetchPengguna();
    }
  }

  // Buka Modal Hapus
  function openDeleteModal(u: PenggunaItem) {
    setDeletingUser(u);
    setDeleteError(null);
  }

  // Eksekusi Hapus
  async function handleConfirmDelete() {
    if (!deletingUser) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    const res = await hapusPenggunaAction(deletingUser.id);

    if (res?.error) {
      setDeleteError(res.error);
      setDeleteSubmitting(false);
    } else {
      setSuccess(`Pengguna ${deletingUser.nama_lengkap} berhasil dihapus.`);
      setDeletingUser(null);
      setDeleteSubmitting(false);
      await fetchPengguna();
    }
  }

  if (fetching) return <p className="text-sm p-4 text-text/70">Memuat data pengguna...</p>;

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
        <p className="text-sm text-text/60">
          Undang staf baru, edit data pengguna, dan atur hak akses sistem.
        </p>
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
                className="flex-1 bg-white/70 border border-[color:var(--color-status-success)]/30 rounded px-3 py-2 text-xs font-mono text-text outline-none"
              />
              <Button
                type="button"
                onClick={copyToClipboard}
                size="sm"
                variant="secondary"
                className="flex items-center gap-1 min-w-[80px] justify-center"
              >
                <Copy size={14} /> {copied ? "Tersalin!" : "Salin"}
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
            <label className="block text-sm font-medium mb-1.5">Peran</label>
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
                <th className="px-6 py-3">Pengguna</th>
                <th className="px-6 py-3">Peran</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {pengguna.map((p) => {
                const isSelf = p.id === currentUserId;
                return (
                  <tr key={p.id} className="hover:bg-surface/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text flex items-center gap-1.5">
                        {p.nama_lengkap}
                        {isSelf && (
                          <span className="text-xs bg-primary/10 text-primary font-mono px-1.5 py-0.5 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text/50 font-mono mt-0.5">{p.email}</div>
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
                      <div className="flex items-center justify-end gap-3 flex-wrap">
                        {/* Tombol Edit: Tersedia untuk semua termasuk akun sendiri */}
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                          title="Edit Pengguna"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        {/* Tombol Reset Sandi: Tersedia untuk semua termasuk akun sendiri */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(p)}
                          disabled={resetLoadingId === p.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                          title="Buat tautan reset kata sandi"
                        >
                          <KeyRound size={14} />{" "}
                          {resetLoadingId === p.id ? "Memproses..." : "Reset Sandi"}
                        </button>

                        {/* Aksi khusus staf/pengguna lain (bukan diri sendiri) */}
                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                                p.status === "aktif"
                                  ? "text-amber-600 hover:text-amber-700"
                                  : "text-green-600 hover:text-green-700"
                              }`}
                              title={p.status === "aktif" ? "Nonaktifkan akun" : "Aktifkan akun"}
                            >
                              {p.status === "aktif" ? (
                                <>
                                  <XCircle size={14} /> Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} /> Aktifkan
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                              title="Hapus akun pengguna"
                            >
                              <Trash2 size={14} /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="modal-edit-title" className="font-display font-semibold text-lg text-primary">
                Edit Pengguna
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-text/50 hover:text-text text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text/70 mb-1 flex items-center gap-1">
                  <Lock size={12} /> Email Akses (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full h-10 px-3 bg-surface/50 border border-surface rounded text-sm text-text/60 font-mono cursor-not-allowed"
                />
                <p className="text-[11px] text-text/40 mt-1">
                  Alamat email akses akun tidak dapat diubah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text/70 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full h-10 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="Nama Lengkap Staf"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text/70 mb-1">Peran (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "super_account" | "staf")}
                  className="w-full h-10 px-3 border rounded focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
                >
                  <option value="staf">Staf (Editor)</option>
                  <option value="super_account">Pengelola (Admin)</option>
                </select>
              </div>

              {/* Warning saat mengubah peran diri sendiri */}
              {editingUser.id === currentUserId && editRole === "staf" && (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Peringatan:</strong> Anda sedang mengubah peran Anda sendiri menjadi{" "}
                    <strong>Staf</strong>. Anda akan kehilangan akses ke menu Kelola Pengguna ini
                    setelah perubahan disimpan.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  disabled={editSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" loading={editSubmitting}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pengguna */}
      {deletingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 id="modal-delete-title" className="font-display font-semibold text-lg text-primary">
                  Hapus Pengguna
                </h3>
                <p className="text-xs text-text/60">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {deleteError}
              </div>
            )}

            <p className="text-sm text-text/80">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-text">{deletingUser.nama_lengkap}</strong> (
              <span className="font-mono text-xs">{deletingUser.email}</span>)?
            </p>

            <p className="text-xs text-text/60 bg-surface/50 p-3 rounded">
              Akses login pengguna ini akan dihapus secara permanen. Seluruh konten publik atau
              dokumen yang pernah dibuat pengguna ini akan tetap aman tersimpan di sistem.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeletingUser(null)}
                disabled={deleteSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={deleteSubmitting}
                onClick={handleConfirmDelete}
              >
                Hapus Akun
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
