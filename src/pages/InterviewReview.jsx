import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, FileText, MessageSquare, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { listReviews, analyzeInterview, transcribeAudio, saveReview } from '@/lib/api';
import api from '@/lib/api';

const InterviewReview = () => {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState('list');
  const [uploadType, setUploadType] = useState(null);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [round, setRound] = useState('');
  const [content, setContent] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioLanguage] = useState('zh');
  const [speakerDiarization] = useState('none');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => listReviews().then((res) => res.data),
    enabled: isLoggedIn,
  });
  const reviews = isLoggedIn ? (data?.list || []) : [];

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
        setView('report');
      } catch (err) {
        setError(err.message || '分析失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    } else {
      if (!company.trim() || !position.trim() || !content.trim()) { setError('请填写完整信息'); return; }
      setLoading(true);
      setError('');
      try {
        const res = await analyzeInterview({ company, position, round: round || '技术面试', content });
        setResult(res.data);
        setView('report');
      } catch (err) {
        setError(err.message || '分析失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!result?.questions?.length) { setError('没有问题可保存'); return; }
    setSaving(true);
    try {
      await saveReview({
        company, position, round: round || '技术面试',
        summary: result?.summary,
        questions: result.questions.map(q => ({
          question: q.question, answer: q.answer, category: q.category,
          level: q.level, analysis: q.analysis, improvement: q.improvement,
        })),
        transcribed_text: transcribedText || content,
      });
      setSaved(true);
    } catch (err) {
      setError('保存失败');
    } finally {
      setSaving(false);
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
    setViewingHistoryId(null); setView('list');
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
                        <button
                          key={r.id}
                          onClick={() => handleViewHistory(r.id)}
                          className="w-full py-4 border-t border-[#3F3F46] text-left hover:border-[#3F3F46] transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[#FAFAFA] group-hover:text-[#A1A1AA] transition-colors">{r.company} · {r.position}</p>
                              <p className="text-xs text-[#52525B] mt-1">{r.date ? new Date(r.date).toLocaleDateString() : ''}</p>
                            </div>
                            <span className="text-xs text-[#52525B]">→</span>
                          </div>
                        </button>
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
              <p className="text-xs text-[#52525B] tracking-wider mb-6">问题详情</p>
              {result?.questions?.length > 0 ? (
                <div className="space-y-6">
                  {result.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedQuestion(q)}
                      className="w-full text-left py-4 border-t border-[#3F3F46] hover:border-[#3F3F46] transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[#FAFAFA] group-hover:text-[#A1A1AA] transition-colors">{q.question}</p>
                        <span className={`text-xs ${q.level === 'good' ? 'text-[#10B981]' : q.level === 'bad' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                          {q.level === 'good' ? '良好' : q.level === 'bad' ? '待改进' : '一般'}
                        </span>
                      </div>
                      {q.answer && <p className="text-sm text-[#52525B] line-clamp-1">{q.answer}</p>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#52525B]">暂无问题</p>
              )}
            </div>

            {/* 保存 */}
            {!viewingHistoryId && (
              <div className="py-8 border-t border-[#3F3F46]">
                {saved ? (
                  <p className="text-sm text-[#10B981]">已保存到知识库</p>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving || !result?.questions?.length}
                    className="h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium transition-all duration-300"
                  >
                    {saving ? '保存中...' : '保存到知识库'}
                  </Button>
                )}
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedQuestion(null)}>
            <div className="w-full max-w-xl bg-[#0A0A0B] border border-[#3F3F46] p-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-[#52525B] tracking-wider">问题详情</p>
                <button onClick={() => setSelectedQuestion(null)} className="text-[#52525B] hover:text-[#FAFAFA]">
                  <X size={18} />
                </button>
              </div>

              <p className="text-[#FAFAFA] mb-4">{selectedQuestion.question}</p>

              <div className="flex gap-3 mb-6">
                <span className={`text-xs px-3 py-1 rounded ${selectedQuestion.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' : selectedQuestion.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                  {selectedQuestion.level === 'good' ? '良好' : selectedQuestion.level === 'bad' ? '待改进' : '一般'}
                </span>
                <span className="text-xs text-[#52525B]">{selectedQuestion.category || '其他'}</span>
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

              <Button onClick={() => setSelectedQuestion(null)} className="w-full h-12 bg-white text-black hover:bg-[#E5E5E5] border-0 text-sm font-medium transition-all duration-300">
                关闭
              </Button>
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
