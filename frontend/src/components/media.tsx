import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { cn } from './ui';

/* --------------------------------------------------------- YouTube helpers */
export function extractYouTubeIdClient(input?: string | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/* --------------------------------------------------------------- VideoEmbed */
export function VideoEmbed({
  youtubeUrl,
  title,
  className,
  autoplay,
}: {
  youtubeUrl?: string | null;
  title?: string;
  className?: string;
  autoplay?: boolean;
}) {
  const id = extractYouTubeIdClient(youtubeUrl);
  const [playing, setPlaying] = useState(false);

  if (!id) {
    return (
      <div className={cn('flex aspect-video items-center justify-center rounded-2xl bg-farm-100 text-sm text-farm-500', className)}>
        Video unavailable
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className={cn(
          'group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-farm-950',
          className,
        )}
        aria-label={title ? `Play ${title}` : 'Play video'}
      >
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt={title ?? ''}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
        />
        <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-farm-950 shadow-lg transition group-hover:scale-105">
          <Play className="ml-1 h-7 w-7" fill="currentColor" />
        </span>
      </button>
    );
  }

  return (
    <div className={cn('aspect-video overflow-hidden rounded-2xl bg-black', className)}>
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`}
        title={title ?? 'YouTube video'}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Lightbox */
export interface LightboxImage {
  src: string;
  alt?: string;
  caption?: string;
}

export function Lightbox({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || images.length === 0) return null;
  const current = images[index];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-farm-950/95 p-4" role="dialog" aria-modal="true">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:left-6"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => onIndexChange((index + 1) % images.length)}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-6"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <figure className="max-h-[88vh] max-w-5xl">
        <img src={current.src} alt={current.alt ?? ''} className="mx-auto max-h-[80vh] rounded-xl object-contain" />
        {(current.caption || current.alt) && (
          <figcaption className="mt-4 text-center text-sm text-farm-100/90">{current.caption || current.alt}</figcaption>
        )}
      </figure>
    </div>
  );
}
