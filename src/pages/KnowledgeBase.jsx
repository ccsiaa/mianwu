import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, X, Save, Upload, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getExperiences, createExperience, updateExperience, deleteExperience, parseResume } from '@/lib/api';

const MonthPicker = ({ value, onChange, placeholder, minDate }) => {
  const [open, setOpen] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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

  const isMonthDisabled = (year, month) => {
    if (!minDate) return false;
    const [minYear, minMonth] = minDate.split('-').map(Number);
    if (year < minYear) return true;
    if (year === minYear && month < minMonth) return true;
    return false;
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minYear = minDate ? parseInt(minDate.split('-')[0]) : 2010;
  const maxYear = new Date().getFullYear() + 5;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-12 w-full px-4 bg-transparent border border-[#27272A] text-left flex items-center justify-between hover:border-[#3F3F46] transition-colors"
      >
        <span className={value ? 'text-[#FAFAFA]' : 'text-[#52525B]'}>
          {value ? `${value.split('-')[0]}年${parseInt(value.split('-')[1])}月` : placeholder || '选择时间'}
        </span>
        {value && <X size={14} className="text-[#52525B] hover:text-[#FAFAFA]" onClick={handleClear} />}
      </button>

      {open && (
        <div className="absolute top-14 left-0 z-50 bg-[#18181B] border border-[#27272A] p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setTempYear(Math.max(minYear, tempYear - 1))} className="p-1 hover:bg-[#27272A] disabled:opacity-50" disabled={tempYear <= minYear}>
              <ChevronLeft size={16} className="text-[#52525B]" />
            </button>
            <span className="text-[#FAFAFA]">{tempYear}年</span>
            <button type="button" onClick={() => setTempYear(Math.min(maxYear, tempYear + 1))} className="p-1 hover:bg-[#27272A] disabled:opacity-50" disabled={tempYear >= maxYear}>
              <ChevronRightIcon size={16} className="text-[#52525B]" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {months.map((m) => {
              const disabled = isMonthDisabled(tempYear, m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => !disabled && setTempMonth(m)}
                  disabled={disabled}
                  className={`py-2 text-sm transition-colors ${
                    disabled ? 'text-[#27272A] cursor-not-allowed' :
                    tempMonth === m ? 'bg-white text-black' : 'text-[#71717A] hover:text-[#FAFAFA]'
                  }`}
                >
                  {m}月
                </button>
              );
            })}
          </div>

          <Button type="button" onClick={handleConfirm} className="w-full h-10 bg-white text-black hover:bg-[#E5E5E5] border-0">
            确定
          </Button>
        </div>
      )}
    </div>
  );
};

const typeTabs = [
  { key: 'all', label: '全部' },
  { key: 'basic', label: '基本信息' },
  { key: 'internship', label: '实习' },
  { key: 'project', label: '项目' },
  { key: 'education', label: '教育' },
  { key: 'competition', label: '竞赛' },
];

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
  const [editingExp, setEditingExp] = useState(null);
  const [selectedExp, setSelectedExp] = useState(null);
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
  const [parsedPreview, setParsedPreview] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
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

  const rawExperiences = isLoggedIn ? (data?.list || []) : [];
  const questions = selectedExp?.interviewQuestions || [];

  const typeOrder = ['basic', 'education', 'internship', 'project', 'competition', 'other'];
  const experiences = activeTab === 'all'
    ? [...rawExperiences].sort((a, b) => {
        const orderA = typeOrder.indexOf(a.type) >= 0 ? typeOrder.indexOf(a.type) : 999;
        const orderB = typeOrder.indexOf(b.type) >= 0 ? typeOrder.indexOf(b.type) : 999;
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.startDate || '0000-00';
        const dateB = b.startDate || '0000-00';
        return dateB.localeCompare(dateA);
      })
    : rawExperiences;

  const { data: allData } = useQuery({
    queryKey: ['experiences', 'all'],
    queryFn: () => getExperiences({}).then((res) => res.data),
    enabled: isLoggedIn,
  });

  const allExperiences = allData?.list || [];
  const totalQuestions = allExperiences.reduce((sum, exp) => sum + (exp.questionCount || 0), 0);
  const internshipCount = allExperiences.filter((e) => e.type === 'internship').length;
  const projectCount = allExperiences.filter((e) => e.type === 'project').length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-16 relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="mb-16">
            <p className="text-xs text-[#52525B] tracking-[0.2em] mb-4">KNOWLEDGE</p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              知识库
            </h1>
            <p className="text-[#71717A]">沉淀经历，关联问题，为简历输出提供素材</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-16">
            <StatCard label="关联题目" value={0} />
            <StatCard label="实习经历" value={0} />
            <StatCard label="项目经历" value={0} />
          </div>

          <div className="py-16 border-t border-[#27272A] text-center">
            <p className="text-sm text-[#52525B] mb-8">登录后解锁知识库</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/login">
                <Button className="h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 px-8">登录</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="h-12 border-[#27272A] text-[#71717A] hover:bg-transparent hover:text-[#A1A1AA]">注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({ type: 'project', company: '', role: '', startDate: '', endDate: '', description: '', skills: '' });
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
    if (formData.type === 'basic') {
      if (!formData.company.trim()) { setFormError('请填写姓名'); return; }
    } else if (formData.type === 'competition') {
      if (!formData.company.trim() || !formData.role.trim()) { setFormError('请填写竞赛名称和奖项等级'); return; }
    } else {
      if (!formData.company.trim() || !formData.description.trim()) { setFormError('请填写经历名称和详细描述'); return; }
    }
    setFormError('');

    const payload = { ...formData, skills: formData.skills.split(/[,，]/).map((s) => s.trim()).filter(Boolean) };
    if (editingExp) {
      updateMutation.mutate({ id: editingExp.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await parseResume(formData);
      setParsedPreview(res.data);
    } catch (err) {
      setFormError(err.message || '解析失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportParsed = async () => {
    if (!parsedPreview) return;
    try {
      if (parsedPreview.basic?.name) {
        await createExperience({ type: 'basic', company: parsedPreview.basic.name, role: parsedPreview.basic.phone || '', description: parsedPreview.basic.email || '' });
      }
      if (parsedPreview.education?.school) {
        await createExperience({ type: 'education', company: parsedPreview.education.school, role: `${parsedPreview.education.major || ''}/${parsedPreview.education.degree || ''}`, startDate: parsedPreview.education.startDate || '', endDate: parsedPreview.education.endDate || '', description: '' });
      }
      for (const exp of parsedPreview.internships || []) {
        await createExperience({ type: 'internship', company: exp.company, role: exp.role, startDate: exp.startDate, endDate: exp.endDate, description: Array.isArray(exp.description) ? exp.description.join('\n') : exp.description, skills: exp.skills || [] });
      }
      for (const proj of parsedPreview.projects || []) {
        await createExperience({ type: 'project', company: proj.name, role: proj.role, startDate: proj.startDate || '', endDate: proj.endDate || '', description: Array.isArray(proj.description) ? proj.description.join('\n') : proj.description, skills: proj.skills || [] });
      }
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setParsedPreview(null);
    } catch (err) {
      setFormError('导入失败：' + (err.message || '请稍后重试'));
    }
  };

  return (
    <div className="min-h-screen pt-16 relative z-10">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-16">
          <p className="text-xs text-[#52525B] tracking-[0.2em] mb-4">KNOWLEDGE</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            知识库
          </h1>
          <p className="text-[#71717A]">沉淀经历，关联问题，为简历输出提供素材</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-16">
          <StatCard label="关联题目" value={totalQuestions} />
          <StatCard label="实习经历" value={internshipCount} />
          <StatCard label="项目经历" value={projectCount} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          {typeTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === key ? 'text-[#FAFAFA] border-b border-[#FAFAFA]' : 'text-[#52525B] hover:text-[#71717A]'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex gap-3">
            <input type="file" ref={fileInputRef} accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-10 border-[#27272A] text-[#52525B] hover:bg-transparent hover:text-[#71717A]">
              <Upload size={14} className="mr-2" /> {uploading ? '解析中...' : '上传简历'}
            </Button>
            <Button onClick={() => { resetForm(); setFormData(prev => ({ ...prev, type: activeTab === 'all' ? 'internship' : activeTab })); setShowForm(true); }} className="h-10 bg-white text-black hover:bg-[#E5E5E5] border-0">
              <Plus size={14} className="mr-2" /> 添加经历
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-[#52525B] mb-8">加载中...</p>}

        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="py-16 border-t border-[#27272A] text-center">
              <p className="text-sm text-[#52525B]">暂无经历记录</p>
            </div>
          ) : (
            experiences.map((exp) => {
              const isBasic = exp.type === 'basic';
              const isCompetition = exp.type === 'competition';
              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExp(exp)}
                  className="w-full text-left py-6 border-t border-[#27272A] hover:border-[#3F3F46] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#FAFAFA] group-hover:text-[#A1A1AA] transition-colors">
                      {isBasic ? (exp.company || '未填写姓名') : (exp.company || exp.role || '未命名经历')}
                    </p>
                    <span className="text-xs text-[#52525B]">{typeLabelMap[exp.type] || '其他'}</span>
                  </div>
                  <p className="text-sm text-[#52525B]">
                    {isBasic ? `${exp.role || ''} · ${exp.description || ''}` :
                     isCompetition ? (exp.role || '') :
                     `${exp.role || ''} · ${exp.startDate || ''} — ${exp.endDate || '至今'}`}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="w-full max-w-lg bg-[#0A0A0B] border border-[#27272A] p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs text-[#52525B] tracking-wider">{editingExp ? '编辑经历' : '添加经历'}</p>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs text-[#52525B] tracking-wider mb-3">类型</label>
                <div className="flex flex-wrap gap-3">
                  {typeTabs.slice(1).map(({ key, label }) => (
                    <button key={key} onClick={() => setFormData({ ...formData, type: key })} className={`px-3 py-1.5 text-sm transition-colors ${formData.type === key ? 'text-[#FAFAFA] border-b border-[#FAFAFA]' : 'text-[#52525B] hover:text-[#71717A]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.type === 'basic' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">姓名 *</label>
                    <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="姓名" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">电话</label>
                    <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="电话" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">邮箱</label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="邮箱" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                </div>
              ) : formData.type === 'competition' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">竞赛名称 *</label>
                    <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="竞赛名称" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">奖项等级 *</label>
                    <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="奖项等级" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#52525B] tracking-wider mb-3">{formData.type === 'education' ? '学校名称' : formData.type === 'project' ? '项目名称' : '公司/名称'}</label>
                      <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder={formData.type === 'education' ? '学校' : '名称'} className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#52525B] tracking-wider mb-3">{formData.type === 'education' ? '专业/学位' : '角色/职位'}</label>
                      <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder={formData.type === 'education' ? '专业' : '职位'} className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#52525B] tracking-wider mb-3">开始时间</label>
                      <MonthPicker value={formData.startDate} onChange={(v) => setFormData({ ...formData, startDate: v })} placeholder="开始时间" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#52525B] tracking-wider mb-3">结束时间</label>
                      <MonthPicker value={formData.endDate} onChange={(v) => setFormData({ ...formData, endDate: v })} placeholder="至今可留空" minDate={formData.startDate} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">详细描述 *</label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="描述你的主要职责、成果、使用的技术等" className="min-h-[120px] bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs text-[#52525B] tracking-wider mb-3">技能标签</label>
                    <Input value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="用逗号分隔，如：Java, MySQL" className="h-12 bg-transparent border-[#27272A] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none" />
                  </div>
                </>
              )}

              {formError && <p className="text-sm text-[#EF4444]">{formError}</p>}

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 h-12 border-[#27272A] text-[#71717A] hover:bg-transparent hover:text-[#A1A1AA]">取消</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-12 bg-white text-black hover:bg-[#E5E5E5] border-0">
                  <Save size={14} className="mr-2" /> {(createMutation.isPending || updateMutation.isPending) ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Preview Modal */}
      {parsedPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setParsedPreview(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0A0B] border border-[#27272A] p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs text-[#52525B] tracking-wider">简历解析结果</p>
              <button onClick={() => setParsedPreview(null)} className="text-[#52525B] hover:text-[#FAFAFA]"><X size={18} /></button>
            </div>

            <div className="space-y-6 mb-8">
              {parsedPreview.basic?.name && (
                <div className="py-4 border-t border-[#27272A]">
                  <p className="text-xs text-[#52525B] mb-2">基本信息</p>
                  <p className="text-[#FAFAFA]">{parsedPreview.basic.name}</p>
                  <p className="text-sm text-[#52525B]">{parsedPreview.basic.phone} · {parsedPreview.basic.email}</p>
                </div>
              )}
              {parsedPreview.education?.school && (
                <div className="py-4 border-t border-[#27272A]">
                  <p className="text-xs text-[#52525B] mb-2">教育背景</p>
                  <p className="text-[#FAFAFA]">{parsedPreview.education.school} · {parsedPreview.education.major} · {parsedPreview.education.degree}</p>
                </div>
              )}
              {parsedPreview.internships?.length > 0 && (
                <div className="py-4 border-t border-[#27272A]">
                  <p className="text-xs text-[#52525B] mb-2">实习经历 ({parsedPreview.internships.length})</p>
                  {parsedPreview.internships.map((exp, idx) => (
                    <p key={idx} className="text-sm text-[#71717A]">{exp.company} · {exp.role}</p>
                  ))}
                </div>
              )}
              {parsedPreview.projects?.length > 0 && (
                <div className="py-4 border-t border-[#27272A]">
                  <p className="text-xs text-[#52525B] mb-2">项目经历 ({parsedPreview.projects.length})</p>
                  {parsedPreview.projects.map((proj, idx) => (
                    <p key={idx} className="text-sm text-[#71717A]">{proj.name} · {proj.role}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setParsedPreview(null)} className="flex-1 h-12 border-[#27272A] text-[#71717A] hover:bg-transparent">取消</Button>
              <Button onClick={handleImportParsed} className="flex-1 h-12 bg-white text-black hover:bg-[#E5E5E5] border-0">导入到知识库</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedExp(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0A0B] border border-[#27272A] p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[#FAFAFA]">{selectedExp.company || selectedExp.role}</p>
                <p className="text-sm text-[#52525B]">{selectedExp.role} · {selectedExp.startDate || ''} — {selectedExp.endDate || '至今'}</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => openEditForm(selectedExp)} className="text-sm text-[#52525B] hover:text-[#FAFAFA]">编辑</button>
                <button onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate(selectedExp.id); }} className="text-sm text-[#EF4444] hover:text-[#FAFAFA]">删除</button>
                <button onClick={() => setSelectedExp(null)} className="text-[#52525B] hover:text-[#FAFAFA]"><X size={18} /></button>
              </div>
            </div>

            <div className="py-6 border-t border-[#27272A]">
              <p className="text-xs text-[#52525B] tracking-wider mb-4">详细描述</p>
              <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap">{selectedExp.description || '暂无描述'}</p>
            </div>

            {(selectedExp.skills || []).length > 0 && (
              <div className="py-6 border-t border-[#27272A]">
                <p className="text-xs text-[#52525B] tracking-wider mb-4">技能标签</p>
                <div className="flex flex-wrap gap-2">
                  {selectedExp.skills.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs text-[#71717A] border border-[#27272A]">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="py-6 border-t border-[#27272A]">
              <p className="text-xs text-[#52525B] tracking-wider mb-4">关联面试问题 {questions.length > 0 && `(${questions.length})`}</p>
              {questions.length === 0 ? (
                <p className="text-sm text-[#52525B]">暂无关联的面试问题</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="py-4 border-t border-[#27272A]">
                      <p className="text-sm text-[#FAFAFA]">{q.question}</p>
                      {q.answer && <p className="text-sm text-[#52525B] mt-2">{q.answer}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="py-6 border-t border-[#27272A]">
    <p className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: '"Noto Serif SC", serif' }}>{value}</p>
    <p className="text-xs text-[#52525B]">{label}</p>
  </div>
);

export default KnowledgeBase;
