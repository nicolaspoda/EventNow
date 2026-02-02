import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { NavbarLinks } from './NavbarLinks';

export function AppLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <AppNavbar rightContent={<NavbarLinks />} />
      <main id="main-content" role="main">
        <Outlet />
      </main>
    </>
  );
}
