import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { NavbarLinks } from './NavbarLinks';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="animated-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <AppNavbar rightContent={<NavbarLinks />} />
      <main id="main-content" role="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
