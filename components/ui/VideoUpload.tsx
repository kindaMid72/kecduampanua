"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  aspectRatio?: string;
}

export function VideoUpload({ 
  value, 
  onChange, 
  bucket = "uploads", 
  folder = "videos",
  aspectRatio = "aspect-video" 
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        setError("File harus berupa video.");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError("Ukuran video maksimal 20MB.");
        return;
      }

      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Gagal mengunggah video.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-surface bg-surface/30">
          <video 
            src={value} 
            controls 
            className={`w-full ${aspectRatio} object-cover`}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
              title="Hapus video"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full ${aspectRatio} border-2 border-dashed border-primary/20 rounded-lg cursor-pointer bg-surface/10 hover:bg-surface/30 transition-colors`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary/50 animate-spin mb-3" />
            ) : (
              <UploadCloud className="w-8 h-8 text-primary/50 mb-3" />
            )}
            <p className="mb-2 text-sm text-text/60">
              {isUploading ? (
                <span className="font-semibold">Mengunggah...</span>
              ) : (
                <>
                  <span className="font-semibold">Klik untuk unggah</span> atau seret file ke sini
                </>
              )}
            </p>
            <p className="text-xs text-text/40">MP4, WEBM (Maks. 20MB)</p>
            <p className="text-xs text-secondary mt-2 font-medium">Info: Durasi video sebaiknya tidak lebih dari 1 menit.</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="video/mp4,video/webm" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
      
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
