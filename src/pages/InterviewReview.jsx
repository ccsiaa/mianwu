import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, FileText, MessageSquare, X, Upload, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { listReviews, analyzeInterview, transcribeAudio, saveReview, saveReviewRecord, matchQuestionExperiences, deleteReview, updateReview, getExperiences } from '@/lib/api';
import api from '@/lib/api';

const CATEGORY_MAP = {
  project: { label: '项目面', color: 'text-[#60A5FA]', bg: 'bg-[#60A5FA]/10' },
  basics: { label: '基础知识', color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/10' },
  algorithm: { label: '算法', color: 'text-[#FB923C]', bg: 'bg-[#FB923C]/10' },
  behavior: { label: '行为面', color: 'text-[#34D399]', bg: 'bg-[#34D399]/10' },
  system: { label: '系统设计', color: 'text-[#22D3EE]', bg: 'bg-[#22D3EE]/10' },
};

const CATEGORY_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'project', label: '项目面' },
  { key: 'basics', label: '基础知识' },
  { key: 'algorithm', label: '算法' },
  { key: 'behavior', label: '行为面' },
  { key: 'system', label: '系统设计' },
];

const InterviewReview = () => {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [uploadType, setUploadType] = useState(null);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [round, setRound] = useState('');
  const [content, setContent] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedReviewId, setSavedReviewId] = useState(null);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioLanguage] = useState('zh');
  const [speakerDiarization] = useState('none');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showOriginalInModal, setShowOriginalInModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [questionExperiences, setQuestionExperiences] = useState({});

  const handleChangeCategory = (newCategory) => {
    setResult(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q === selectedQuestion ? { ...q, category: newCategory } : q
      ),
    }));
    setSelectedQuestion(prev => ({ ...prev, category: newCategory }));
    setShowCategoryPicker(false);
  };
  const [editingReview, setEditingReview] = useState(null);
  const [editCompany, setEditCompany] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRound, setEditRound] = useState('');
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => listReviews().then((res) => res.data),
    enabled: isLoggedIn,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const reviews = isLoggedIn ? (data?.list || []) : [];

  const { data: experiencesData } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => getExperiences().then((res) => res.data),
    enabled: isLoggedIn,
    staleTime: 60000,
  });
  const experiences = experiencesData?.list || [];

  const handleDeleteReview = async (id, e) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条复盘记录吗？')) return;
    try {
      await deleteReview(id);
      queryClient.invalidateQueries(['reviews']);
    } catch (err) {
      setError('删除失败');
    }
  };

  const handleStartEdit = (r, e) => {
    e.stopPropagation();
    setEditingReview(r.id);
    setEditCompany(r.company || '');
    setEditPosition(r.position || '');
    setEditRound(r.round || '');
  };

  const handleSaveEdit = async () => {
    if (!editCompany.trim() || !editPosition.trim()) return;
    try {
      await updateReview(editingReview, { company: editCompany, position: editPosition, round: editRound });
      setEditingReview(null);
      queryClient.invalidateQueries(['reviews']);
    } catch (err) {
      setError('修改失败');
    }
  };

  const handleUploadClick = (type) => {
    setUploadType(type);
    setView('upload');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setContent(`[录音文件: ${file.name}]`);
    }
  };

  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea || uploadType !== 'audio') return;

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files?.length > 0 && /\.(m4a|mp3|wav|aac|ogg)$/i.test(files[0].name)) {
        setSelectedFile(files[0]);
        setContent(`[录音文件: ${files[0].name}]`);
      }
    };

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [uploadType]);

  // 分析完成后默认全选
  useEffect(() => {
    if (result?.questions?.length) {
      setSelectedQuestions(new Set(result.questions.map((_, i) => i)));
      setCategoryFilter('all');
    }
  }, [result]);

  const toggleQuestion = (idx) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filteredQuestions;
    const allSelected = filtered.every(([idx]) => selectedQuestions.has(idx));
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach(([idx]) => next.delete(idx));
      } else {
        filtered.forEach(([idx]) => next.add(idx));
      }
      return next;
    });
  };

  // 带原始索引的筛选后题目列表
  const filteredQuestions = useMemo(() => {
    if (!result?.questions) return [];
    return result.questions
      .map((q, idx) => [idx, q])
      .filter(([, q]) => categoryFilter === 'all' || q.category === categoryFilter);
  }, [result, categoryFilter]);

  const handleAnalyze = async () => {
    if (uploadType === 'audio' && selectedFile) {
      if (!company.trim() || !position.trim()) { setError('请填写公司和岗位'); return; }
      setLoading(true);
      setError('');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('language', audioLanguage);
        formData.append('speaker_diarization', speakerDiarization);
        const transcribeRes = await transcribeAudio(formData);
        const transcribeData = transcribeRes.data;
        const transcribedContent = transcribeData?.text || '';
        if (!transcribedContent.trim()) {
          setError('语音识别结果为空，请检查录音文件或重新上传');
          setLoading(false);
          return;
        }
        setTranscribedText(transcribedContent);
        setSpeakers(transcribeData?.speakers || []);
        const analyzeRes = await analyzeInterview({
          company, position, round: round || '技术面试',
          content: transcribedContent,
          speakers: transcribeData?.speakers || [],
        });
        setResult(analyzeRes.data);
        setSelectedQuestions(new Set(analyzeRes.data.questions?.map((_, i) => i) || []));
        setView('report');
        setLoading(false);
        // 后台保存和匹配（不阻塞UI）
        autoSave(analyzeRes.data, transcribedContent);
        autoMatchExperiences(analyzeRes.data.questions);
        return;
      } catch (err) {
        setError(err.message || '分析失败，请稍后重试');
      }
    } else {
      if (!company.trim() || !position.trim() || !content.trim()) { setError('请填写完整信息'); return; }
      setLoading(true);
      setError('');
      try {
        const res = await analyzeInterview({ company, position, round: round || '技术面试', content });
        setResult(res.data);
        setSelectedQuestions(new Set(res.data.questions?.map((_, i) => i) || []));
        setView('report');
        setLoading(false);
        // 后台保存和匹配（不阻塞UI）
        autoSave(res.data, content);
        autoMatchExperiences(res.data.questions);
        return;
      } catch (err) {
        setError(err.message || '分析失败，请稍后重试');
      }
    }
    setLoading(false);
  };

  const autoSave = async (analyzeResult, originalText) => {
    try {
      const res = await saveReviewRecord({
        company, position, round: round || '技术面试',
        summary: analyzeResult?.summary,
        transcribed_text: originalText,
      });
      const reviewId = res?.data?.reviewId;
      setSavedReviewId(reviewId);
      setSaved(true);
      queryClient.refetchQueries({ queryKey: ['reviews'] });
    } catch (err) {
      console.error('自动保存失败:', err);
    }
  };

  const autoMatchExperiences = async (questions) => {
    if (!questions?.length) return;
    try {
      const res = await matchQuestionExperiences({ questions });
      const matches = res?.data?.matches || {};
      const mapping = {};
      questions.forEach((q, idx) => {
        const expId = matches[String(idx)];
        if (expId) mapping[q.question] = expId;
      });
      setQuestionExperiences(mapping);
    } catch (err) {
      console.error('自动匹配经历失败:', err);
    }
  };

  const handleSaveQuestions = async () => {
    if (!result?.questions) return;
    const questionsToSave = result.questions
      .filter((_, idx) => selectedQuestions.has(idx))
      .map(q => ({
        question: q.question, answer: q.answer, category: q.category,
        level: q.level, analysis: q.analysis, improvement: q.improvement,
        source_text: q.source_text,
        experience_id: questionExperiences[q.question] || null,
      }));
    if (!questionsToSave.length) { setError('请至少选择一道题目'); return; }
    setSavingQuestions(true);
    try {
      await saveReview({
        review_id: savedReviewId,
        company, position, round: round || '技术面试',
        summary: result?.summary,
        questions: questionsToSave,
        transcribed_text: transcribedText || content,
      });
      queryClient.refetchQueries({ queryKey: ['reviews'] });
      queryClient.refetchQueries({ queryKey: ['experiences'] });
      setError('');
      alert('已沉淀到知识库');
    } catch (err) {
      setError('沉淀失败');
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleViewHistory = async (reviewId) => {
    setLoading(true);
    try {
      const res = await api.get(`/review/${reviewId}`);
      const data = res.data;
      setCompany(data.company || '');
      setPosition(data.position || '');
      setRound(data.round || '');
      setTranscribedText(data.transcribed_text || '');
      setViewingHistoryId(reviewId);
      setSaved(true);
      const questions = (data.questions || []).map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        answer: q.answer,
        category: q.category,
        level: q.performance === 'good' ? 'good' : q.performance === 'poor' ? 'bad' : 'average',
        score: q.performance === 'good' ? 4 : q.performance === 'poor' ? 2 : 3,
        analysis: q.feedback,
        improvement: q.improvement,
        source_text: q.source_text,
      }));
      setResult({ summary: data.summary || '历史复盘记录', total_questions: questions.length, questions, strengths: [], weaknesses: [], recommendations: [] });
      setView('report');
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setUploadType(null);
    setCompany(''); setPosition(''); setRound(''); setContent('');
    setTranscribedText(''); setSpeakers([]); setError(''); setResult(null);
    setSelectedFile(null); setShowTranscript(false); setSaved(false);
    setSavedReviewId(null); setViewingHistoryId(null);
    setSelectedQuestions(new Set()); setCategoryFilter('all');
    setQuestionExperiences({});
    setView('list');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pt-16 relative z-10">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 页面标题 */}
        <div className="mb-16">
          <p className="text-xs text-[#52525B] tracking-[0.2em] mb-4">REVIEW</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            面试复盘
          </h1>
          <p className="text-[#71717A]">记录面试经历，AI帮你分析提升</p>
        </div>

        <input type="file" ref={fileInputRef} accept=".m4a,.mp3,.wav,.aac,.ogg" onChange={handleFileChange} className="hidden" />

        {view === 'list' && (
          <div className="space-y-12">
            {/* 上传入口 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UploadCard icon={Mic} title="上传录音" desc="支持 m4a/mp3/wav" onClick={() => handleUploadClick('audio')} />
              <UploadCard icon={FileText} title="文字稿" desc="粘贴面试记录" onClick={() => handleUploadClick('text')} />
              <UploadCard icon={MessageSquare} title="口述描述" desc="描述面试过程" onClick={() => handleUploadClick('describe')} />
            </div>

            {/* 未登录提示 */}
            {!isLoggedIn ? (
              <div className="py-16 border-t border-[#3F3F46] text-center">
                <p className="text-sm text-[#52525B] mb-6">登录后查看复盘记录</p>
                <div className="flex items-center justify-center gap-4">
                  <Link to="/login">
                    <Button className="bg-white text-black hover:bg-[#E5E5E5] border-0 px-8">登录</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" className="border-[#3F3F46] text-[#71717A] hover:bg-transparent hover:text-[#A1A1AA]">注册</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="py-8 border-t border-[#3F3F46]">
                  <p className="text-xs text-[#52525B] tracking-wider mb-6">最近复盘</p>
                  {isLoading && <p className="text-sm text-[#52525B]">加载中...</p>}
                  {reviews.length === 0 ? (
                    <p className="text-sm text-[#52525B]">暂无复盘记录</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-t border-[#3F3F46]">
                          {editingReview === r.id ? (
                            <div className="py-4 space-y-3" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-3">
                                <Input
                                  value={editCompany}
                                  onChange={(e) => setEditCompany(e.target.value)}
                                  placeholder="公司"
                                  className="h-10 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none text-sm"
                                />
                                <Input
                                  value={editPosition}
                                  onChange={(e) => setEditPosition(e.target.value)}
                                  placeholder="岗位"
                                  className="h-10 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none text-sm"
                                />
                                <Input
                                  value={editRound}
                                  onChange={(e) => setEditRound(e.target.value)}
                                  placeholder="轮次"
                                  className="h-10 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={handleSaveEdit} className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors">保存</button>
                                <button onClick={() => setEditingReview(null)} className="text-xs text-[#52525B] hover:text-[#71717A] transition-colors">取消</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleViewHistory(r.id)}
                              className="w-full py-4 text-left transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[#FAFAFA] group-hover:text-[#A1A1AA] transition-colors">{r.company} · {r.position}{r.round ? ` · ${r.round}` : ''}</p>
                                  <p className="text-xs text-[#52525B] mt-1">{r.date ? new Date(r.date).toLocaleDateString() : ''}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={(e) => handleStartEdit(r, e)} className="text-xs text-[#52525B] hover:text-[#FAFAFA] transition-colors">编辑</button>
                                  <button onClick={(e) => handleDeleteReview(r.id, e)} className="text-xs text-[#52525B] hover:text-[#EF4444] transition-colors">删除</button>
                                </div>
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {view === 'upload' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#FAFAFA]">
                {uploadType === 'audio' ? '上传录音' : uploadType === 'text' ? '文字稿复盘' : '口述描述复盘'}
              </p>
              <button onClick={resetUpload} className="text-[#52525B] hover:text-[#FAFAFA] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* 基本信息 */}
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs text-[#52525B] tracking-wider mb-3">公司</label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="腾讯"
                    className="h-12 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#52525B] tracking-wider mb-3">岗位</label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="后端开发"
                    className="h-12 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#52525B] tracking-wider mb-3">轮次</label>
                  <Input
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    placeholder="技术面试"
                    className="h-12 bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none"
                  />
                </div>
              </div>

              {/* 内容输入 */}
              {uploadType === 'audio' ? (
                <div
                  ref={dropRef}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-12 text-center cursor-pointer transition-all min-h-[200px] flex flex-col items-center justify-center ${
                    isDragging ? 'border-[#FAFAFA]' : selectedFile ? 'border-[#10B981]' : 'border-[#3F3F46] hover:border-[#52525B]'
                  }`}
                >
                  {selectedFile ? (
                    <>
                      <p className="text-[#FAFAFA]">{selectedFile.name}</p>
                      <p className="text-xs text-[#52525B] mt-2">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-[#52525B] mb-4" />
                      <p className="text-sm text-[#52525B]">拖拽上传或点击选择</p>
                    </>
                  )}
                </div>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={uploadType === 'text' ? '请粘贴面试文字记录...' : '请描述面试过程...'}
                  className="min-h-[200px] bg-transparent border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:border-[#52525B] rounded-none resize-none"
                />
              )}
            </div>

            {error && <p className="text-sm text-[#EF4444]">{error}</p>}

            <Button
              onClick={handleAnalyze}
              disabled={loading || !content.trim()}
              className="w-full h-14 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium tracking-wide transition-all duration-300"
            >
              {loading ? '分析中...' : '开始分析'}
            </Button>
          </div>
        )}

        {view === 'report' && !showTranscript && (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <button onClick={resetUpload} className="text-sm text-[#52525B] hover:text-[#FAFAFA] transition-colors">← 返回</button>
              {transcribedText && (
                <button onClick={() => setShowTranscript(true)} className="text-sm text-[#52525B] hover:text-[#FAFAFA] transition-colors">
                  查看原文
                </button>
              )}
            </div>

            {/* 概述 */}
            <div className="py-8 border-t border-[#3F3F46]">
              <p className="text-xs text-[#52525B] tracking-wider mb-4">复盘报告</p>
              <p className="text-sm text-[#71717A] mb-4">{company} · {position} · {round || '技术面试'}</p>
              {result?.summary && <p className="text-[#A1A1AA] leading-relaxed">{result.summary}</p>}
            </div>

            {/* 问题列表 */}
            <div className="py-8 border-t border-[#3F3F46]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-[#52525B] tracking-wider">问题详情</p>
                {result?.questions?.length > 0 && (
                  <button onClick={toggleSelectAll} className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                    {filteredQuestions.every(([idx]) => selectedQuestions.has(idx)) ? '取消全选' : '全选'}
                  </button>
                )}
              </div>

              {/* 类别筛选 */}
              {result?.questions?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {CATEGORY_FILTERS.map(f => {
                    const count = f.key === 'all'
                      ? result.questions.length
                      : result.questions.filter(q => q.category === f.key).length;
                    if (count === 0 && f.key !== 'all') return null;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setCategoryFilter(f.key)}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${
                          categoryFilter === f.key
                            ? 'bg-[#FAFAFA] text-black'
                            : 'border border-[#3F3F46] text-[#71717A] hover:text-[#FAFAFA] hover:border-[#52525B]'
                        }`}
                      >
                        {f.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredQuestions.length > 0 ? (
                <div className="space-y-1">
                  {filteredQuestions.map(([idx, q]) => {
                    const cat = CATEGORY_MAP[q.category];
                    const isSelected = selectedQuestions.has(idx);
                    const linkedExp = experiences.find(e => e.id === questionExperiences[q.question]);
                    return (
                      <div key={idx} className="py-4 border-t border-[#3F3F46]">
                        <div className="flex items-start gap-3">
                          {/* 复选框 */}
                          <button
                            onClick={() => toggleQuestion(idx)}
                            className={`mt-0.5 w-5 h-5 flex-shrink-0 border rounded flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#FAFAFA] border-[#FAFAFA]' : 'border-[#52525B] hover:border-[#71717A]'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-black" />}
                          </button>
                          {/* 题目内容 */}
                          <button
                            onClick={() => setSelectedQuestion(q)}
                            className="flex-1 text-left group"
                          >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="text-[#FAFAFA] group-hover:text-[#A1A1AA] transition-colors">{q.question}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              {cat && (
                                <span className={`text-xs px-2 py-0.5 rounded ${cat.bg} ${cat.color}`}>
                                  {cat.label}
                                </span>
                              )}
                              <span className={`text-xs ${q.level === 'good' ? 'text-[#10B981]' : q.level === 'bad' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                                {q.level === 'good' ? '良好' : q.level === 'bad' ? '待改进' : '一般'}
                              </span>
                            </div>
                            {q.answer && <p className="text-sm text-[#52525B] line-clamp-1">{q.answer}</p>}
                          </button>
                        </div>
                        {/* 关联经历 */}
                        <div className="ml-8 mt-2">
                          <select
                            value={questionExperiences[q.question] || ''}
                            onChange={(e) => setQuestionExperiences(prev => ({ ...prev, [q.question]: e.target.value || null }))}
                            className="text-xs bg-transparent border border-[#3F3F46] rounded px-2 py-1 text-[#A1A1AA] focus:border-[#52525B] outline-none min-w-[160px]"
                          >
                            <option value="">关联经历...</option>
                            {experiences.map(exp => (
                              <option key={exp.id} value={exp.id}>
                                {exp.company} · {exp.role}
                              </option>
                            ))}
                          </select>
                          {linkedExp && (
                            <span className="text-xs text-[#52525B] ml-2">已关联: {linkedExp.company} · {linkedExp.role}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#52525B]">
                  {result?.questions?.length > 0 ? '该类别下暂无题目' : '暂无问题'}
                </p>
              )}
            </div>

            {/* 操作区 */}
            {result?.questions?.length > 0 && (
              <div className="py-8 border-t border-[#3F3F46] space-y-4">
                {saved && (
                  <p className="text-sm text-[#10B981]">已保存到最近复盘</p>
                )}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSaveQuestions}
                    disabled={savingQuestions || selectedQuestions.size === 0}
                    className="h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium transition-all duration-300"
                  >
                    {savingQuestions ? '沉淀中...' : `沉淀到知识库 (${selectedQuestions.size}/${result.questions.length})`}
                  </Button>
                  <Button
                    onClick={() => { setView('list'); resetUpload(); }}
                    variant="outline"
                    className="h-12 border-[#3F3F46] text-[#71717A] hover:text-[#FAFAFA] hover:bg-transparent text-sm"
                  >
                    返回列表
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 原文视图 */}
        {view === 'report' && showTranscript && (
          <div className="space-y-8">
            <button onClick={() => setShowTranscript(false)} className="text-sm text-[#52525B] hover:text-[#FAFAFA] transition-colors">
              ← 返回报告
            </button>
            <div className="py-8 border-t border-[#3F3F46]">
              <p className="text-xs text-[#52525B] tracking-wider mb-6">语音识别原文</p>
              <div className="max-h-[60vh] overflow-y-auto">
                {speakers?.length > 0 ? (
                  <div className="space-y-4">
                    {speakers.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className={`text-xs px-2 py-1 rounded ${item.speaker === '0' ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#18181B] text-[#52525B]'}`}>
                          {item.speaker === '0' ? '面试官' : '候选人'}
                        </span>
                        <p className="text-sm text-[#A1A1AA] flex-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap">{transcribedText || content}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 问题详情弹窗 */}
        {selectedQuestion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => { setSelectedQuestion(null); setShowOriginalInModal(false); }}>
            <div className="w-full max-w-xl max-h-[85vh] bg-[#0A0A0B] border border-[#3F3F46] p-8 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-[#52525B] tracking-wider">{showOriginalInModal ? '面试原文' : '问题详情'}</p>
                <button onClick={() => { setSelectedQuestion(null); setShowOriginalInModal(false); }} className="text-[#52525B] hover:text-[#FAFAFA]">
                  <X size={18} />
                </button>
              </div>

              {showOriginalInModal ? (
                <div className="flex-1 overflow-y-auto min-h-0">
                  <p className="text-xs text-[#52525B] mb-4">该问题的原始回答：</p>
                  <div className="text-sm text-[#A1A1AA] whitespace-pre-wrap leading-relaxed">
                    {selectedQuestion.source_text || '暂无原文'}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  <p className="text-[#FAFAFA] mb-4">{selectedQuestion.question}</p>

                  <div className="flex gap-3 mb-6 items-center">
                    <span className={`text-xs px-3 py-1 rounded ${selectedQuestion.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' : selectedQuestion.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                      {selectedQuestion.level === 'good' ? '良好' : selectedQuestion.level === 'bad' ? '待改进' : '一般'}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                        className={`text-xs px-3 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${CATEGORY_MAP[selectedQuestion.category]?.bg || 'bg-[#3F3F46]/30'} ${CATEGORY_MAP[selectedQuestion.category]?.color || 'text-[#71717A]'}`}
                      >
                        {CATEGORY_MAP[selectedQuestion.category]?.label || selectedQuestion.category || '未分类'} ▾
                      </button>
                      {showCategoryPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-[#18181B] border border-[#3F3F46] rounded py-1 z-10 min-w-[100px]">
                          {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => handleChangeCategory(key)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#27272A] transition-colors ${val.color} ${selectedQuestion.category === key ? 'bg-[#27272A]' : ''}`}
                            >
                              {val.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedQuestion.answer && (
                    <div className="mb-6">
                      <p className="text-xs text-[#52525B] mb-2">你的回答</p>
                      <p className="text-sm text-[#A1A1AA]">{selectedQuestion.answer}</p>
                    </div>
                  )}

                  {selectedQuestion.analysis && (
                    <div className="mb-6">
                      <p className="text-xs text-[#52525B] mb-2">分析</p>
                      <p className="text-sm text-[#A1A1AA]">{selectedQuestion.analysis}</p>
                    </div>
                  )}

                  {selectedQuestion.improvement && (
                    <div className="p-4 border border-[#3F3F46] mb-6">
                      <p className="text-xs text-[#FAFAFA] mb-2">改进建议</p>
                      <p className="text-sm text-[#A1A1AA]">{selectedQuestion.improvement}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-[#3F3F46]">
                {showOriginalInModal ? (
                  <Button onClick={() => setShowOriginalInModal(false)} variant="outline" className="flex-1 h-12 border-[#3F3F46] text-[#71717A] hover:text-[#FAFAFA] hover:bg-transparent text-sm font-medium transition-all duration-300">
                    返回问题详情
                  </Button>
                ) : (
                  <Button onClick={() => setShowOriginalInModal(true)} variant="outline" className="flex-1 h-12 border-[#3F3F46] text-[#71717A] hover:text-[#FAFAFA] hover:bg-transparent text-sm font-medium transition-all duration-300">
                    查看原文
                  </Button>
                )}
                <Button onClick={() => { setSelectedQuestion(null); setShowOriginalInModal(false); }} className="flex-1 h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium transition-all duration-300">
                  关闭
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadCard = ({ icon: Icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className="p-8 border border-[#3F3F46] text-left hover:border-[#3F3F46] transition-colors group"
  >
    <Icon size={20} className="text-[#52525B] mb-4 group-hover:text-[#71717A] transition-colors" />
    <p className="text-[#FAFAFA] mb-1">{title}</p>
    <p className="text-xs text-[#52525B]">{desc}</p>
  </button>
);

export default InterviewReview;
