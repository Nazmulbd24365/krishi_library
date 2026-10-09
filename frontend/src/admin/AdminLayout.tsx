import { createContext, useContext, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Menu, Sprout, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/useApi';
import { Spinner, cn } from '@/components/ui';
import { ADMIN_NAV_GROUPS } from './resourceConfigs';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminSessionContext = createContext<AdminUser | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

export default function AdminLayout() {
  const { user, loading, refetch } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    refetch();
    navigate('/admin/login', { replace: true });
  };

  const nav = (
    <nav className="space-y-5" aria-label="Admin navigation">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-farm-400">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin/dashboard'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 text-sm transition',
                      isActive ? 'bg-farm-700 text-white' : 'text-farm-800 hover:bg-farm-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <AdminSessionContext.Provider value={user}>
      <div className="min-h-screen bg-farm-50 lg:flex">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-farm-100 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex items-center gap-2.5 border-b border-farm-100 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-700 text-white">
                <Sprout className="h-5 w-5" />
              </span>
              <span className="font-display font-bold text-farm-900">SAIL Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">{nav}</div>
            <div className="border-t border-farm-100 p-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-farm-700 hover:bg-farm-50"
              >
                <ExternalLink className="h-4 w-4" /> View site
              </a>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-farm-950/50" onClick={() => setOpen(false)} aria-hidden />
            <div className="relative z-10 h-full w-72 overflow-y-auto bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display font-bold text-farm-900">SAIL Admin</span>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-farm-500 hover:bg-farm-50" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-farm-100 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-farm-700 hover:bg-farm-50 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-farm-900">{user.name}</p>
                <p className="text-xs text-farm-500">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-xl border border-farm-200 px-3 py-2 text-sm text-farm-700 hover:bg-farm-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminSessionContext.Provider>
  );
}
