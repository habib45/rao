"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ProductImage, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";

interface Props {
  images: ProductImage[];
  productName: string;
  locale: LocaleCode;
}

// Convert localhost URLs to relative paths to avoid domain issues
function normalizeImageUrl(url: string): string {
  if (!url) return url;
  
  // Convert localhost URLs to relative paths
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    try {
      const urlObj = new URL(url);
      // Extract the path and return as relative path
      return urlObj.pathname;
    } catch {
      return url;
    }
  }
  
  // Keep relative paths as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // Keep external URLs as-is
  return url;
}

export function ProductGallery({ images, productName, locale }: Props) {
  // Normalize image URLs to remove localhost references
  const normalizedImages = images.map(img => ({
    ...img,
    url: normalizeImageUrl(img.url)
  }));

  // Stable initial index: prefer the image flagged is_primary, otherwise
  // the first by sort_order. We compute once via lazy init so the initial
  // render uses the right image even before the first user click.
  const [activeIndex, setActiveIndex] = useState(() => {
    const primary = normalizedImages.findIndex((img) => img.is_primary);
    return primary >= 0 ? primary : 0;
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Open the lightbox when the user clicks the main image.
  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  // Keyboard nav inside the lightbox: Esc to close, ArrowLeft/Right to swap.
  // Without this, keyboard users would be stuck — the only click handlers
  // are on the on-screen buttons.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % normalizedImages.length);
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + normalizedImages.length) % normalizedImages.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, normalizedImages.length]);

  // Lock body scroll while the lightbox is open so the background page
  // doesn't drift under the overlay.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  if (normalizedImages.length === 0) {
    return (
      <div
        className="aspect-square bg-surface rounded-lg flex items-center justify-center text-muted"
        role="img"
        aria-label="No product image available"
      >
        No Image
      </div>
    );
  }

  const active = normalizedImages[activeIndex];
  const activeAlt = (t(active.alt_text, locale) as string) || productName;

  return (
    <>
      <div>
        <button
          type="button"
          onClick={openLightbox}
          aria-label={`${productName} — enlarge image ${activeIndex + 1} of ${images.length}`}
          className="relative aspect-square bg-surface rounded-lg overflow-hidden w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <Image
            src={active.url}
            alt={activeAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-8"
            priority
            unoptimized
          />
        </button>

        {normalizedImages.length > 1 && (
          <div
            className="mt-4 grid grid-cols-4 gap-2"
            role="tablist"
            aria-label="Product image thumbnails"
          >
            {normalizedImages.map((img, i) => {
              const isActive = i === activeIndex;
              const alt = (t(img.alt_text, locale) as string) || productName;
              return (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show image ${i + 1} of ${normalizedImages.length}: ${alt}`}
                  onClick={() => setActiveIndex(i)}
                  className={`relative aspect-square bg-surface rounded border overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                    isActive
                      ? "border-brand ring-2 ring-brand"
                      : "border-border hover:border-brand/60"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={alt}
                    fill
                    sizes="100px"
                    className="object-contain p-2"
                    loading="lazy"
                    unoptimized
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} — enlarged image`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          {/* Stop propagation so clicks on the image itself don't close. */}
          <div
            className="relative w-[90vw] max-w-6xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center w-full max-h-[80vh]">
              {/*
                Standard lightbox sizing: cap the rendered image at 90vw wide
                and 80vh tall, preserving the source aspect ratio. When the
                ProductImage row has real width/height values we pass them so
                the browser can lay out at the natural ratio and `<Image>`
                picks the right srcset size. Legacy rows (width=null) fall
                back to `fill` with `object-contain` inside a square frame so
                we never upscale beyond the source. The inner frame is the
                positioning context for the close button and the prev/next
                chevrons — that way controls always sit at the image's edge
                regardless of where the image lands inside the wrapper.
              */}
              {active.width && active.height ? (
                <div className="relative inline-block">
                  <Image
                    src={active.url}
                    alt={activeAlt}
                    width={active.width}
                    height={active.height}
                    sizes="(max-width: 768px) 90vw, (max-width: 1280px) 60vw, 1152px"
                    style={{
                      maxWidth: "90vw",
                      maxHeight: "80vh",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                    className="rounded-lg"
                    priority
                    unoptimized
                  />
                  <CloseButton onClick={closeLightbox} />
                  {normalizedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            (i) => (i - 1 + normalizedImages.length) % normalizedImages.length,
                          )
                        }
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <PrevIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((i) => (i + 1) % normalizedImages.length)
                        }
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <NextIcon />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative aspect-square w-full max-w-[80vh] bg-black rounded-lg overflow-hidden">
                  <Image
                    src={active.url}
                    alt={activeAlt}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1280px) 60vw, 1152px"
                    className="object-contain"
                    priority
                    unoptimized
                  />
                  <CloseButton onClick={closeLightbox} />
                  {normalizedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            (i) => (i - 1 + normalizedImages.length) % normalizedImages.length,
                          )
                        }
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <PrevIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex((i) => (i + 1) % normalizedImages.length)
                        }
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <NextIcon />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {normalizedImages.length > 1 && (
              <p className="mt-3 text-center text-sm text-white/80">
                Image {activeIndex + 1} of {normalizedImages.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Inline icon helpers — extracted to keep the lightbox JSX readable.
// Both render a 22×22 chevron inside a 10×10 button.

function CloseButton({ onClick }: { onClick: () => void }) {
  // Anchored to the image frame (top-right, slightly outside) so it tracks
  // the image's edge even when the image is narrower than the wrapper.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close enlarged image"
      className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/10 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white"
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  );
}

function PrevIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}