import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type ImgHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, Inbox, Loader2, X } from 'lucide-react';

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ Button */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-farm-700 text-white hover:bg-farm-800 shadow-soft',
  secondary: 'bg-earth-600 text-white hover:bg-earth-700 shadow-soft',
  gold: 'bg-gold-500 text-farm-950 hover:bg-gold-600 shadow-soft',
  outline: 'border border-farm-300 text-farm-800 hover:bg-farm-50 bg-white',
  ghost: 'text-farm-700 hover:bg-farm-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/* ------------------------------------------------------------------- Field */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-farm-900">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-farm-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const controlBase =
  'w-full rounded-xl border border-farm-200 bg-white px-3.5 py-2.5 text-sm text-farm-950 placeholder:text-farm-400 focus:border-farm-500 focus:ring-2 focus:ring-farm-200 transition';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlBase, className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(controlBase, 'min-h-28', className)} {...props} />,
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, 'pr-8', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

/* -------------------------------------------------------------------- Card */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card-surface', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'farm',
  className,
}: {
  children: ReactNode;
  tone?: 'farm' | 'gold' | 'gray' | 'red' | 'blue';
  className?: string;
}) {
  const tones = {
    farm: 'bg-farm-100 text-farm-800',
    gold: 'bg-gold-400/20 text-gold-600',
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Loading */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-farm-600', className)} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function EmptyState({ title, description, icon }: { title?: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-farm-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-3 text-farm-300">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <p className="font-medium text-farm-800">{title ?? 'Nothing here yet'}</p>
      {description && <p className="mt-1 max-w-md text-sm text-farm-500">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-9 w-9 text-red-500" />
      <p className="font-medium text-red-800">{message ?? 'Something went wrong'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Pagination */
export function Pagination({
  page,
  totalPages,
  onChange,
  labels,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  labels?: { previous: string; next: string; page: string; of: string };
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={labels?.previous ?? 'Previous'}
      >
        {labels?.previous ?? 'Previous'}
      </Button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-farm-400">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition',
              p === page ? 'bg-farm-700 text-white' : 'border border-farm-200 text-farm-700 hover:bg-farm-50',
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={labels?.next ?? 'Next'}
      >
        {labels?.next ?? 'Next'}
      </Button>
    </nav>
  );
}

/* -------------------------------------------------------------------- Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-farm-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className={cn('relative z-10 w-full rounded-2xl bg-white shadow-card', widths[size])}>
        <div className="flex items-center justify-between border-b border-farm-100 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold text-farm-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-farm-500 hover:bg-farm-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-farm-100 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- SmartImage */
export function SmartImage({
  src,
  alt,
  className,
  fallbackLabel,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { fallbackLabel?: string }) {
  const hasSrc = Boolean(src);
  if (!hasSrc) {
    return (
      <div className={cn('flex items-center justify-center bg-farm-100 text-farm-400', className)} aria-hidden>
        <span className="text-xs">{fallbackLabel ?? 'SAIL'}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
      {...props}
    />
  );
}

/* ----------------------------------------------------------- SectionHeading */
export function SectionHeading({
  eyebrow,
  title,
  description,
  center,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center && 'text-center', 'max-w-3xl', center && 'mx-auto', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-2xl font-bold text-farm-900 md:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-farm-600">{description}</p>}
    </div>
  );
}
