import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendEmailCode, registerWithEmailCode } from '@/lib/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: 输入验证码, 2: 设置密码
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();
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
      await sendEmailCode({ email, type: 'register' });
      setCountdown(60);
    } catch (err) {
      setError(err.message || '发送失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) {
      setError('请输入邮箱和验证码');
      return;
    }
    setLoading(true);
    try {
      // 验证码验证，进入下一步设置密码
      setStep(2);
    } catch (err) {
      setError(err.message || '验证失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError('请设置密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const result = await registerWithEmailCode({ email, code, password });
      const token = result.data?.access_token;
      if (token) {
        localStorage.setItem('mianwu_token', token);
        window.location.href = '/knowledge';
      }
    } catch (err) {
      setError(err.message || '注册失败，请稍后重试');
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
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-[#71717A] hover:text-[#00D9FF] transition-colors"
      >
        <ArrowLeft size={18} />
        返回首页
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl aurora-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">面</span>
          </div>
          <h1 className="text-2xl font-bold aurora-gradient-text mb-2">注册面悟</h1>
          {step === 2 && (
            <p className="text-sm text-[#A1A1AA]">验证成功，请设置密码（可跳过）</p>
          )}
        </div>

        <div className="p-8 rounded-2xl aurora-border aurora-glow">
          {step === 1 ? (
            <form onSubmit={handleVerifyCode} className="space-y-5">
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
                {loading ? '验证中...' : '下一步'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">设置密码（可选）</label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="设置密码（至少6位）"
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
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">确认密码</label>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="再次输入密码"
                  className="h-12 bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              {error && <p className="text-sm text-[#F87171]">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90">
                {loading ? '注册中...' : '完成注册'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipPassword}
                disabled={loading}
                className="w-full h-12 border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]"
              >
                跳过，稍后设置
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#71717A]">
            已有账号? <Link to="/login" className="text-[#00D9FF] hover:underline">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;