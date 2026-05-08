import { Mic, Brain, Target, BookOpen } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Mic,
      title: '快速记录',
      desc: '面试后立即记录，语音或文字输入，方便快捷',
      color: 'text-[#00D9FF]',
      bgColor: 'bg-[#00D9FF]/10',
    },
    {
      icon: Brain,
      title: '表现分析',
      desc: 'AI深度分析面试表现，识别优势和不足',
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10',
    },
    {
      icon: Target,
      title: '改进建议',
      desc: '基于分析结果，提供针对性的改进建议',
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#F59E0B]/10',
    },
    {
      icon: BookOpen,
      title: '知识库沉淀',
      desc: '问题自动提取沉淀，支持分项目查询历史问题',
      color: 'text-[#A855F7]',
      bgColor: 'bg-[#A855F7]/10',
    },
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
            面试复盘全流程
          </h2>
          <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            从记录到分析，从建议到成长，让每一次面试都成为进步的踏脚石
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] transition-all aurora-card-hover"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <Icon size={24} className={feature.color} />
                </div>
                <h3 className="text-xl font-semibold text-[#FAFAFA] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#A1A1AA]">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
