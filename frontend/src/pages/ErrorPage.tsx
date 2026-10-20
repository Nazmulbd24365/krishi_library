import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Route-level error boundary. Rendered by React Router when a route element
 * throws during render, instead of the default "Unexpected Application Error!".
 */
export default function ErrorPage() {
  const error = useRouteError();

  let message = 'Something went wrong.';
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <section className="section">
      <div className="shell flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <p className="mt-6 font-display text-2xl font-bold text-farm-900">
          কিছু একটা ভুল হয়েছে / Something went wrong
        </p>
        <p className="mt-2 max-w-xl break-words text-sm text-farm-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.reload()}>আবার চেষ্টা করুন / Retry</Button>
          <Link to="/">
            <Button variant="ghost">হোম / Home</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
