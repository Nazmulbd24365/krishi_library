import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Button, Card, Field, Input } from '@/components/ui';

export default function LoginPage() {
  usePageTitle('Admin Login');
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/admin/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/login', { email: email.trim(), password });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-farm-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500 text-farm-950">
            <Lock className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-bold text-white">SAIL Admin</h1>
          <p className="mt-1 text-sm text-farm-200">Shah Agriculture Information Library</p>
        </div>
        <Card className="p-6 md:p-8">
          {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                  required
                />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                  required
                />
              </div>
            </Field>
            <Button type="submit" size="lg" loading={busy} className="w-full">
              Sign in
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-farm-300">
          Admin accounts are provisioned from the server. Contact a super administrator for access.
        </p>
      </div>
    </div>
  );
}
