import { Link } from 'react-router-dom';

export const FeaturesSection = () => {
  const features = [
    {
      number: '01',
      title: '记录',
      desc: '面试结束后的第一时间记录，语音或文字，快速便捷',
    },
    {
      number: '02',
      title: '分析',
      desc: 'AI深度解读你的表现，识别优势与不足',
    },
    {
      number: '03',
      title: '精进',
      desc: '针对性改进建议，持续提升面试能力',
    },
  ];

  return (
    <section className="py-32 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-20">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            我们如何帮助你
          </h2>
        </div>

        {/* 功能卡片 - 简洁 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              {/* 数字 */}
              <p
                className="text-6xl font-bold text-[#27272A] mb-6 transition-colors duration-300 group-hover:text-[#00D9FF]/30"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                {feature.number}
              </p>

              {/* 标题 */}
              <h3
                className="text-xl font-semibold text-[#FAFAFA] mb-4"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                {feature.title}
              </h3>

              {/* 描述 */}
              <p className="text-sm text-[#71717A] leading-relaxed max-w-xs mx-auto">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 底部CTA */}
        <div className="text-center mt-24">
          <p className="text-sm text-[#52525B] mb-8">
            准备好开始了吗？
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link
              to="/resume"
              className="text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-300"
            >
              简历工坊
            </Link>
            <span className="text-[#27272A]">·</span>
            <Link
              to="/interview"
              className="text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-300"
            >
              面试准备
            </Link>
            <span className="text-[#27272A]">·</span>
            <Link
              to="/review"
              className="text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-300"
            >
              面试复盘
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
