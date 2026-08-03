import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Utility untuk mengekstrak path internal file dari Public URL Supabase.
 * Format umum: https://[project].supabase.co/storage/v1/object/public/[bucket]/[folder]/[file.ext]
 */
export function getStoragePathFromUrl(url: string, bucket: string = "uploads"): string | null {
  if (!url) return null;
  try {
    const searchString = `/public/${bucket}/`;
    const parts = url.split(searchString);
    
    // Jika format public URL sesuai, ekstrak string setelahnya
    if (parts.length > 1) {
      // Gunakan .slice(1).join() untuk berjaga-jaga jika string pencarian muncul di dalam nama file
      return parts.slice(1).join(searchString);
    }
    return null;
  } catch (error) {
    console.error("Error parsing storage URL:", error);
    return null;
  }
}

/**
 * Utility untuk menghapus file dari Supabase Storage secara aman lewat Server Action.
 * 
 * @param supabase Instance SupabaseClient dari aksi yang berjalan
 * @param url URL publik gambar/dokumen yang akan dihapus
 * @param bucket Nama bucket (default: "uploads")
 */
export async function deleteStorageFile(
  supabase: SupabaseClient<any, "public", any>,
  url: string | null | undefined,
  bucket: string = "uploads"
): Promise<void> {
  if (!url) return;
  
  const path = getStoragePathFromUrl(url, bucket);
  if (!path) {
    console.warn(`[deleteStorageFile] Gagal mengekstrak path dari URL: ${url}`);
    return;
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[deleteStorageFile] Gagal menghapus file [${path}] dari bucket [${bucket}]:`, error);
    } else {
      console.log(`[deleteStorageFile] Berhasil menghapus file: ${path}`);
    }
  } catch (error) {
    console.error("[deleteStorageFile] Error tak terduga saat menghapus file:", error);
  }
}
