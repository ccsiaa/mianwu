import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Mic, BarChart3, User, LogOut, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

export const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const hideNav = location.pathname === '/login' || location.pathname === '/register';
  if (hideNav) return null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取用户显示名称
  const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || '用户';
  const displayEmail = user?.email || '';

  return (
    <nav className="h-16 border-b border-[#27272A] bg-[#0A0A0B]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg aurora-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">面</span>
          </div>
          <span className="text-xl font-bold text-[#FAFAFA]">面悟</span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink to="/resume" icon={<FileText size={18} />}>简历工坊</NavLink>
          <NavLink to="/interview" icon={<Mic size={18} />}>面试准备</NavLink>
          <NavLink to="/review" icon={<BarChart3 size={18} />}>面试复盘</NavLink>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-[#27272A] border border-[#3F3F46] flex items-center justify-center hover:border-[#00D9FF] transition-colors"
            >
              <User size={18} className="text-[#A1A1AA]" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-xl bg-[#18181B] border border-[#27272A] shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {isLoggedIn ? (
                  <>
                    {/* 用户信息 */}
                    <div className="px-4 py-3 border-b border-[#27272A]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
                          <User size={20} className="text-[#00D9FF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#FAFAFA]">{displayName}</p>
                          <p className="text-xs text-[#71717A] flex items-center gap-1">
                            <Mail size={12} /> {displayEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/knowledge"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#D4D4D8] hover:bg-[#27272A] hover:text-[#FAFAFA] transition-colors"
                    >
                      <BookOpen size={16} /> 知识库
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#71717A] hover:bg-[#27272A] hover:text-[#EF4444] transition-colors"
                    >
                      <LogOut size={16} /> 退出登录
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#D4D4D8] hover:bg-[#27272A] hover:text-[#FAFAFA] transition-colors"
                    >
                      <LogIn size={16} /> 登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#D4D4D8] hover:bg-[#27272A] hover:text-[#FAFAFA] transition-colors"
                    >
                      <User size={16} /> 注册
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`relative flex items-center gap-1.5 text-sm transition-colors pb-1 ${isActive ? 'text-[#00D9FF]' : 'text-[#A1A1AA] hover:text-[#D4D4D8]'}`}>
      {icon}
      {children}
      {isActive && <div className="absolute -bottom-4 left-0 right-0 h-0.5 aurora-gradient rounded-full" />}
    </Link>
  );
};