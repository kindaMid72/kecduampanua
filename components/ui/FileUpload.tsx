"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, Loader2, FileText } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  bucket = "uploads", 
  folder = "documents",
  accept = ".pdf,.doc,.docx"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // Cek size max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB.");
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Gagal mengunggah dokumen.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1] || "Dokumen terlampir";
    } catch {
      return "Dokumen terlampir";
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative group rounded-lg border border-surface bg-surface/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
              <FileText size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-text truncate">
                {getFileNameFromUrl(value)}
              </p>
              <a 
                href={value} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-secondary hover:underline"
              >
                Lihat dokumen
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-text/40 hover:text-red-500 p-2 transition-colors flex-shrink-0"
            title="Hapus dokumen"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer bg-surface/10 hover:bg-surface/30 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary/50 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-6 h-6 text-primary/50 mb-2" />
            )}
            <p className="mb-1 text-sm text-text/60">
              {isUploading ? (
                <span className="font-semibold">Mengunggah...</span>
              ) : (
                <>
                  <span className="font-semibold">Klik untuk unggah</span>
                </>
              )}
            </p>
            <p className="text-xs text-text/40">{accept.toUpperCase()} (Maks. 5MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
      
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
