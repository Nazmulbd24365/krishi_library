import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LanguageProvider } from '@/i18n';
import { PublicLayout } from '@/components/layout/PublicLayout';

import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import LibraryPage from '@/pages/LibraryPage';
import BookDetailPage from '@/pages/BookDetailPage';
import MuseumPage from '@/pages/MuseumPage';
import GalleryPage from '@/pages/GalleryPage';
import ProgramsPage from '@/pages/ProgramsPage';
import ProgramDetailPage from '@/pages/ProgramDetailPage';
import PublicationPage from '@/pages/PublicationPage';
import PublicationDetailPage from '@/pages/PublicationDetailPage';
import AchievementPage from '@/pages/AchievementPage';
import BoardMembersPage from '@/pages/BoardMembersPage';
import LinksPage from '@/pages/LinksPage';
import ResearchPage from '@/pages/ResearchPage';
import VideosPage from '@/pages/VideosPage';
import VideoDetailPage from '@/pages/VideoDetailPage';
import NoticesPage from '@/pages/NoticesPage';
import NoticeDetailPage from '@/pages/NoticeDetailPage';
import ContactPage from '@/pages/ContactPage';
import WeatherPage from '@/pages/WeatherPage';
import { PrivacyPage, TermsPage } from '@/pages/StaticPages';
import NotFoundPage from '@/pages/NotFoundPage';
import ErrorPage from '@/pages/ErrorPage';

import LoginPage from '@/admin/LoginPage';
import AdminLayout from '@/admin/AdminLayout';
import DashboardPage from '@/admin/DashboardPage';
import ResourcePage from '@/admin/ResourcePage';
import SingletonPage, { SingletonEditor, SINGLETON_DEFS } from '@/admin/SingletonEditor';
import NavigationManager from '@/admin/NavigationManager';
import UsersPage from '@/admin/UsersPage';
import AuditPage from '@/admin/AuditPage';
import MediaPage from '@/admin/MediaPage';
import BooksImportPage from '@/admin/BooksImportPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'library/:id', element: <BookDetailPage /> },
      { path: 'museum', element: <MuseumPage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'programs', element: <ProgramsPage /> },
      { path: 'programs/:id', element: <ProgramDetailPage /> },
      { path: 'publication', element: <PublicationPage /> },
      { path: 'publication/:id', element: <PublicationDetailPage /> },
      { path: 'achievement', element: <AchievementPage /> },
      { path: 'board-members', element: <BoardMembersPage /> },
      { path: 'links', element: <LinksPage /> },
      { path: 'research', element: <ResearchPage /> },
      { path: 'videos', element: <VideosPage /> },
      { path: 'videos/:id', element: <VideoDetailPage /> },
      { path: 'notices', element: <NoticesPage /> },
      { path: 'notices/:id', element: <NoticeDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'weather', element: <WeatherPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SingletonEditor def={SINGLETON_DEFS.settings} /> },
      { path: 'singletons/:key', element: <SingletonPage /> },
      { path: 'navigation', element: <NavigationManager /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'media', element: <MediaPage /> },
      { path: 'books-import', element: <BooksImportPage /> },
      { path: ':resource', element: <ResourcePage /> },
      { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
