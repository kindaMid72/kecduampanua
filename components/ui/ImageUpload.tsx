"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, bucket = "uploads", folder = "images" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar.");
        return;
      }

      setIsUploading(true);

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Gagal mengunggah gambar.");
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-surface bg-surface/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={value} 
            alt="Uploaded preview" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer bg-surface/10 hover:bg-surface/30 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
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
            <p className="text-xs text-text/40">PNG, JPG, WEBP (Maks. 1MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
      
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
