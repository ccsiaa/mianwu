import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generatePrepPlan, chatInterviewStream } from '@/lib/api';

const InterviewPrep = () => {
  const [step, setStep] = useState('input');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jdContent, setJdContent] = useState('');
  const [prepPlan, setPrepPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  // 对话状态
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerate = async () => {
    if (!company.trim() || !position.trim() || !jdContent.trim()) {
      setError('请填写完整信息');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await generatePrepPlan({ company, position, jd_content: jdContent });
      setPrepPlan(result.data);
      setStep('plan');
    } catch (err) {
      setError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: `你好，我是你的面试准备助手。\n\n${prepPlan?.overview || ''}\n\n你可以问我任何关于面试准备的问题。`
    };
    setMessages([welcomeMessage]);
    setStep('chat');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    const newMessages = [...messages, userMessage];
    // 先占位一条空的 assistant 消息，用于流式填充
    const assistantPlaceholder = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantPlaceholder]);
    setInputMessage('');
    setChatLoading(true);

    const context = `目标公司：${company}\n目标岗位：${position}\nJD内容：${jdContent.slice(0, 500)}\n\n面试准备核心：${prepPlan?.overview || ''}\n技术重点：${prepPlan?.tech_prep?.core_topics?.slice(0, 3).join('、') || ''}`;

    chatInterviewStream(
      {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        context,
      },
      // onChunk：每次收到新内容，追加到最后一条消息
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      },
      // onDone
      () => setChatLoading(false),
      // onError
      () => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: '抱歉，网络出现问题，请稍后重试。',
          };
          return updated;
        });
        setChatLoading(false);
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen pt-16 relative z-10">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 页面标题 */}
        <div className="mb-16">
          <p className="text-xs text-[#52525B] tracking-[0.2em] mb-4">PREPARATION</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            面试准备
          </h1>
          <p className="text-[#71717A]">输入目标岗位JD，AI为你制定准备计划</p>
        </div>

        {step === 'input' && (
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-[#52525B] tracking-wider mb-3">目标公司</label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="腾讯"
                    className="h-12 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#52525B] tracking-wider mb-3">目标岗位</label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="后端开发实习生"
                    className="h-12 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#52525B] tracking-wider mb-3">岗位JD</label>
                <Textarea
                  value={jdContent}
                  onChange={(e) => setJdContent(e.target.value)}
                  placeholder="请将岗位描述粘贴到此处..."
                  className="min-h-[240px] bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none resize-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#EF4444]">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-14 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium tracking-wide transition-all duration-300"
            >
              {loading ? '生成中...' : '生成准备计划'}
            </Button>
          </div>
        )}

        {step === 'plan' && prepPlan && (
          <div className="space-y-12">
            {/* 概述 */}
            <div className="py-8 border-t border-[#3F3F46]">
              <p className="text-sm text-[#FAFAFA] leading-relaxed">{prepPlan.overview}</p>
            </div>

            {/* 准备模块 */}
            <PrepSection
              title="简历面"
              expanded={expandedSections.resume}
              onToggle={() => toggleSection('resume')}
            >
              <PrepContent items={prepPlan.resume_prep?.focus_points} label="重点准备" />
              <PrepContent items={prepPlan.resume_prep?.likely_questions} label="可能的问题" />
              <PrepContent items={prepPlan.resume_prep?.tips} label="自我介绍建议" />
            </PrepSection>

            <PrepSection
              title="行为面"
              expanded={expandedSections.behavior}
              onToggle={() => toggleSection('behavior')}
            >
              <PrepContent items={prepPlan.behavior_prep?.key_stories} label="STAR故事" />
              <PrepContent items={prepPlan.behavior_prep?.common_questions} label="常见问题" />
              {prepPlan.behavior_prep?.framework && (
                <p className="text-sm text-[#A1A1AA] mt-4">{prepPlan.behavior_prep.framework}</p>
              )}
            </PrepSection>

            <PrepSection
              title="技术面"
              expanded={expandedSections.tech}
              onToggle={() => toggleSection('tech')}
            >
              <PrepContent items={prepPlan.tech_prep?.core_topics} label="核心知识点" />
              <PrepContent items={prepPlan.tech_prep?.deep_dive_areas} label="深挖领域" />
              <PrepContent items={prepPlan.tech_prep?.coding_practice} label="算法练习" />
            </PrepSection>

            <PrepSection
              title="公司准备"
              expanded={expandedSections.company}
              onToggle={() => toggleSection('company')}
            >
              <PrepContent items={prepPlan.company_prep?.company_info} label="需要了解" />
              <PrepContent items={prepPlan.company_prep?.questions_to_ask} label="可以问的问题" />
            </PrepSection>

            {/* 操作按钮 */}
            <div className="flex gap-4 pt-8 border-t border-[#3F3F46]">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1 h-12 border-[#3F3F46] text-[#71717A] hover:bg-transparent hover:text-[#FAFAFA] transition-colors duration-300"
              >
                重新生成
              </Button>
              <Button
                onClick={startChat}
                className="flex-1 h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium transition-all duration-300"
              >
                开始准备
              </Button>
            </div>
          </div>
        )}

        {step === 'chat' && (
          <div className="space-y-8">
            {/* 对话区域 */}
            <div className="min-h-[400px] space-y-6 py-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-[#52525B]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-[#71717A]" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-[#52525B]" />
                  </div>
                  <p className="text-sm text-[#52525B]">思考中...</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="flex gap-4 pt-6 border-t border-[#3F3F46]">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 min-h-[48px] max-h-[120px] bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none resize-none"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || chatLoading}
                className="h-12 px-6 bg-white text-black hover:bg-[#E5E5E5] border-0 transition-all duration-300"
              >
                <Send size={16} />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setStep('plan')}
              className="w-full border-[#3F3F46] text-[#52525B] hover:bg-transparent hover:text-[#71717A] transition-colors duration-300"
            >
              返回准备计划
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const PrepSection = ({ title, expanded, onToggle, children }) => {
  return (
    <div className="border-t border-[#3F3F46]">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <p className="text-sm text-[#FAFAFA]">{title}</p>
        {expanded ? (
          <ChevronUp size={14} className="text-[#52525B]" />
        ) : (
          <ChevronDown size={14} className="text-[#52525B]" />
        )}
      </button>
      {expanded && <div className="pb-6">{children}</div>}
    </div>
  );
};

const PrepContent = ({ items, label }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6 last:mb-0">
      <p className="text-xs text-[#52525B] mb-3">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#A1A1AA]">• {item}</li>
        ))}
      </ul>
    </div>
  );
};

export default InterviewPrep;
