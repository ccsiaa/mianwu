import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative pt-20 pb-16 px-4 overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00D9FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#10B981]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          让你的每一次面试都不浪费
        </h1>

        <p className="text-lg md:text-xl text-[#A1A1AA] mb-10 max-w-2xl mx-auto">
          从今天开始，每一次面试都是成长的机会。记录、分析、改进，持续精进。
        </p>

        {/* 复盘流程预览 */}
        <div className="bg-[#111113] rounded-lg p-6 mb-10 max-w-2xl mx-auto border border-[#27272A]">
          <div className="text-sm text-[#A1A1AA] mb-4">复盘流程</div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00D9FF] flex items-center justify-center text-xs font-bold">1</div>
              <span className="text-[#D4D4D8]">记录面试</span>
            </div>
            <div className="flex-1 h-px bg-[#27272A] mx-4"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00D9FF] flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-[#D4D4D8]">AI分析</span>
            </div>
            <div className="flex-1 h-px bg-[#27272A] mx-4"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00D9FF] flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-[#D4D4D8]">改进建议</span>
            </div>
            <div className="flex-1 h-px bg-[#27272A] mx-4"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-xs font-bold">4</div>
              <span className="text-[#D4D4D8]">持续成长</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/review">
            <Button size="lg" className="aurora-gradient text-white border-0 px-8 py-6 text-lg aurora-glow hover:opacity-90 transition-all">
              开始复盘 <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link to="/knowledge">
            <Button size="lg" variant="outline" className="border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B] px-8 py-6 text-lg">
              查看历史
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
