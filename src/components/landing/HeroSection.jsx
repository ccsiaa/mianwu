import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden z-10">
      <div className="relative max-w-4xl mx-auto text-center">
        {/* 主标题 - 超大衬线体 */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          每一次面试
          <br />
          <span className="text-[#71717A]">都是一次成长</span>
        </h1>

        {/* 副标题 - 极简 */}
        <p
          className="text-lg md:text-xl text-[#52525B] mb-16 tracking-[0.3em]"
          style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
        >
          记录 · 分析 · 精进
        </p>

        {/* CTA按钮 */}
        <Link to="/review">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-[#E5E5E5] border-0 px-10 py-7 text-base font-medium tracking-wide transition-all duration-300"
          >
            开始使用 <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
