import { Star, Quote } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: '张同学',
      role: '后端开发 · 已入职腾讯',
      avatar: 'https://nocode.meituan.com/photo/search?keyword=professional,male&width=80&height=80&source=meituan',
      content: '面悟帮我系统地梳理了项目经历，生成的简历非常专业。面试准备功能让我对高频问题了如指掌，最终顺利拿到了腾讯的offer！',
      rating: 5,
    },
    {
      name: '李同学',
      role: '前端开发 · 已入职字节跳动',
      avatar: 'https://nocode.meituan.com/photo/search?keyword=professional,female&width=80&height=80&source=meituan',
      content: 'AI面试复盘功能太强大了！每次面试后都能得到详细的分析报告，帮我快速找到薄弱点并改进。强烈推荐给正在找工作的同学！',
      rating: 5,
    },
    {
      name: '王同学',
      role: '算法工程师 · 已入职美团',
      avatar: 'https://nocode.meituan.com/photo/search?keyword=professional,male,glasses&width=80&height=80&source=meituan',
      content: '知识库功能让我的经历沉淀变得非常简单，AI自动提取关键词和亮点。简历工坊根据JD智能匹配经历，省了我很多时间。',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
            用户评价
          </h2>
          <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            听听他们的成功故事
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] transition-all relative"
            >
              <Quote size={32} className="text-[#00D9FF]/20 absolute top-4 right-4" />
              
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mx-auto"
                />
                <div>
                  <h4 className="text-[#FAFAFA] font-semibold">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-[#71717A]">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                ))}
              </div>

              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {testimonial.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
