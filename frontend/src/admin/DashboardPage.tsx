import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Clock,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Landmark,
  LayoutGrid,
  Link2,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  Users,
  Video,
} from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Card, ErrorState, Skeleton } from '@/components/ui';
import { useAdminSession } from './AdminLayout';

interface Counts {
  books: number;
  bookCategories: number;
  programs: number;
  publications: number;
  achievements: number;
  museumItems: number;
  galleryImages: number;
  videos: number;
  notices: number;
  testimonials: number;
  boardMembers: number;
  research: number;
  links: number;
  unreadMessages: number;
  users: number;
  media: number;
  pendingTestimonials: number;
}

interface DashboardData {
  counts: Counts;
  recentMessages: {
    id: string;
    name: string;
    email: string;
    subject?: string | null;
    createdAt: string;
  }[];
  recentAudit: {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    user?: { name: string } | null;
  }[];
}

const CARDS: { key: keyof Counts; label: string; to: string; Icon: typeof BookOpen; tone: string }[] = [
  { key: 'books', label: 'Books', to: '/admin/books', Icon: BookOpen, tone: 'bg-farm-600' },
  { key: 'programs', label: 'Programs', to: '/admin/programs', Icon: LayoutGrid, tone: 'bg-earth-600' },
  { key: 'publications', label: 'Publications', to: '/admin/publications', Icon: FileText, tone: 'bg-blue-600' },
  { key: 'achievements', label: 'Achievements', to: '/admin/achievements', Icon: Award, tone: 'bg-gold-500' },
  { key: 'museumItems', label: 'Museum items', to: '/admin/museum', Icon: Landmark, tone: 'bg-farm-800' },
  { key: 'galleryImages', label: 'Gallery photos', to: '/admin/gallery-images', Icon: ImageIcon, tone: 'bg-purple-600' },
  { key: 'videos', label: 'Videos', to: '/admin/videos', Icon: Video, tone: 'bg-red-600' },
  { key: 'research', label: 'Research', to: '/admin/research', Icon: FlaskConical, tone: 'bg-teal-600' },
  { key: 'notices', label: 'Notices', to: '/admin/notices', Icon: Megaphone, tone: 'bg-orange-500' },
  { key: 'testimonials', label: 'Testimonials', to: '/admin/testimonials', Icon: MessageSquareQuote, tone: 'bg-pink-600' },
  { key: 'boardMembers', label: 'Board members', to: '/admin/board-members', Icon: Users, tone: 'bg-indigo-600' },
  { key: 'links', label: 'Useful links', to: '/admin/links', Icon: Link2, tone: 'bg-cyan-600' },
];

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const session = useAdminSession();
  const { data, loading, error, refetch } = useFetch<DashboardData>('/admin/dashboard');

  const counts = data?.counts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-farm-900">
          Welcome back{session ? `, ${session.name}` : ''}
        </h1>
        <p className="text-sm text-farm-500">A snapshot of everything happening on the site.</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {counts && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CARDS.map(({ key, label, to, Icon, tone }) => (
              <Link key={key} to={to} className="card-surface flex items-center gap-4 p-4 transition hover:shadow-card">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-2xl font-bold text-farm-900">{counts[key]}</span>
                  <span className="text-sm text-farm-500">{label}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/admin/contact-messages" className="card-surface flex items-center justify-between p-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                  <Mail className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-farm-800">Unread messages</span>
              </span>
              <Badge tone={counts.unreadMessages ? 'red' : 'gray'}>{counts.unreadMessages}</Badge>
            </Link>
            <Link to="/admin/testimonials" className="card-surface flex items-center justify-between p-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                  <MessageSquareQuote className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-farm-800">Testimonials pending</span>
              </span>
              <Badge tone={counts.pendingTestimonials ? 'gold' : 'gray'}>{counts.pendingTestimonials}</Badge>
            </Link>
            <Link to="/admin/users" className="card-surface flex items-center justify-between p-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                  <Users className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-farm-800">Admin users</span>
              </span>
              <Badge tone="farm">{counts.users}</Badge>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-semibold text-farm-900">Recent messages</h2>
                <Link to="/admin/contact-messages" className="text-sm text-farm-600 hover:underline">
                  View all
                </Link>
              </div>
              {data && data.recentMessages.length === 0 && <p className="text-sm text-farm-500">No messages yet.</p>}
              <ul className="divide-y divide-farm-50">
                {data?.recentMessages.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-farm-900">{m.subject || '(no subject)'}</p>
                      <p className="truncate text-xs text-farm-500">
                        {m.name} · {m.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-farm-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-semibold text-farm-900">Recent activity</h2>
                <Link to="/admin/audit" className="text-sm text-farm-600 hover:underline">
                  Audit log
                </Link>
              </div>
              <ul className="space-y-3">
                {data?.recentAudit.map((log) => (
                  <li key={log.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-farm-100 text-farm-600">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="font-medium capitalize text-farm-800">{log.action}</span>{' '}
                      <span className="text-farm-600">{log.entity}</span>
                      <span className="block text-xs text-farm-400">
                        {log.user?.name ?? 'System'} · {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </span>
                  </li>
                ))}
                {data && data.recentAudit.length === 0 && <li className="text-sm text-farm-500">No activity recorded yet.</li>}
              </ul>
              <div className="mt-4 flex items-center gap-3 border-t border-farm-50 pt-4 text-sm">
                <Newspaper className="h-4 w-4 text-farm-500" />
                <Link to="/admin/books-import" className="text-farm-600 hover:underline">
                  Import books from Excel
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
