import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';

export const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#D4D4D8]">
      <Navbar />
      <main className={`${isAuthPage ? '' : 'pt-16'} pb-20 md:pb-0`}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
};
