import { useState } from 'react';
import { Search, Star, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { analyzeInterview } from '@/lib/api';

const InterviewPrep = () => {
  const [step, setStep] = useState('select');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('请输入面经内容，例如过往面试问答或面试问题描述。');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await analyzeInterview({ content });
      setAnalysis(result.data);
      setStep('list');
    } catch (err) {
      setError(err.message || '分析失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">面试准备</h1>
        <p className="text-[#A1A1AA]">选择目标公司和岗位，AI帮你精准准备</p>
      </div>
      {step === 'select' && (
        <div className="max-w-2xl space-y-5">
          <div>
            <label className="block text-sm text-[#A1A1AA] mb-2">目标公司 *</label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="如：腾讯"
              className="h-12 bg-[#18181B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#A1A1AA] mb-2">目标岗位 *</label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="如：后端开发"
              className="h-12 bg-[#18181B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#A1A1AA] mb-2">面经内容 *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请粘贴面经问答、面试问题或你的面试经历描述。"
              className="min-h-[220px] bg-[#18181B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
            />
          </div>
          {error && <p className="text-sm text-[#F87171]">{error}</p>}
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90"
          >
            <Search size={18} className="mr-2" /> {loading ? '正在分析...' : '开始分析面经'}
          </Button>
        </div>
      )}
      {step === 'list' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h3 className="text-[#FAFAFA] font-semibold mb-1 flex items-center gap-2">
              <Clock size={16} className="text-[#00D9FF]" /> 面经分析概览
            </h3>
            <p className="text-sm text-[#A1A1AA]">面试风格：{analysis?.interview_style || '暂无数据'}</p>
            <p className="text-sm text-[#A1A1AA]">重点考察：{(analysis?.key_points || []).join('，') || '暂无数据'}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Star size={18} className="text-[#F59E0B]" /> 识别到的问题
            </h3>
            <div className="space-y-3">
              {(analysis?.questions || []).map((item, index) => (
                <QuestionCard
                  key={`${item.question}-${index}`}
                  category={item.category}
                  question={item.question}
                  rate={Math.min(95, Math.round((item.frequency ?? 0) * 100))}
                  status={item.frequency >= 0.8 ? 'mastered' : item.frequency >= 0.5 ? 'learning' : 'pending'}
                />
              ))}
              {(analysis?.questions || []).length === 0 && (
                <p className="text-sm text-[#A1A1AA]">未识别到面经问题，请检查输入内容。</p>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep('select')}
              className="flex-1 h-12 border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B]"
            >
              重新输入
            </Button>
            <Button className="flex-1 h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90">
              开始模拟面试
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ category, question, rate, status }) => {
  const statusConfig = {
    mastered: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '已掌握' },
    learning: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: '学习中' },
    pending: { color: 'text-[#71717A]', bg: 'bg-[#71717A]/10', label: '待学习' },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
      <div className="text-xs text-[#00D9FF] mb-1">{category || '其他'}</div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#FAFAFA] font-medium">{question}</span>
        <span className="text-xs text-[#A1A1AA]">出现率: {rate}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>{config.label}</span>
        <Button variant="ghost" size="sm" className="text-[#00D9FF] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10">
          模拟回答 <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default InterviewPrep;
