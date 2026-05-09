import { useState } from 'react';
import { Sparkles, FileText, Copy, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseJD, generateResume } from '@/lib/api';

const ResumeWorkshop = () => {
  const [step, setStep] = useState('input');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jdContent, setJdContent] = useState('');
  const [jdInfo, setJdInfo] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!company.trim() || !position.trim() || !jdContent.trim()) {
      setError('请填写完整信息');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const parseRes = await parseJD({ company, position, jd_content: jdContent });
      const parsedJdInfo = parseRes.data || {};
      setJdInfo(parsedJdInfo);

      const generateRes = await generateResume({
        company,
        position,
        jd_content: jdContent,
        jd_info: parsedJdInfo,
      });
      setResumeResult(generateRes.data || null);
      setStep('result');
    } catch (err) {
      setError(err.message || '生成失败');
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 relative z-10">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 页面标题 */}
        <div className="mb-16">
          <p className="text-xs text-[#52525B] tracking-[0.2em] mb-4">RESUME</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            简历工坊
          </h1>
          <p className="text-[#71717A]">粘贴目标岗位JD，AI从知识库匹配经历生成简历</p>
        </div>

        {step === 'input' && (
          <div className="space-y-12">
            {/* 提示 */}
            <div className="flex items-start gap-3 py-4 border-l border-[#3F3F46] pl-4">
              <AlertCircle size={16} className="text-[#52525B] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#52525B]">
                简历内容来自知识库，基本信息和教育背景请在
                <a href="/#/knowledge" className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"> 知识库 </a>
                中填写
              </p>
            </div>

            {/* 目标岗位 */}
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
              {loading ? '生成中...' : '生成简历'}
            </Button>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-12">
            {/* JD分析 */}
            <div className="py-8 border-t border-[#3F3F46]">
              <p className="text-xs text-[#52525B] tracking-wider mb-6">JD 分析</p>
              {jdInfo?.hard_requirements?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-[#EF4444] mb-3">硬性要求</p>
                  <ul className="space-y-2">
                    {jdInfo.hard_requirements.map((req, i) => (
                      <li key={i} className="text-sm text-[#A1A1AA]">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
              {jdInfo?.core_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-[#10B981] mb-3">核心技能</p>
                  <ul className="space-y-2">
                    {jdInfo.core_skills.map((skill, i) => (
                      <li key={i} className="text-sm text-[#A1A1AA]">• {skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 简历内容 */}
            <ResumeContent content={resumeResult?.content} />

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
                onClick={handleCopy}
                className={`flex-1 h-12 ${copied ? 'bg-[#10B981]' : 'bg-white text-black hover:bg-[#E5E5E5]'} border-0 text-sm font-medium transition-all duration-300`}
              >
                {copied ? '已复制' : '复制简历'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResumeContent = ({ content }) => {
  if (!content) return null;

  return (
    <div className="space-y-8">
      {/* 基本信息 */}
      {content.header && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-4">基本信息</p>
          <p className="text-2xl font-semibold text-[#FAFAFA]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            {content.header.name || '姓名'}
          </p>
          <p className="text-sm text-[#71717A] mt-2">
            {content.header.phone} {content.header.email && `· ${content.header.email}`}
          </p>
        </div>
      )}

      {/* 教育背景 */}
      {content.education && (content.education.school || content.education.major) && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-4">教育背景</p>
          <p className="text-[#FAFAFA]">{content.education.school} · {content.education.major} · {content.education.degree}</p>
          {(content.education.startDate || content.education.endDate) && (
            <p className="text-sm text-[#52525B] mt-2">{content.education.startDate} — {content.education.endDate || '至今'}</p>
          )}
        </div>
      )}

      {/* 实习经历 */}
      {content.internships?.length > 0 && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-6">实习经历</p>
          <div className="space-y-8">
            {content.internships.map((exp, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#FAFAFA]">{exp.company} · {exp.role}</p>
                  <p className="text-xs text-[#52525B]">{exp.startDate} — {exp.endDate || '至今'}</p>
                </div>
                <ul className="space-y-2">
                  {(Array.isArray(exp.description) ? exp.description : [exp.description]).filter(Boolean).map((d, i) => (
                    <li key={i} className="text-sm text-[#A1A1AA]">• {d}</li>
                  ))}
                </ul>
                {exp.match_reason && (
                  <p className="text-xs text-[#10B981] mt-3">→ {exp.match_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目经历 */}
      {content.projects?.length > 0 && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-6">项目经历</p>
          <div className="space-y-8">
            {content.projects.map((proj, idx) => (
              <div key={idx}>
                <p className="text-[#FAFAFA] mb-3">{proj.name} · {proj.role}</p>
                <ul className="space-y-2">
                  {(Array.isArray(proj.description) ? proj.description : [proj.description]).filter(Boolean).map((d, i) => (
                    <li key={i} className="text-sm text-[#A1A1AA]">• {d}</li>
                  ))}
                </ul>
                {proj.match_reason && (
                  <p className="text-xs text-[#A855F7] mt-3">→ {proj.match_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 技能清单 */}
      {content.skills && (content.skills.professional?.length > 0 || content.skills.tools?.length > 0) && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-4">技能清单</p>
          {content.skills.professional?.length > 0 && (
            <ul className="space-y-2 mb-4">
              {(Array.isArray(content.skills.professional) ? content.skills.professional : [content.skills.professional]).map((s, i) => (
                <li key={i} className="text-sm text-[#A1A1AA]">• {s}</li>
              ))}
            </ul>
          )}
          {content.skills.tools?.length > 0 && (
            <p className="text-sm text-[#71717A]">
              工具：{(Array.isArray(content.skills.tools) ? content.skills.tools : [content.skills.tools]).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* 自我评价 */}
      {content.self_evaluation && (
        <div className="py-6 border-t border-[#3F3F46]">
          <p className="text-xs text-[#52525B] tracking-wider mb-4">自我评价</p>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">{content.self_evaluation}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeWorkshop;
