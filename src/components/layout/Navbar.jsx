import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || '用户';
  const displayEmail = user?.email || '';

  return (
    <nav className="h-16 border-b border-[#3F3F46] bg-[#0A0A0B]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <span className="text-black font-bold text-lg" style={{ fontFamily: '"Noto Serif SC", serif' }}>W</span>
          </div>
          <span
            className="text-lg font-medium text-[#FAFAFA]"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            面悟
          </span>
        </Link>

        {/* 导航链接 - 居中 */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
          <NavLink to="/resume">简历</NavLink>
          <NavLink to="/interview">准备</NavLink>
          <NavLink to="/review">复盘</NavLink>
        </div>

        {/* 用户菜单 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-sm text-[#52525B] hover:text-[#71717A] transition-colors"
          >
            {isLoggedIn ? displayName : '登录'}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-8 w-48 bg-[#0A0A0B] border border-[#27272A] py-2">
              {isLoggedIn ? (
                <>
                  <div className="px-4 py-3 border-b border-[#27272A]">
                    <p className="text-xs text-[#52525B]">{displayEmail}</p>
                  </div>

                  <Link
                    to="/knowledge"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#52525B] hover:text-[#71717A] transition-colors"
                  >
                    知识库
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#52525B] hover:text-[#EF4444] transition-colors"
                  >
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#52525B] hover:text-[#71717A] transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#52525B] hover:text-[#71717A] transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm transition-colors duration-300 ${
        isActive ? 'text-[#FAFAFA]' : 'text-[#52525B] hover:text-[#A1A1AA]'
      }`}
    >
      {children}
    </Link>
  );
};
