import { Outlet, ScrollRestoration } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { MainHeader } from './MainHeader';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader />
      <MainHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
