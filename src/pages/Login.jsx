import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendEmailCode, loginWithEmailCode, login } from '@/lib/api';

const Login = () => {
  const [loginMode, setLoginMode] = useState('code'); // 'code' | 'password'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login, setAuthToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入正确的邮箱地址');
      return;
    }
    setError('');
    setSendingCode(true);
    try {
      await sendEmailCode({ email });
      setCountdown(60);
    } catch (err) {
      setError(err.message || '发送失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) {
      setError('请输入邮箱和验证码');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithEmailCode({ email, code });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        // 刷新页面让 AuthContext 重新获取用户信息
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ identifier, password });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查凭证');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl aurora-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">面</span>
          </div>
          <h1 className="text-2xl font-bold aurora-gradient-text mb-2">欢迎来到面悟</h1>
        </div>

        {/* 登录方式切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setLoginMode('code'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
              loginMode === 'code'
                ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <Mail size={16} /> 验证码登录
          </button>
          <button
            onClick={() => { setLoginMode('password'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
              loginMode === 'password'
                ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <Lock size={16} /> 密码登录
          </button>
        </div>

        <div className="p-8 rounded-2xl aurora-border aurora-glow">
          {loginMode === 'code' ? (
            <form onSubmit={handleCodeLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">邮箱</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="请输入邮箱地址"
                  className="h-12 bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">验证码</label>
                <div className="flex gap-3">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="h-12 bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                  />
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                    className="h-12 px-4 aurora-gradient text-white border-0 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-[#F87171]">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90">
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">邮箱</label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  type="email"
                  placeholder="请输入邮箱地址"
                  className="h-12 bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">密码</label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="h-12 bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-[#F87171]">{error}</p>}
              <div className="text-right">
                <span className="text-sm text-[#00D9FF] hover:underline cursor-pointer">忘记密码?</span>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90">
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#71717A]">
            没有账号? <Link to="/register" className="text-[#00D9FF] hover:underline">注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;