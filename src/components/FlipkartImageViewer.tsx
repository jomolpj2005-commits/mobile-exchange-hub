import { useState } from "react";
import {
  Maximize2,
  X,
  ZoomIn,
  Smartphone,
} from "lucide-react";

export interface FlipkartImageViewerProps {
  mainImageUrl: string;
  productName: string;
  brand?: string;
  condition?: string;
}

export function FlipkartImageViewer({
  mainImageUrl,
  productName,
  brand,
}: FlipkartImageViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Single Main Image Box */}
      <div className="relative w-full rounded-xl border border-border bg-white dark:bg-slate-900 p-4 sm:p-6 min-h-[380px] sm:min-h-[420px] flex items-center justify-center overflow-hidden group shadow-sm">
        {/* Top Right Fullscreen Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm transition-all"
            title="Full screen view"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Main Single Image Display */}
        {mainImageUrl ? (
          <div
            className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={mainImageUrl}
              alt={productName}
              className="max-h-[360px] sm:max-h-[380px] w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 drop-shadow-md"
            />

            {/* Hover Zoom Prompt Badge */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/80 backdrop-blur text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 pointer-events-none shadow">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>Click for Fullscreen View</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Smartphone className="h-24 w-24 text-slate-300 stroke-1" />
            <p className="text-xs">No image preview available</p>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && mainImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-base sm:text-lg">{productName}</h3>
              {brand ? <p className="text-xs text-white/60">{brand}</p> : null}
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center Single Image View */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={mainImageUrl}
              alt={productName}
              className="max-h-[80vh] max-w-[90vw] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FlipkartImageViewer;
