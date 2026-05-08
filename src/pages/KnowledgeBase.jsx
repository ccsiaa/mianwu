import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Building2, GraduationCap, Trophy, Code, User,
  ChevronRight, X, Save, Trash2, MessageSquare, Calendar, LogIn, Sparkles, ChevronLeft, ChevronRight as ChevronRightIcon, Upload, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getExperiences, createExperience, updateExperience, deleteExperience, getExperienceQuestions, parseResume } from '@/lib/api';

// 年月选择器组件
const MonthPicker = ({ value, onChange, placeholder, minDate }) => {
  const [open, setOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setTempYear(y);
      setTempMonth(m);
    } else if (minDate) {
      // 如果没有值但有最小日期限制，默认设置为最小日期
      const [y, m] = minDate.split('-').map(Number);
      setTempYear(y);
      setTempMonth(m);
    } else {
      setTempYear(new Date().getFullYear());
      setTempMonth(new Date().getMonth() + 1);
    }
  }, [value, open, minDate]);

  const handleConfirm = () => {
    onChange(`${tempYear}-${String(tempMonth).padStart(2, '0')}`);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // 判断某个月份是否可选（不能小于 minDate）
  const isMonthDisabled = (year, month) => {
    if (!minDate) return false;
    const [minYear, minMonth] = minDate.split('-').map(Number);
    if (year < minYear) return true;
    if (year === minYear && month < minMonth) return true;
    return false;
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // 计算年份范围
  const minYear = minDate ? parseInt(minDate.split('-')[0]) : 2010;
  const maxYear = new Date().getFullYear() + 5;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 w-full px-3 rounded-lg bg-[#0A0A0B] border border-[#27272A] text-left flex items-center justify-between hover:border-[#3F3F46] transition-colors"
      >
        <span className={value ? 'text-[#FAFAFA]' : 'text-[#71717A]'}>
          {value ? `${value.split('-')[0]}年${parseInt(value.split('-')[1])}月` : placeholder || '选择时间'}
        </span>
        {value && (
          <X size={14} className="text-[#71717A] hover:text-[#FAFAFA]" onClick={handleClear} />
        )}
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 bg-[#18181B] border border-[#27272A] rounded-xl p-4 shadow-xl w-64">
          {/* 年份选择 */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setTempYear(Math.max(minYear, tempYear - 1))}
              className="p-1 hover:bg-[#27272A] rounded disabled:opacity-50"
              disabled={tempYear <= minYear}
            >
              <ChevronLeft size={16} className="text-[#A1A1AA]" />
            </button>
            <span className="text-[#FAFAFA] font-medium">{tempYear}年</span>
            <button
              type="button"
              onClick={() => setTempYear(Math.min(maxYear, tempYear + 1))}
              className="p-1 hover:bg-[#27272A] rounded disabled:opacity-50"
              disabled={tempYear >= maxYear}
            >
              <ChevronRightIcon size={16} className="text-[#A1A1AA]" />
            </button>
          </div>

          {/* 月份选择 */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {months.map((m) => {
              const disabled = isMonthDisabled(tempYear, m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => !disabled && setTempMonth(m)}
                  disabled={disabled}
                  className={`py-1.5 rounded text-sm transition-colors ${
                    disabled
                      ? 'bg-[#1A1A1A] text-[#52525B] cursor-not-allowed'
                      : tempMonth === m
                        ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                        : 'bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {m}月
                </button>
              );
            })}
          </div>

          {/* 确认按钮 */}
          <Button
            type="button"
            onClick={handleConfirm}
            className="w-full aurora-gradient text-white border-0"
          >
            确定
          </Button>
        </div>
      )}
    </div>
  );
};

const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'basic', label: '基本信息', icon: User, color: '#00D9FF' },
  { key: 'internship', label: '实习', icon: Building2, color: '#6366F1' },
  { key: 'project', label: '项目', icon: Code, color: '#10B981' },
  { key: 'education', label: '教育', icon: GraduationCap, color: '#A855F7' },
  { key: 'competition', label: '竞赛', icon: Trophy, color: '#F59E0B' },
];

const typeColors = {
  basic: { border: 'border-l-[#00D9FF]', bg: 'bg-[#00D9FF]/10', text: 'text-[#00D9FF]' },
  internship: { border: 'border-l-[#6366F1]', bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]' },
  project: { border: 'border-l-[#10B981]', bg: 'bg-[#10B981]/10', text: 'text-[#10B981]' },
  education: { border: 'border-l-[#A855F7]', bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]' },
  competition: { border: 'border-l-[#F59E0B]', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]' },
  other: { border: 'border-l-[#71717A]', bg: 'bg-[#71717A]/10', text: 'text-[#71717A]' },
};

const typeLabelMap = {
  basic: '基本信息',
  internship: '实习',
  project: '项目',
  education: '教育',
  competition: '竞赛',
  other: '其他',
};

const KnowledgeBase = () => {
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null); // 正在编辑的经历
  const [selectedExp, setSelectedExp] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null); // 选中的面试问题
  const [formData, setFormData] = useState({
    type: 'project',
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    skills: '',
  });
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['experiences', activeTab],
    queryFn: () => getExperiences(activeTab === 'all' ? {} : { type: activeTab }).then((res) => res.data),
    enabled: isLoggedIn,
  });

  const createMutation = useMutation({
    mutationFn: createExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setShowForm(false);
      resetForm();
    },
    onError: (err) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setShowForm(false);
      setEditingExp(null);
      resetForm();
    },
    onError: (err) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setSelectedExp(null);
    },
  });

  // 当前筛选的经历列表
  const rawExperiences = isLoggedIn ? (data?.list || []) : [];
  // 直接从 selectedExp 获取面试问题，不需要额外查询
  const questions = selectedExp?.interviewQuestions || [];

  // 排序函数：按类型顺序排列，每个类型内按时间由新到旧
  const typeOrder = ['basic', 'education', 'internship', 'project', 'competition', 'other'];
  const experiences = activeTab === 'all'
    ? [...rawExperiences].sort((a, b) => {
        const orderA = typeOrder.indexOf(a.type) >= 0 ? typeOrder.indexOf(a.type) : 999;
        const orderB = typeOrder.indexOf(b.type) >= 0 ? typeOrder.indexOf(b.type) : 999;
        // 先按类型排序
        if (orderA !== orderB) return orderA - orderB;
        // 同类型内按开始时间由新到旧排序
        const dateA = a.startDate || '0000-00';
        const dateB = b.startDate || '0000-00';
        return dateB.localeCompare(dateA);
      })
    : rawExperiences;

  // 获取全部数据用于统计（不受筛选影响）
  const { data: allData } = useQuery({
    queryKey: ['experiences', 'all'],
    queryFn: () => getExperiences({}).then((res) => res.data),
    enabled: isLoggedIn,
  });

  const allExperiences = allData?.list || [];

  // 统计（基于全部数据）
  const totalQuestions = allExperiences.reduce((sum, exp) => sum + (exp.questionCount || 0), 0);
  const internshipCount = allExperiences.filter((e) => e.type === 'internship').length;
  const projectCount = allExperiences.filter((e) => e.type === 'project').length;

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">知识库</h1>
          <p className="text-[#A1A1AA]">记录你的经历，关联面试问题，为简历输出提供素材</p>
        </div>

        {/* Stats - 全部显示0 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="关联题目" value={0} color="#10B981" />
          <StatCard label="实习经历" value={0} color="#6366F1" />
          <StatCard label="项目经历" value={0} color="#F59E0B" />
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-[#18181B] to-[#0A0A0B] border border-[#27272A] p-8 text-center">
          <div className="w-16 h-16 rounded-full aurora-gradient flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#FAFAFA] mb-2">登录后解锁知识库</h2>
          <p className="text-[#A1A1AA] mb-6 max-w-md mx-auto">
            知识库可以帮助你沉淀所有经历，关联面试问题，让 AI 为你生成更精准的简历内容。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login">
              <Button className="aurora-gradient text-white border-0 hover:opacity-90 px-8">
                <LogIn size={16} className="mr-2" /> 立即登录
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B] px-8">
                注册账号
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeaturePreview
            icon={Building2}
            title="经历管理"
            desc="记录实习、项目、教育等经历，为简历提供素材"
          />
          <FeaturePreview
            icon={MessageSquare}
            title="问题关联"
            desc="自动关联面试问题，分析每段经历的考察重点"
          />
          <FeaturePreview
            icon={Sparkles}
            title="AI 加持"
            desc="智能生成简历内容，突出你的核心亮点"
          />
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      type: 'project',
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
      skills: '',
    });
    setFormError('');
    setEditingExp(null);
  };

  const openEditForm = (exp) => {
    setEditingExp(exp);
    setFormData({
      type: exp.type || 'project',
      company: exp.company || '',
      role: exp.role || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
      skills: (exp.skills || []).join(', '),
    });
    setShowForm(true);
    setSelectedExp(null);
  };

  const handleSubmit = () => {
    // 基本信息只需要姓名
    if (formData.type === 'basic') {
      if (!formData.company.trim()) {
        setFormError('请填写姓名');
        return;
      }
    } else if (formData.type === 'competition') {
      // 竞赛只需要名称和奖项等级
      if (!formData.company.trim() || !formData.role.trim()) {
        setFormError('请填写竞赛名称和奖项等级');
        return;
      }
    } else {
      if (!formData.company.trim() || !formData.description.trim()) {
        setFormError('请填写经历名称和详细描述');
        return;
      }
    }
    setFormError('');

    const payload = {
      ...formData,
      skills: formData.skills.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    };

    if (editingExp) {
      updateMutation.mutate({ id: editingExp.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await parseResume(formData);
      setParsedPreview(res.data);
    } catch (err) {
      setUploadError(err.message || '解析失败，请稍后重试');
    } finally {
      setUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 导入解析结果到知识库
  const handleImportParsed = async () => {
    if (!parsedPreview) return;

    try {
      // 导入基本信息
      if (parsedPreview.basic?.name) {
        await createExperience({
          type: 'basic',
          company: parsedPreview.basic.name,
          role: parsedPreview.basic.phone || '',
          description: parsedPreview.basic.email || '',
        });
      }

      // 导入教育背景
      if (parsedPreview.education?.school) {
        await createExperience({
          type: 'education',
          company: parsedPreview.education.school,
          role: `${parsedPreview.education.major || ''}/${parsedPreview.education.degree || ''}`,
          startDate: parsedPreview.education.startDate || '',
          endDate: parsedPreview.education.endDate || '',
          description: '',
        });
      }

      // 导入实习经历
      for (const exp of parsedPreview.internships || []) {
        await createExperience({
          type: 'internship',
          company: exp.company,
          role: exp.role,
          startDate: exp.startDate,
          endDate: exp.endDate,
          description: Array.isArray(exp.description) ? exp.description.join('\n') : exp.description,
          skills: exp.skills || [],
        });
      }

      // 导入项目经历
      for (const proj of parsedPreview.projects || []) {
        await createExperience({
          type: 'project',
          company: proj.name,
          role: proj.role,
          startDate: proj.startDate || '',
          endDate: proj.endDate || '',
          description: Array.isArray(proj.description) ? proj.description.join('\n') : proj.description,
          skills: proj.skills || [],
        });
      }

      // 刷新列表
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setParsedPreview(null);
    } catch (err) {
      setUploadError('导入失败：' + (err.message || '请稍后重试'));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">知识库</h1>
        <p className="text-[#A1A1AA]">记录你的经历，关联面试问题，为简历输出提供素材</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="关联题目" value={totalQuestions} color="#10B981" />
        <StatCard label="实习经历" value={internshipCount} color="#6366F1" />
        <StatCard label="项目经历" value={projectCount} color="#F59E0B" />
      </div>

      {/* Tabs & Add Button */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {typeTabs.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === key
                ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            {Icon && <Icon size={14} style={{ color: activeTab === key ? '#00D9FF' : color }} />}
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#FAFAFA]"
          >
            <Upload size={16} className="mr-1" /> {uploading ? '解析中...' : '上传简历'}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              // 根据当前标签页设置默认类型
              const defaultType = activeTab === 'all' ? 'internship' : activeTab;
              setFormData(prev => ({ ...prev, type: defaultType }));
              setShowForm(true);
            }}
            className="aurora-gradient text-white border-0 hover:opacity-90"
          >
            <Plus size={16} className="mr-1" /> 添加经历
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#A1A1AA] mb-6">正在加载...</p>}
      {error && <p className="text-sm text-[#F87171] mb-6">加载失败：{error.message}</p>}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 ? (
          <div className="rounded-2xl bg-[#18181B] border border-[#27272A] p-10 text-center text-[#A1A1AA]">
            <p className="mb-2">暂无经历记录</p>
            <p className="text-sm">添加你的基本信息、实习、项目、教育等经历，为简历输出提供基础素材</p>
          </div>
        ) : (
          experiences.map((exp) => {
            const colors = typeColors[exp.type] || typeColors.other;
            // 基本信息类型特殊显示
            const isBasic = exp.type === 'basic';
            // 竞赛类型特殊显示
            const isCompetition = exp.type === 'competition';
            return (
              <div
                key={exp.id}
                className={`p-5 rounded-xl bg-[#18181B] border border-[#27272A] border-l-4 ${colors.border} cursor-pointer hover:border-[#3F3F46] transition-all`}
                onClick={() => setSelectedExp(exp)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">
                      {isBasic ? (exp.company || '未填写姓名') : (exp.company || exp.role || '未命名经历')}
                    </h3>
                    <p className="text-sm text-[#A1A1AA]">
                      {isBasic ? (
                        `${exp.role || '未填写电话'} • ${exp.description || '未填写邮箱'}`
                      ) : isCompetition ? (
                        exp.role || '未填写奖项'
                      ) : (
                        `${exp.role || '无岗位'} • ${exp.startDate || '未知'} - ${exp.endDate || '至今'}`
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                    {typeLabelMap[exp.type] || '其他'}
                  </span>
                </div>
                {!isBasic && !isCompetition && (
                  <>
                    <p className="text-sm text-[#D4D4D8] mb-3 line-clamp-2">{exp.description || '暂无描述'}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(exp.skills || []).slice(0, 5).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded text-xs bg-[#27272A] text-[#A1A1AA]">
                          {tag}
                        </span>
                      ))}
                      {(exp.skills || []).length > 5 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#27272A] text-[#71717A]">
                          +{(exp.skills || []).length - 5}
                        </span>
                      )}
                    </div>
                    {/* 显示关联的面试问题 */}
                    {(exp.interviewQuestions || []).length > 0 && (
                      <div className="mb-3 p-3 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                        <div className="text-xs text-[#EC4899] mb-2 flex items-center gap-1">
                          <MessageSquare size={12} /> 面试被问 {(exp.interviewQuestions || []).length} 题
                        </div>
                        {(exp.interviewQuestions || []).slice(0, 2).map((q, idx) => (
                          <div key={idx} className="text-sm text-[#D4D4D8] truncate mb-1">
                            <span className="text-[#71717A] mr-2">Q:</span>
                            {q.question}
                          </div>
                        ))}
                        {(exp.interviewQuestions || []).length > 2 && (
                          <div className="text-xs text-[#71717A]">
                            还有 {(exp.interviewQuestions || []).length - 2} 道问题...
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[#27272A]">
                  <div className="flex items-center gap-4 text-xs text-[#71717A]">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> 被问 {(exp.interviewQuestions || []).length || 0} 题
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {exp.lastQuestionDate ? new Date(exp.lastQuestionDate).toLocaleDateString() : '暂无提问'}
                    </span>
                  </div>
                  <span className="text-xs text-[#00D9FF] flex items-center gap-1">
                    查看详情 <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Experience Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#FAFAFA]">{editingExp ? '编辑经历' : '添加经历'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#71717A] hover:text-[#FAFAFA]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">类型</label>
                <div className="flex flex-wrap gap-2">
                  {typeTabs.slice(1).map(({ key, label, icon: Icon, color }) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, type: key })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        formData.type === key
                          ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                          : 'bg-[#27272A] text-[#A1A1AA] border border-transparent hover:border-[#3F3F46]'
                      }`}
                    >
                      {Icon && <Icon size={14} style={{ color: formData.type === key ? '#00D9FF' : color }} />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 基本信息类型 - 特殊表单 */}
              {formData.type === 'basic' ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">姓名 *</label>
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="你的姓名"
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">电话</label>
                      <Input
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="手机号码"
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">邮箱</label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="邮箱地址"
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#71717A]">基本信息用于简历生成的头部信息，请确保准确填写。</p>
                </>
              ) : formData.type === 'competition' ? (
                <>
                  {/* 竞赛类型 - 简化表单 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">竞赛名称 *</label>
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="如：ACM程序设计大赛"
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">奖项等级 *</label>
                      <Input
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="如：省级一等奖"
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#71717A]">竞赛经历只需填写名称和奖项等级即可。</p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">
                        {formData.type === 'education' ? '学校名称' : formData.type === 'project' ? '项目名称' : '公司/名称'}</label>
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder={formData.type === 'education' ? '如：北京大学' : formData.type === 'project' ? '如：电商系统' : '如：腾讯'}
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">
                        {formData.type === 'education' ? '专业/学位' : '角色/职位'}</label>
                      <Input
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder={formData.type === 'education' ? '如：计算机硕士' : '如：后端开发'}
                        className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">开始时间</label>
                      <MonthPicker
                        value={formData.startDate}
                        onChange={(v) => {
                          // 如果开始时间改变，检查结束时间是否需要清空
                          if (formData.endDate && v > formData.endDate) {
                            setFormData({ ...formData, startDate: v, endDate: '' });
                          } else {
                            setFormData({ ...formData, startDate: v });
                          }
                        }}
                        placeholder="选择开始时间"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A1A1AA] mb-2">结束时间</label>
                      <MonthPicker
                        value={formData.endDate}
                        onChange={(v) => setFormData({ ...formData, endDate: v })}
                        placeholder="至今可留空"
                        minDate={formData.startDate}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#A1A1AA] mb-2">详细描述 *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="描述你的主要职责、成果、使用的技术等。越详细越好，AI会据此生成简历内容。"
                      className="min-h-[120px] bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#A1A1AA] mb-2">技能标签</label>
                    <Input
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="用逗号分隔，如：Java, MySQL, Redis, Spring"
                      className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                    />
                  </div>
                </>
              )}

              {formError && <p className="text-sm text-[#F87171]">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A]"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 aurora-gradient text-white border-0 hover:opacity-90"
                >
                  <Save size={16} className="mr-1" />
                  {(createMutation.isPending || updateMutation.isPending) ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 简历解析预览弹窗 */}
      {parsedPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#FAFAFA]">简历解析结果</h2>
              <button onClick={() => setParsedPreview(null)} className="text-[#71717A] hover:text-[#FAFAFA]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* 基本信息 */}
              {parsedPreview.basic?.name && (
                <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                  <h3 className="text-sm font-medium text-[#00D9FF] mb-2">基本信息</h3>
                  <p className="text-[#FAFAFA]">{parsedPreview.basic.name}</p>
                  <p className="text-sm text-[#A1A1AA]">{parsedPreview.basic.phone} | {parsedPreview.basic.email}</p>
                </div>
              )}

              {/* 教育背景 */}
              {parsedPreview.education?.school && (
                <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                  <h3 className="text-sm font-medium text-[#A855F7] mb-2">教育背景</h3>
                  <p className="text-[#FAFAFA]">{parsedPreview.education.school} | {parsedPreview.education.major} | {parsedPreview.education.degree}</p>
                  <p className="text-sm text-[#A1A1AA]">{parsedPreview.education.startDate} - {parsedPreview.education.endDate}</p>
                </div>
              )}

              {/* 实习经历 */}
              {parsedPreview.internships?.length > 0 && (
                <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                  <h3 className="text-sm font-medium text-[#6366F1] mb-2">实习经历 ({parsedPreview.internships.length})</h3>
                  {parsedPreview.internships.map((exp, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className="text-[#FAFAFA]">{exp.company} | {exp.role}</p>
                      <p className="text-xs text-[#71717A]">{exp.startDate} - {exp.endDate}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 项目经历 */}
              {parsedPreview.projects?.length > 0 && (
                <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                  <h3 className="text-sm font-medium text-[#10B981] mb-2">项目经历 ({parsedPreview.projects.length})</h3>
                  {parsedPreview.projects.map((proj, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className="text-[#FAFAFA]">{proj.name} | {proj.role}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 技能 */}
              {parsedPreview.skills?.professional?.length > 0 && (
                <div className="p-4 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                  <h3 className="text-sm font-medium text-[#F59E0B] mb-2">技能</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedPreview.skills.professional.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs bg-[#27272A] text-[#A1A1AA]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {uploadError && <p className="text-sm text-[#F87171] mb-4">{uploadError}</p>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setParsedPreview(null)}
                className="flex-1 border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A]"
              >
                取消
              </Button>
              <Button
                onClick={handleImportParsed}
                className="flex-1 aurora-gradient text-white border-0 hover:opacity-90"
              >
                <Save size={16} className="mr-1" /> 导入到知识库
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Detail Modal */}
      {selectedExp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#FAFAFA]">{selectedExp.company || selectedExp.role}</h2>
                <p className="text-sm text-[#A1A1AA]">
                  {selectedExp.role} • {selectedExp.startDate || '未知'} - {selectedExp.endDate || '至今'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEditForm(selectedExp)}
                  className="text-sm text-[#00D9FF] hover:underline"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定删除该经历？此操作不可恢复。')) {
                      deleteMutation.mutate(selectedExp.id);
                    }
                  }}
                  className="text-sm text-[#EF4444] hover:underline"
                >
                  删除
                </button>
                <button
                  onClick={() => setSelectedExp(null)}
                  className="p-1 rounded hover:bg-[#27272A] text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#A1A1AA] mb-2">详细描述</h3>
              <p className="text-sm text-[#D4D4D8] whitespace-pre-wrap bg-[#0A0A0B] rounded-lg p-4">
                {selectedExp.description || '暂无描述'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#A1A1AA] mb-2">技能标签</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedExp.skills || []).map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-lg text-sm bg-[#27272A] text-[#A1A1AA]">
                    {tag}
                  </span>
                ))}
                {(selectedExp.skills || []).length === 0 && (
                  <span className="text-sm text-[#71717A]">暂无标签</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#A1A1AA]">
                  关联面试问题 {questions.length > 0 && `(${questions.length} 题)`}
                </h3>
              </div>
              {questions.length === 0 ? (
                <div className="text-sm text-[#71717A] bg-[#0A0A0B] rounded-lg p-4 text-center">
                  暂无关联的面试问题，在面试复盘时会自动关联
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#0A0A0B] border border-[#27272A] cursor-pointer hover:border-[#3F3F46] transition-colors"
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-[#D4D4D8]">{q.question || q.content}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap ${
                          q.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          q.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                          'bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}>
                          {q.level === 'good' ? '⭐⭐⭐ 良好' :
                           q.level === 'bad' ? '⭐ 待改进' : '⭐⭐ 一般'}
                        </span>
                      </div>
                      {q.answer && (
                        <p className="text-xs text-[#A1A1AA] mt-2 line-clamp-2">{q.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 面试问题详情弹窗 */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#FAFAFA]">问题详情</h2>
              <button onClick={() => setSelectedQuestion(null)} className="text-[#71717A] hover:text-[#FAFAFA]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 问题 */}
              <div>
                <h3 className="text-sm text-[#A1A1AA] mb-1">问题内容</h3>
                <p className="text-[#FAFAFA] font-medium">{selectedQuestion.question}</p>
              </div>

              {/* 分类和评分 */}
              <div className="flex gap-4">
                <span className={`px-3 py-1 rounded text-sm ${
                  selectedQuestion.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' :
                  selectedQuestion.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                  'bg-[#F59E0B]/10 text-[#F59E0B]'
                }`}>
                  {selectedQuestion.level === 'good' ? '⭐⭐⭐ 良好' :
                   selectedQuestion.level === 'bad' ? '⭐ 待改进' : '⭐⭐ 一般'}
                </span>
                <span className="px-3 py-1 rounded text-sm bg-[#27272A] text-[#A1A1AA]">
                  {selectedQuestion.category || '其他'}
                </span>
              </div>

              {/* 回答内容 */}
              {selectedQuestion.answer && (
                <div>
                  <h3 className="text-sm text-[#A1A1AA] mb-1">你的回答</h3>
                  <p className="text-[#D4D4D8] bg-[#0A0A0B] rounded-lg p-3">{selectedQuestion.answer}</p>
                </div>
              )}

              {/* 分析 */}
              {selectedQuestion.analysis && (
                <div>
                  <h3 className="text-sm text-[#A1A1AA] mb-1">回答分析</h3>
                  <p className="text-[#D4D4D8]">{selectedQuestion.analysis}</p>
                </div>
              )}

              {/* 改进建议 */}
              {selectedQuestion.improvement && (
                <div className="p-3 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                  <h3 className="text-sm font-medium text-[#00D9FF] mb-1">改进建议</h3>
                  <p className="text-sm text-[#D4D4D8]">{selectedQuestion.improvement}</p>
                </div>
              )}

              {/* 面试来源 */}
              {selectedQuestion.interviewCompany && (
                <div className="text-xs text-[#71717A]">
                  来源：{selectedQuestion.interviewCompany} · {selectedQuestion.interviewDate}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedQuestion(null)} className="flex-1 border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A]">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
    <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
    <div className="text-xs text-[#71717A]">{label}</div>
  </div>
);

const FeaturePreview = ({ icon: Icon, title, desc }) => (
  <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
    <div className="w-10 h-10 rounded-lg bg-[#27272A] flex items-center justify-center mb-3">
      <Icon size={20} className="text-[#00D9FF]" />
    </div>
    <h3 className="text-sm font-medium text-[#FAFAFA] mb-1">{title}</h3>
    <p className="text-xs text-[#71717A]">{desc}</p>
  </div>
);

export default KnowledgeBase;