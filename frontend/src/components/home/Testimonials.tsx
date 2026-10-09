import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Testimonial } from '@/types';
import { SmartImage } from '@/components/ui';

export function Testimonials() {
  const { t, pick } = useI18n();
  const { data } = useFetch<Testimonial[]>('/testimonials', { pageSize: 20 });
  const items = data ?? [];
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;
  const current = items[index % items.length];
  const go = (dir: number) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <section className="section bg-white">
      <div className="shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t('home.testimonials.tag')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">
            {t('home.testimonials.title')}
          </h2>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          <motion.figure
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface px-6 py-8 text-center md:px-12 md:py-10"
          >
            <Quote className="mx-auto h-10 w-10 text-gold-400" />
            <blockquote className="prose-bn mx-auto mt-4 max-w-2xl text-lg text-farm-800">
              {pick(current.messageBn, current.messageEn)}
            </blockquote>
            <figcaption className="mt-6 flex flex-col items-center gap-2">
              <SmartImage
                src={current.photoUrl}
                alt={current.name}
                fallbackLabel={current.name.charAt(0)}
                className="h-14 w-14 rounded-full object-cover"
              />
              <span className="font-semibold text-farm-900">{current.name}</span>
              {(current.designation || current.location) && (
                <span className="text-sm text-farm-500">{current.designation || current.location}</span>
              )}
            </figcaption>
          </motion.figure>

          {items.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => go(-1)}
                aria-label={t('common.previous')}
                className="rounded-full border border-farm-200 p-2 text-farm-700 hover:bg-farm-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1.5">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === index % items.length ? 'w-6 bg-farm-600' : 'w-2 bg-farm-200'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => go(1)}
                aria-label={t('common.next')}
                className="rounded-full border border-farm-200 p-2 text-farm-700 hover:bg-farm-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
