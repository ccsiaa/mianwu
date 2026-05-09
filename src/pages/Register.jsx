import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendEmailCode, registerWithEmailCode } from '@/lib/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
      await sendEmailCode({ email, type: 'register' });
      setCountdown(60);
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) { setError('请输入邮箱和验证码'); return; }
    setStep(2);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) { setError('请设置密码'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    setLoading(true);
    try {
      const result = await registerWithEmailCode({ email, code, password });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPassword = async () => {
    setLoading(true);
    try {
      const result = await registerWithEmailCode({ email, code });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '注册失败');
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
          <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: '"Noto Serif SC", serif' }}>注册面悟</h1>
          <p className="text-sm text-[#52525B]">{step === 2 ? '验证成功，请设置密码' : '创建你的面悟账号'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
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
              下一步
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">设置密码（可选）</label>
              <div className="relative">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="至少6位" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#71717A]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#52525B] tracking-wider mb-3">确认密码</label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="再次输入" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
            </div>
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium">
              {loading ? '注册中...' : '完成注册'}
            </Button>
            <Button type="button" variant="outline" onClick={handleSkipPassword} disabled={loading} className="w-full h-12 border-[#27272A] text-[#52525B] hover:bg-transparent hover:text-[#71717A]">
              跳过，稍后设置
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-[#52525B]">
          已有账号？<Link to="/login" className="text-[#71717A] hover:text-[#FAFAFA]">登录</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
