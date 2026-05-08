import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CTASection = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00D9FF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10B981]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative">
        <div className="p-12 rounded-3xl aurora-border aurora-glow-strong text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-[#FAFAFA] mb-4">
            让你的每一次面试都不浪费
          </h2>
          
          <p className="text-lg text-[#A1A1AA] mb-8 max-w-2xl mx-auto">
            从今天开始，每一次面试都是成长的机会。记录、分析、改进，持续精进。
          </p>

          <div className="flex items-center justify-center">
            <Link to="/interview-review">
              <Button
                size="lg"
                className="aurora-gradient text-white border-0 px-10 py-7 text-lg aurora-glow hover:opacity-90 transition-all"
              >
                开始复盘
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
