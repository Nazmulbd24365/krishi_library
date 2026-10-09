import { useEffect } from 'react';
import type { ReactNode } from 'react';

/** Set the document title for a page (cheap SEO helper). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | SAIL`;
    return () => {
      document.title = 'শাহ কৃষি তথ্য পাঠাগার | Shah Agriculture Information Library';
    };
  }, [title]);
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-farm-100 bg-farm-50">
      <div className="shell py-12 md:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-bold text-farm-900 md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-farm-600">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
