"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dataStatistikSchema } from "@/lib/validations/data-statistik";

export async function createDataStatistikAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  const parsed = dataStatistikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("data_statistik").insert(parsed.data);

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan data." };
  }

  revalidatePath("/admin/data-statistik");
  revalidatePath("/profil");
  revalidatePath("/");
  redirect("/admin/data-statistik");
}

export async function updateDataStatistikAction(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  const parsed = dataStatistikSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("data_statistik").update(parsed.data).eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal memperbarui data." };
  }

  revalidatePath("/admin/data-statistik");
  revalidatePath("/profil");
  revalidatePath("/");
  redirect("/admin/data-statistik");
}

export async function deleteDataStatistikAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda belum login." };
  }

  const { error } = await supabase.from("data_statistik").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Gagal menghapus data." };
  }

  revalidatePath("/admin/data-statistik");
  revalidatePath("/profil");
  revalidatePath("/");
  redirect("/admin/data-statistik");
}
