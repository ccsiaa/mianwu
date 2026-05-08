import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Mic, User } from 'lucide-react';

export const MobileNav = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) return null;

  const tabs = [
    { to: '/knowledge', icon: BookOpen, label: '知识库' },
    { to: '/resume', icon: FileText, label: '简历' },
    { to: '/interview', icon: Mic, label: '面试' },
    { to: '/review', icon: User, label: '我的' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#111113]/95 backdrop-blur-md border-t border-[#27272A] z-50 flex items-center justify-around">
      {tabs.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 ${isActive ? 'text-[#00D9FF]' : 'text-[#71717A]'}`}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

