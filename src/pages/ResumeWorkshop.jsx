import { useState } from 'react';
import { Sparkles, FileText, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseJD, generateResume } from '@/lib/api';

const ResumeWorkshop = () => {
  const [step, setStep] = useState('input');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jdContent, setJdContent] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [resumeResult, setResumeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!company.trim() || !position.trim() || !jdContent.trim()) {
      setError('请填写目标公司、目标岗位和岗位JD内容');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const parseRes = await parseJD({ company, position, jd_content: jdContent });
      setKeywords(parseRes.data?.keywords || []);

      const generateRes = await generateResume({
        company,
        position,
        jd_content: jdContent,
      });
      setResumeResult(generateRes.data || null);
      setStep('result');
    } catch (err) {
      setError(err.message || '生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const content = resumeResult?.content;
    if (!content) return;

    let text = '';
    if (content.header) {
      text += `${content.header.name || '姓名'}\n`;
      text += `${content.header.phone || ''} ${content.header.email || ''}\n\n`;
    }
    if (content.education) {
      text += `## 教育背景\n`;
      text += `${content.education.school || ''} | ${content.education.major || ''} | ${content.education.degree || ''}\n\n`;
    }
    if (content.internships?.length) {
      text += `## 实习经历\n`;
      content.internships.forEach((exp) => {
        text += `${exp.company || ''} | ${exp.role || ''} | ${exp.startDate || ''} - ${exp.endDate || ''}\n`;
        if (exp.description) {
          (Array.isArray(exp.description) ? exp.description : [exp.description]).forEach((d) => {
            text += `• ${d}\n`;
          });
        }
        text += '\n';
      });
    }
    if (content.projects?.length) {
      text += `## 项目经历\n`;
      content.projects.forEach((proj) => {
        text += `${proj.name || ''} | ${proj.role || ''}\n`;
        if (proj.description) {
          (Array.isArray(proj.description) ? proj.description : [proj.description]).forEach((d) => {
            text += `• ${d}\n`;
          });
        }
        text += '\n';
      });
    }
    if (content.skills) {
      text += `## 技能清单\n`;
      if (content.skills.professional) {
        text += `专业技能：\n`;
        (Array.isArray(content.skills.professional) ? content.skills.professional : [content.skills.professional]).forEach((s) => {
          text += `• ${s}\n`;
        });
      }
      if (content.skills.tools) {
        text += `工具：${Array.isArray(content.skills.tools) ? content.skills.tools.join('、') : content.skills.tools}\n`;
      }
    }
    if (content.self_evaluation) {
      text += `\n## 自我评价\n${content.self_evaluation}\n`;
    }

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">简历工坊</h1>
        <p className="text-[#A1A1AA]">粘贴目标岗位JD，AI从知识库匹配经历生成简历</p>
      </div>

      {step === 'input' && (
        <div className="space-y-8">
          {/* 提示信息 */}
          <div className="p-4 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#00D9FF] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#A1A1AA]">
              <p className="text-[#FAFAFA] font-medium mb-1">简历内容来自知识库</p>
              <p>基本信息和教育背景请在<a href="/#/knowledge" className="text-[#00D9FF] hover:underline">知识库</a>中填写，AI会自动从知识库匹配你的实习和项目经历。</p>
            </div>
          </div>

          {/* 目标岗位 */}
          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <FileText size={18} className="text-[#10B981]" /> 目标岗位
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">目标公司 *</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="如：腾讯、字节跳动"
                  className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">目标岗位 *</label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="如：后端开发实习生"
                  className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#A1A1AA] mb-2">粘贴岗位JD *</label>
              <Textarea
                value={jdContent}
                onChange={(e) => setJdContent(e.target.value)}
                placeholder="请将岗位描述粘贴到此处..."
                className="min-h-[200px] bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-[#F87171]">{error}</p>}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90"
          >
            <Sparkles size={18} className="mr-2" /> {loading ? '正在生成...' : '从知识库匹配经历并生成简历'}
          </Button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#00D9FF]" /> JD关键词
            </h3>
            <div className="flex flex-wrap gap-2">
              {(keywords.length > 0 ? keywords.map((item) => item.keyword) : []).map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-sm bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                  {tag}
                </span>
              ))}
              {keywords.length === 0 && <span className="text-sm text-[#A1A1AA]">未提取到关键词</span>}
            </div>
          </div>

          <ResumeContent content={resumeResult?.content} />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('input')} className="flex-1 h-12 border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B]">
              调整输入
            </Button>
            <Button onClick={handleCopy} className="flex-1 h-12 aurora-gradient text-white border-0 aurora-glow hover:opacity-90">
              <Copy size={16} className="mr-2" /> 复制简历
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ResumeContent = ({ content }) => {
  if (!content) {
    return (
      <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
        <p className="text-sm text-[#A1A1AA]">暂无生成内容，请稍后重试。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      {content.header && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3">基本信息</h3>
          <p className="text-xl font-bold text-[#FAFAFA]">{content.header.name || '姓名'}</p>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {content.header.phone} {content.header.email && `| ${content.header.email}`}
          </p>
        </div>
      )}

      {/* 教育背景 */}
      {content.education && (content.education.school || content.education.major) && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3">教育背景</h3>
          <p className="text-[#D4D4D8]">
            {content.education.school} | {content.education.major} | {content.education.degree}
          </p>
          {(content.education.startDate || content.education.endDate) && (
            <p className="text-sm text-[#A1A1AA] mt-1">{content.education.startDate} - {content.education.endDate || '至今'}</p>
          )}
        </div>
      )}

      {/* 实习经历 */}
      {content.internships?.length > 0 && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">实习经历</h3>
          <div className="space-y-4">
            {content.internships.map((exp, idx) => (
              <div key={idx} className="border-l-2 border-[#00D9FF]/30 pl-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#FAFAFA] font-medium">{exp.company} | {exp.role}</p>
                  <p className="text-xs text-[#71717A]">{exp.startDate} - {exp.endDate || '至今'}</p>
                </div>
                <ul className="mt-2 space-y-1">
                  {(Array.isArray(exp.description) ? exp.description : [exp.description]).filter(Boolean).map((d, i) => (
                    <li key={i} className="text-sm text-[#D4D4D8]">• {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目经历 */}
      {content.projects?.length > 0 && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">项目经历</h3>
          <div className="space-y-4">
            {content.projects.map((proj, idx) => (
              <div key={idx} className="border-l-2 border-[#A855F7]/30 pl-4">
                <p className="text-[#FAFAFA] font-medium">{proj.name} | {proj.role}</p>
                <ul className="mt-2 space-y-1">
                  {(Array.isArray(proj.description) ? proj.description : [proj.description]).filter(Boolean).map((d, i) => (
                    <li key={i} className="text-sm text-[#D4D4D8]">• {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 技能清单 */}
      {content.skills && (content.skills.professional?.length > 0 || content.skills.tools?.length > 0) && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">技能清单</h3>
          {content.skills.professional?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-[#A1A1AA] mb-2">专业技能</p>
              <ul className="space-y-1">
                {(Array.isArray(content.skills.professional) ? content.skills.professional : [content.skills.professional]).map((s, i) => (
                  <li key={i} className="text-sm text-[#D4D4D8]">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {content.skills.tools?.length > 0 && (
            <div>
              <p className="text-sm text-[#A1A1AA] mb-2">工具</p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(content.skills.tools) ? content.skills.tools : [content.skills.tools]).map((t, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs bg-[#27272A] text-[#A1A1AA]">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 自我评价 */}
      {content.self_evaluation && (
        <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3">自我评价</h3>
          <p className="text-sm text-[#D4D4D8]">{content.self_evaluation}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeWorkshop;
