import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendEmailCode, loginWithEmailCode, login as loginApi } from '@/lib/api';

const Login = () => {
  const [loginMode, setLoginMode] = useState('code');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setAuthToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim()) { setError('请输入邮箱'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入正确的邮箱地址'); return; }
    setError('');
    setSendingCode(true);
    try {
      await sendEmailCode({ email });
      setCountdown(60);
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) { setError('请输入邮箱和验证码'); return; }
    setLoading(true);
    try {
      const result = await loginWithEmailCode({ email, code });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) { setError('请输入邮箱和密码'); return; }
    setLoading(true);
    try {
      const result = await loginApi({ identifier, password });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#52525B] hover:text-[#71717A] transition-colors">
        <ArrowLeft size={16} /> 返回
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-16 text-center">
          <div className="w-10 h-10 rounded bg-white flex items-center justify-center mx-auto mb-6">
            <span className="text-black font-bold text-lg" style={{ fontFamily: '"Noto Serif SC", serif' }}>W</span>
          </div>
          <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: '"Noto Serif SC", serif' }}>欢迎回来</h1>
          <p className="text-sm text-[#52525B]">登录你的面悟账号</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={() => { setLoginMode('code'); setError(''); }} className={`flex-1 py-3 text-sm transition-colors ${loginMode === 'code' ? 'text-[#FAFAFA] border-b border-[#FAFAFA]' : 'text-[#52525B] hover:text-[#71717A]'}`}>
            验证码登录
          </button>
          <button onClick={() => { setLoginMode('password'); setError(''); }} className={`flex-1 py-3 text-sm transition-colors ${loginMode === 'password' ? 'text-[#FAFAFA] border-b border-[#FAFAFA]' : 'text-[#52525B] hover:text-[#71717A]'}`}>
            密码登录
          </button>
        </div>

        {loginMode === 'code' ? (
          <form onSubmit={handleCodeLogin} className="space-y-6">
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">邮箱</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="请输入邮箱" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
            </div>
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">验证码</label>
              <div className="flex gap-3">
                <Input value={code} onChange={(e) => setCode(e.target.value)} type="text" placeholder="验证码" maxLength={6} className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                <Button type="button" onClick={handleSendCode} disabled={sendingCode || countdown > 0} className="h-12 px-4 bg-white text-black hover:bg-[#E5E5E5] border-0 whitespace-nowrap disabled:opacity-50">
                  {sendingCode ? '发送中' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium">
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">邮箱</label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} type="email" placeholder="请输入邮箱" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
            </div>
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">密码</label>
              <div className="relative">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="请输入密码" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#71717A]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium">
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-[#52525B]">
          没有账号？<Link to="/register" className="text-[#71717A] hover:text-[#FAFAFA]">注册</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
