import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { SiteSettings } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Button, Card, Field, Input, Textarea } from '@/components/ui';

export default function ContactPage() {
  const { t, pick } = useI18n();
  usePageTitle('যোগাযোগ | Contact');
  const { data: settings } = useFetch<SiteSettings>('/settings');
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(2, 'Name is required').max(120),
    email: z.string().email('Enter a valid email'),
    subject: z.string().max(200).optional(),
    message: z.string().min(5, 'Message is too short').max(4000),
    consent: z.literal(true, { errorMap: () => ({ message: t('contact.form.consent') }) }),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { consent: undefined } });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await api.post('/contact', values);
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('contact.form.error'));
    }
  };

  const infoItems = [
    { Icon: MapPin, label: t('contact.address'), value: pick(settings?.addressBn, settings?.addressEn) },
    { Icon: Phone, label: t('contact.phone'), value: [settings?.phone1, settings?.phone2].filter(Boolean).join(', ') },
    { Icon: Mail, label: t('contact.email'), value: [settings?.email1, settings?.email2].filter(Boolean).join(', ') },
    { Icon: Clock, label: t('contact.hours'), value: pick(settings?.openingHoursBn, settings?.openingHoursEn) },
  ];

  return (
    <>
      <PageHeader eyebrow={t('nav.contact')} title={t('contact.title')} subtitle={t('contact.subtitle')} />
      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-farm-900">{t('contact.info')}</h2>
            <Card className="divide-y divide-farm-50">
              {infoItems.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-farm-500">{label}</p>
                    <p className="text-farm-900">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </Card>
            {settings?.mapEmbedUrl && (
              <div className="overflow-hidden rounded-2xl border border-farm-100">
                <iframe src={settings.mapEmbedUrl} title="Map" className="h-64 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </div>

          <Card className="p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-farm-900">{t('contact.title')}</h2>
            {sent && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-farm-50 px-4 py-3 text-sm text-farm-800">
                <CheckCircle2 className="h-5 w-5 text-farm-600" />
                {t('contact.form.success')}
              </div>
            )}
            {serverError && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
              <Field label={t('contact.form.name')} error={errors.name?.message} required>
                <Input {...register('name')} autoComplete="name" />
              </Field>
              <Field label={t('contact.form.email')} error={errors.email?.message} required>
                <Input type="email" {...register('email')} autoComplete="email" />
              </Field>
              <Field label={t('contact.form.subject')} error={errors.subject?.message}>
                <Input {...register('subject')} />
              </Field>
              <Field label={t('contact.form.message')} error={errors.message?.message} required>
                <Textarea rows={5} {...register('message')} />
              </Field>
              <label className="flex items-start gap-2 text-sm text-farm-700">
                <input type="checkbox" {...register('consent')} className="mt-1 h-4 w-4 rounded border-farm-300" />
                <span>{t('contact.form.consent')}</span>
              </label>
              {errors.consent && <p className="text-xs text-red-600">{errors.consent.message}</p>}
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                <Send className="h-4 w-4" /> {isSubmitting ? t('common.sending') : t('common.submit')}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </>
  );
}
