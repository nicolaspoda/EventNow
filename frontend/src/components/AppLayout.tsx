import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { NavbarLinks } from './NavbarLinks';

export function AppLayout() {
  return (
    <>
      <AppNavbar rightContent={<NavbarLinks />} />
      <Outlet />
    </>
  );
}
