import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { HeroSlide } from '@/types';

const DURATION = 6000;

export function HeroSlider() {
  const { pick, t } = useI18n();
  const { data, loading } = useFetch<HeroSlide[]>('/hero-slides');
  const slides = data ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (reduceMotion || paused || slides.length < 2) return;
    const id = setInterval(() => go(1), DURATION);
    return () => clearInterval(id);
  }, [reduceMotion, paused, slides.length, go]);

  if (loading) {
    return <div className="h-[52vh] min-h-[360px] w-full animate-pulse bg-farm-100 md:h-[66vh]" />;
  }
  if (slides.length === 0) return null;

  const slide = slides[index];
  const external = slide.isExternal || /^https?:\/\//.test(slide.buttonUrl ?? '');
  const buttonLabel = pick(slide.buttonTextBn, slide.buttonTextEn);

  return (
    <section
      className="relative h-[52vh] min-h-[360px] w-full overflow-hidden bg-farm-950 md:h-[66vh]"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={slide.imageUrl}
            alt={slide.imageAlt ?? ''}
            className="h-full w-full object-cover"
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-farm-950/90 via-farm-950/60 to-farm-950/20" />
        </motion.div>
      </AnimatePresence>

      <div className="shell relative z-10 flex h-full items-center">
        <motion.div
          key={`${slide.id}-content`}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="max-w-2xl text-white"
        >
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="font-display text-3xl font-bold leading-tight drop-shadow-sm md:text-5xl"
          >
            {pick(slide.headingBn, slide.headingEn)}
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="mt-4 max-w-xl text-base leading-relaxed text-white/90 md:text-lg"
          >
            {pick(slide.descriptionBn, slide.descriptionEn)}
          </motion.p>
          {buttonLabel && slide.buttonUrl && (
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-7">
              {external ? (
                <a
                  href={slide.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl bg-gold-500 px-6 py-3 font-medium text-farm-950 transition hover:bg-gold-400"
                >
                  {buttonLabel}
                </a>
              ) : (
                <Link
                  to={slide.buttonUrl}
                  className="inline-flex items-center rounded-xl bg-gold-500 px-6 py-3 font-medium text-farm-950 transition hover:bg-gold-400"
                >
                  {buttonLabel}
                </Link>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 md:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 md:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-gold-400' : 'w-2.5 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
      <span className="sr-only">{t('home.hero.learnMore')}</span>
    </section>
  );
}
