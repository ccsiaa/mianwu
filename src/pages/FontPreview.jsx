import { useState } from 'react';

const FontPreview = () => {
  const [selectedFont, setSelectedFont] = useState('system');

  const fonts = [
    {
      id: 'system',
      name: '系统默认',
      description: '当前使用的字体',
      css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    {
      id: 'noto-sans',
      name: '思源黑体 Noto Sans SC',
      description: 'Google/Adobe开源，清晰专业，7个字重',
      css: '"Noto Sans SC", sans-serif',
      link: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    },
    {
      id: 'noto-serif',
      name: '思源宋体 Noto Serif SC',
      description: '优雅衬线体，适合标题',
      css: '"Noto Serif SC", serif',
      link: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
    },
    {
      id: 'inter',
      name: 'Inter + 思源黑体',
      description: '英文Inter + 中文思源黑体，现代UI首选',
      css: 'Inter, "Noto Sans SC", sans-serif',
      link: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap',
    },
    {
      id: 'lxgw',
      name: '霞鹜文楷 LXGW WenKai',
      description: '文艺清新，适合笔记类应用',
      css: '"LXGW WenKai", cursive',
      link: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.1.0/style.css',
    },
    {
      id: 'zcool',
      name: '站酷高端黑',
      description: '设计感强，适合标题',
      css: '"ZCOOL XiaoWei", sans-serif',
      link: 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap',
    },
  ];

  const currentFont = fonts.find(f => f.id === selectedFont);

  // 动态加载字体
  const loadFont = (font) => {
    // 移除旧的字体链接
    const oldLinks = document.querySelectorAll('link[data-font]');
    oldLinks.forEach(link => link.remove());

    // 添加新的字体链接
    if (font.link) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.link;
      link.setAttribute('data-font', font.id);
      document.head.appendChild(link);
    }

    setSelectedFont(font.id);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">字体预览</h1>
        <p className="text-[#A1A1AA]">选择一种字体查看效果</p>
      </div>

      {/* 字体选择 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {fonts.map(font => (
          <button
            key={font.id}
            onClick={() => loadFont(font)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedFont === font.id
                ? 'bg-[#00D9FF]/20 border border-[#00D9FF]/50'
                : 'bg-[#18181B] border border-[#27272A] hover:border-[#00D9FF]/30'
            }`}
          >
            <p className="text-[#FAFAFA] font-medium text-sm">{font.name}</p>
            <p className="text-[#71717A] text-xs mt-1">{font.description}</p>
          </button>
        ))}
      </div>

      {/* 预览区域 */}
      <div
        className="space-y-8 p-6 rounded-xl bg-[#18181B] border border-[#27272A]"
        style={{ fontFamily: currentFont?.css }}
      >
        {/* 标题展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">标题展示</p>
          <h1 className="text-4xl font-bold text-[#FAFAFA] mb-2">面悟 AI 面试教练</h1>
          <h2 className="text-2xl font-semibold text-[#D4D4D8]">智能面试准备助手</h2>
        </div>

        {/* 正文展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">正文展示</p>
          <p className="text-base text-[#D4D4D8] leading-relaxed">
            面悟是一款AI驱动的智能面试准备工具。通过分析岗位JD，为你制定个性化的面试准备计划，
            包括简历面、行为面、技术面等多个维度的准备建议。让每一次面试都胸有成竹。
          </p>
        </div>

        {/* UI元素展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">UI元素</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg aurora-gradient text-white text-sm font-medium">
              开始准备
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#27272A] text-[#D4D4D8] text-sm border border-[#27272A]">
              取消
            </button>
            <span className="px-3 py-1 rounded-full text-xs bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
              标签
            </span>
          </div>
        </div>

        {/* 数字展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">数字与数据</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#0A0A0B]">
              <p className="text-3xl font-bold text-[#00D9FF]">128</p>
              <p className="text-sm text-[#71717A]">面试问题</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0A0A0B]">
              <p className="text-3xl font-bold text-[#10B981]">95%</p>
              <p className="text-sm text-[#71717A]">匹配度</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0A0A0B]">
              <p className="text-3xl font-bold text-[#A855F7]">24h</p>
              <p className="text-sm text-[#71717A]">准备时间</p>
            </div>
          </div>
        </div>

        {/* 列表展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">列表内容</p>
          <ul className="space-y-2">
            <li className="text-sm text-[#D4D4D8]">• 熟悉Java/Go/Python至少一门编程语言</li>
            <li className="text-sm text-[#D4D4D8]">• 了解MySQL数据库设计与优化</li>
            <li className="text-sm text-[#D4D4D8]">• 有分布式系统开发经验优先</li>
          </ul>
        </div>

        {/* 对话展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">对话界面</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="max-w-[80%] p-3 rounded-2xl bg-[#27272A] text-[#D4D4D8] text-sm">
                你好！我是你的面试准备助手。根据JD分析，这个岗位重点考察后端开发能力和系统设计思维。
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] p-3 rounded-2xl bg-[#00D9FF]/20 text-[#FAFAFA] text-sm">
                技术面我应该重点准备什么？
              </div>
            </div>
          </div>
        </div>

        {/* 英文展示 */}
        <div>
          <p className="text-xs text-[#00D9FF] mb-2">英文展示</p>
          <p className="text-base text-[#D4D4D8]">
            Interview preparation made simple. AI-powered coaching for your dream job.
          </p>
          <p className="text-sm text-[#71717A] mt-2">
            Technical Skills: Java, Go, Python, MySQL, Redis, Kafka
          </p>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="mt-6">
        <a
          href="/#/settings/fonts"
          onClick={() => {
            localStorage.setItem('selectedFont', JSON.stringify(currentFont));
          }}
          className="inline-block px-4 py-2 rounded-lg aurora-gradient text-white text-sm"
        >
          应用此字体
        </a>
      </div>
    </div>
  );
};

export default FontPreview;
