import { useState } from "react";
import { Package, Images } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function ProductImageGallery({ images = [], productName = "" }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      // Placeholder — exact same size as the thumbnails
      // so cards stay the same height whether or not they have images
      <div
        className="w-16 h-16 rounded-lg bg-muted/60 border border-border
                      flex items-center justify-center flex-shrink-0"
      >
        <Package className="w-6 h-6 text-muted-foreground/40" />
      </div>
    );
  }

  const slides = images.map((src) => ({ src }));

  const openAt = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="flex gap-1.5 flex-shrink-0">
        {/* ── MAIN THUMBNAIL ────────────────────────────────────────────
            Fixed 64x64 square — object-cover crops to fill the square
            No matter what size the seller uploads, this always looks identical
            overflow-hidden clips the image to the rounded box */}
        <button
          onClick={() => openAt(0)}
          className="relative w-16 h-16 rounded-lg overflow-hidden
                     border border-border hover:border-primary/60
                     transition-all hover:shadow-md flex-shrink-0 group"
          title="Click to view full image"
        >
          <img
            src={images[0]}
            alt={`${productName} main photo`}
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-200"
            // object-cover = fills the box, crops excess
            // This is what makes all thumbnails look the same size
            // regardless of the original image dimensions
          />
        </button>

        {/* ── SECOND THUMBNAIL ──────────────────────────────────────────
            Same exact size and style as the first thumbnail
            Consistent dimensions guaranteed by w-16 h-16 + object-cover */}
        {images.length >= 2 && (
          <button
            onClick={() => openAt(1)}
            className="relative w-16 h-16 rounded-lg overflow-hidden
                       border border-border hover:border-primary/60
                       transition-all hover:shadow-md flex-shrink-0 group"
          >
            <img
              src={images[1]}
              alt={`${productName} photo 2`}
              className="w-full h-full object-cover group-hover:scale-105
                         transition-transform duration-200"
            />
            {/* +N badge if more than 2 images exist */}
            {images.length > 2 && (
              <div
                className="absolute inset-0 bg-black/55 flex items-center
                              justify-center"
              >
                <div className="text-center">
                  <Images className="w-3.5 h-3.5 text-white mx-auto mb-0.5" />
                  <span className="text-white text-xs font-semibold">
                    +{images.length - 2}
                  </span>
                </div>
              </div>
            )}
          </button>
        )}
      </div>

      {/* Fullscreen lightbox — shows original full resolution image */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </>
  );
}
