import { Clock, Brain, Target, TrendingUp } from 'lucide-react';

export const HighlightsSection = () => {
  const highlights = [
    {
      icon: Clock,
      title: '即时复盘',
      desc: '面试后快速记录和分析',
      stats: '<5min',
      statsLabel: '平均复盘时间',
    },
    {
      icon: Brain,
      title: 'AI深度分析',
      desc: '智能识别问题和改进机会',
      stats: '98%',
      statsLabel: '分析准确率',
    },
    {
      icon: Target,
      title: '精准建议',
      desc: '提供可执行的改进建议',
      stats: '85%',
      statsLabel: '用户改进率',
    },
    {
      icon: TrendingUp,
      title: '持续进步',
      desc: '量化进步，积累面试信心',
      stats: '2.3x',
      statsLabel: '平均进步倍数',
    },
  ];

  return (
    <section className="py-20 px-4 bg-[#111113] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D9FF]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
            复盘，让进步看得见
          </h2>
          <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            专业的数据分析，科学的进步方法，让每一次面试都成为成长的基石
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={28} className="text-[#00D9FF]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#FAFAFA] mb-2">
                      {highlight.title}
                    </h3>
                    <p className="text-sm text-[#A1A1AA] mb-4">
                      {highlight.desc}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#10B981]">
                        {highlight.stats}
                      </span>
                      <span className="text-sm text-[#71717A]">
                        {highlight.statsLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
