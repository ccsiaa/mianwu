import { Link } from 'react-router-dom';
import { Github, Mail, MessageCircle } from 'lucide-react';

export const Footer = () => {
  const footerLinks = {
    product: [
      { label: '知识库', to: '/knowledge' },
      { label: '简历工坊', to: '/resume' },
      { label: '面试准备', to: '/interview' },
      { label: '面试复盘', to: '/review' },
    ],
    company: [
      { label: '关于我们', to: '#' },
      { label: '联系我们', to: '#' },
      { label: '加入我们', to: '#' },
      { label: '用户协议', to: '#' },
    ],
    support: [
      { label: '帮助中心', to: '#' },
      { label: '使用指南', to: '#' },
      { label: '常见问题', to: '#' },
      { label: '反馈建议', to: '#' },
    ],
  };

  const socialLinks = [
    { icon: Github, label: 'GitHub', href: '#' },
    { icon: Mail, label: '邮箱', href: 'mailto:support@mianwu.com' },
    { icon: MessageCircle, label: '微信', href: '#' },
  ];

  return (
    <footer className="border-t border-[#27272A] bg-[#0A0A0B] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg aurora-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">面</span>
              </div>
              <span className="text-xl font-bold text-[#FAFAFA]">面悟</span>
            </div>
            <p className="text-sm text-[#71717A] mb-4">
              AI智能面试教练
              <br />
              助你轻松斩获心仪Offer
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#71717A] hover:text-[#00D9FF] hover:border-[#00D9FF]/30 transition-all"
                    aria-label={social.label}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4">产品</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#71717A] hover:text-[#00D9FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4">公司</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#71717A] hover:text-[#00D9FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4">支持</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#71717A] hover:text-[#00D9FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#27272A] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#71717A]">
            © 2025 面悟. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-[#71717A]">
            <Link to="#" className="hover:text-[#00D9FF] transition-colors">
              隐私政策
            </Link>
            <Link to="#" className="hover:text-[#00D9FF] transition-colors">
              服务条款
            </Link>
            <Link to="#" className="hover:text-[#00D9FF] transition-colors">
              Cookie政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
