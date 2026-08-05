"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { PapanInformasiPanel } from "./PapanInformasiPanel";
import { CategoryLabel } from "./CategoryLabel";

interface JamLayanan {
  hari: string;
  jam: string;
}

interface AksesCepat {
  label: string;
  href: string;
}

interface Slide1Props {
  namaKecamatan: string;
  tagline: string;
  labelSelamatDatang: string;
  papanInformasi: {
    statusBuka: boolean;
    jamLayanan: JamLayanan | null;
    aksesCapt: AksesCepat[];
    labels: Record<string, string>;
  };
}

interface Slide2Props {
  fotoPejabatUrl: string | null;
  sambutan: string | null;
  namaPejabat: string | null;
  jabatanPejabat: string | null;
  labelSambutan: string;
}

interface HeroSliderProps {
  slide1: Slide1Props;
  slide2: Slide2Props | null;
  labels: {
    slideSebelumnya: string;
    slideBerikutnya: string;
  };
}

const SLIDE_DURATION = 6000; // 6 detik

/**
 * HeroSlider — Hero section beranda dengan 2 slide:
 * - Slide 1: Latar hero-web-duampanua.webp + Papan Informasi
 * - Slide 2 (opsional): Latar hero-web-duampanua-2.webp + Foto & sambutan pejabat utama
 *
 * Slide 2 hanya muncul jika prop `slide2` tidak null (dikontrol server, bukan client).
 * Auto-advance setiap 6 detik, pause saat hover/focus.
 */
export function HeroSlider({ slide1, slide2, labels }: HeroSliderProps) {
  const totalSlides = slide2 ? 2 : 1;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActiveSlide(((index % totalSlides) + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const startTimer = useCallback(() => {
    if (totalSlides < 2) return;
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, SLIDE_DURATION);
  }, [totalSlides]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    }
    return clearTimer;
  }, [isPaused, startTimer, clearTimer]);

  const handlePause = () => {
    setIsPaused(true);
    clearTimer();
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden min-h-[calc(100vh-5rem)] w-full flex items-center"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocusCapture={handlePause}
      onBlurCapture={handleResume}
    >
      {/* ---- SLIDE 1: Papan Informasi ---- */}
      <div
        aria-hidden={activeSlide !== 0}
        className={[
          "absolute inset-0 px-4 py-12 sm:py-20 flex items-center transition-opacity duration-700 w-full",
          activeSlide === 0
            ? "opacity-100 z-10 pointer-events-auto"
            : "opacity-0 z-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero-web-duampanua.webp"
            alt="Latar Kecamatan Duampanua"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="mb-3">
            <CategoryLabel label={slide1.labelSelamatDatang} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-4 drop-shadow-sm">
            {slide1.namaKecamatan}
          </h1>
          <p className="text-text/80 text-base sm:text-lg mb-8 max-w-xl font-medium drop-shadow-sm">
            {slide1.tagline}
          </p>

          <PapanInformasiPanel
            statusBuka={slide1.papanInformasi.statusBuka}
            jamLayanan={slide1.papanInformasi.jamLayanan}
            aksesCapt={slide1.papanInformasi.aksesCapt}
            labels={slide1.papanInformasi.labels}
          />
        </div>
      </div>

      {/* ---- SLIDE 2: Sambutan Pejabat (hanya render kalau slide2 ada) ---- */}
      {slide2 && (
        <div
          aria-hidden={activeSlide !== 1}
          className={[
            "absolute inset-0 px-4 py-12 sm:py-20 flex items-center transition-opacity duration-700 w-full",
            activeSlide === 1
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none",
          ].join(" ")}
        >
          {/* Background — hero-web-duampanua-2.webp */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/hero-web-duampanua-2.webp"
              alt="Latar Sambutan"
              fill
              priority={false}
              className="object-cover object-center"
            />
            {/* Overlay gradasi gelap agar teks tetap terbaca */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>

          <div className="max-w-6xl mx-auto w-full relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 max-w-3xl">
              {/* Foto pejabat */}
              {slide2.fotoPejabatUrl && (
                <div className="flex-shrink-0">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-primary/30 shadow-xl ring-4 ring-background/30">
                    <Image
                      src={slide2.fotoPejabatUrl}
                      alt={slide2.namaPejabat ?? "Foto Pejabat"}
                      fill
                      unoptimized
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              )}

              {/* Teks sambutan */}
              <div className="flex flex-col gap-3">
                {/* Label badge */}
                <div className="inline-flex items-center gap-1.5">
                  <span className="h-px w-6 bg-primary/60" />
                  <span className="text-xs font-mono uppercase tracking-widest text-primary/80 font-semibold">
                    {slide2.labelSambutan}
                  </span>
                </div>

                {/* Teks sambutan dengan quote icon */}
                {slide2.sambutan && (
                  <div className="relative">
                    <Quote
                      size={28}
                      className="absolute -top-2 -left-1 text-primary/20 fill-primary/10"
                      aria-hidden
                    />
                    <p className="font-display text-lg sm:text-xl text-text leading-relaxed pl-6 italic max-w-xl line-clamp-5">
                      {slide2.sambutan}
                    </p>
                  </div>
                )}

                {/* Nama & jabatan */}
                {(slide2.namaPejabat || slide2.jabatanPejabat) && (
                  <div className="pl-6 mt-1 border-l-2 border-primary/30">
                    {slide2.namaPejabat && (
                      <p className="font-semibold text-primary text-base">
                        {slide2.namaPejabat}
                      </p>
                    )}
                    {slide2.jabatanPejabat && (
                      <p className="text-sm text-text/60 font-mono">
                        {slide2.jabatanPejabat}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Kontrol navigasi (hanya muncul kalau ada 2 slide) ---- */}
      {totalSlides > 1 && (
        <>
          {/* Tombol prev */}
          <button
            onClick={() => { goTo(activeSlide - 1); handlePause(); }}
            aria-label={labels.slideSebelumnya}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-background/70 hover:bg-background/90 border border-primary/20 flex items-center justify-center shadow-md transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>

          {/* Tombol next */}
          <button
            onClick={() => { goTo(activeSlide + 1); handlePause(); }}
            aria-label={labels.slideBerikutnya}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-background/70 hover:bg-background/90 border border-primary/20 flex items-center justify-center shadow-md transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight size={18} className="text-primary" />
          </button>

          {/* Dot indikator */}
          <div
            role="tablist"
            aria-label="Pilih slide"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2"
          >
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={activeSlide === i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => { goTo(i); handlePause(); }}
                className={[
                  "h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary",
                  activeSlide === i
                    ? "w-6 bg-primary"
                    : "w-2 bg-primary/30 hover:bg-primary/60",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Progress bar auto-advance (hanya kalau tidak paused) */}
          {!isPaused && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] z-20 bg-primary/10">
              <div
                key={`progress-${activeSlide}`}
                className="h-full bg-primary/50 animate-hero-progress"
                style={{ animationDuration: `${SLIDE_DURATION}ms` }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
