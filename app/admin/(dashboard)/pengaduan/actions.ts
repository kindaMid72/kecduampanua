"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pengaduanAdminSchema } from "@/lib/validations/pengaduan";

export async function updatePengaduanAction(id: string, formData: FormData) {
  const raw = {
    status: formData.get("status"),
    catatan_tindak_lanjut: formData.get("catatan_tindak_lanjut") || undefined,
  };

  const parsed = pengaduanAdminSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const updateData: any = {
    ...parsed.data,
    ditangani_oleh: user.id,
    updated_at: new Date().toISOString(),
  };

  // Arsip otomatis jika selesai lebih dari 2 tahun (Ini biasanya cron job, tapi kita bisa update di sini juga, atau biarkan cron yang urus)
  // Biarkan cron job atau DB trigger yang set diarsipkan_pada

  const { error } = await supabase.from("pengaduan").update(updateData).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui pengaduan." };
  }

  revalidatePath("/admin/pengaduan");
  redirect("/admin/pengaduan");
}

export async function deletePengaduanAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("pengaduan").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus pengaduan." };
  }

  revalidatePath("/admin/pengaduan");
  redirect("/admin/pengaduan");
}
