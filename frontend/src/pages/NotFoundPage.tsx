import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { usePageTitle } from '@/components/PageHeader';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  usePageTitle('পাতা পাওয়া যায়নি | Not found');
  return (
    <section className="section">
      <div className="shell flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-farm-100 text-farm-600">
          <Sprout className="h-8 w-8" />
        </span>
        <p className="mt-6 font-display text-5xl font-bold text-farm-900">404</p>
        <p className="mt-2 text-farm-600">পাতাটি পাওয়া যায়নি / This page could not be found.</p>
        <Link to="/" className="mt-6">
          <Button>হোম / Home</Button>
        </Link>
      </div>
    </section>
  );
}
