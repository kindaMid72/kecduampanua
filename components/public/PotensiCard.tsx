"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { MapPin, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PotensiCardProps {
  id: string;
  judul: string;
  deskripsi: string;
  katId: "ekonomi" | "wisata" | "pengolahan";
  lokasi?: string | null;
  gambarUrl?: string | null;
  videoUrl?: string | null;
  badgeLabel: string;
}

const badgeColorMap: Record<string, "default" | "info" | "warning" | "success" | "inactive"> = {
  ekonomi: "info",
  wisata: "success",
  pengolahan: "warning",
};

export function PotensiCard({
  id,
  judul,
  deskripsi,
  katId,
  lokasi,
  gambarUrl,
  videoUrl,
  badgeLabel
}: PotensiCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoUrl && videoRef.current) {
      videoRef.current.play().catch(e => console.error("Auto-play prevented", e));
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoUrl && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden flex flex-col group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full h-48 bg-surface overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={gambarUrl || undefined}
              muted
              loop
              playsInline
              className={`object-cover w-full h-full transition-transform duration-500 ${isHovered ? "scale-105" : ""}`}
            />
          ) : gambarUrl ? (
            <Image
              src={gambarUrl}
              alt={judul}
              fill
              unoptimized
              className={`object-cover transition-transform duration-500 ${isHovered ? "scale-105" : ""}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text/20">
              <span className="font-display text-4xl">{judul.charAt(0)}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={badgeColorMap[katId] || "default"} className="shadow-sm backdrop-blur-sm bg-white/90">
              {badgeLabel}
            </Badge>
          </div>
          {videoUrl && (
            <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-white/90 text-primary px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Klik untuk putar dengan suara
              </div>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-semibold text-text mb-2 line-clamp-2">
            {judul}
          </h3>
          {lokasi && (
            <div className="flex items-center gap-1.5 text-xs text-text/60 mb-3">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">{lokasi}</span>
            </div>
          )}
          <p className="text-sm text-text/70 line-clamp-3 mb-4 leading-relaxed">
            {deskripsi}
          </p>
        </div>
      </Card>

      {/* Video Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div 
            className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>
            {videoUrl ? (
              <video 
                src={videoUrl}
                poster={gambarUrl || undefined}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain bg-black"
              />
            ) : gambarUrl ? (
              <div className="relative w-full h-[60vh]">
                <Image
                  src={gambarUrl}
                  alt={judul}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-white/50 bg-surface">
                Tidak ada media yang tersedia
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
              <h2 className="text-white font-display text-xl sm:text-2xl font-semibold mb-2">{judul}</h2>
              <p className="text-white/80 text-sm line-clamp-2 max-w-3xl">{deskripsi}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
