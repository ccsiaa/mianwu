import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mic, FileText, MessageSquare, Plus, CheckCircle, XCircle, Save, X, Upload, Loader2, FileAudio, FileSearch, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { listReviews, analyzeInterview, transcribeAudio, saveReview } from '@/lib/api';
import api from '@/lib/api';

const InterviewReview = () => {
  const [view, setView] = useState('list'); // 'list' | 'upload' | 'report'
  const [uploadType, setUploadType] = useState(null); // 'audio' | 'text' | 'describe'
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [round, setRound] = useState('');
  const [content, setContent] = useState('');
  const [transcribedText, setTranscribedText] = useState(''); // 语音识别后的原文
  const [speakers, setSpeakers] = useState([]); // 说话人分段信息
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // 保存状态
  const [saved, setSaved] = useState(false); // 是否已保存
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState('zh');
  const [speakerDiarization, setSpeakerDiarization] = useState('none');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false); // 添加问题弹窗
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '', category: 'project' });
  const [showTranscript, setShowTranscript] = useState(false); // 查看原文
  const [viewingHistoryId, setViewingHistoryId] = useState(null); // 正在查看的历史记录ID
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const dropRef = useRef(null);

  const { data, isLoading, error: listError } = useQuery({ queryKey: ['reviews'], queryFn: () => listReviews().then((res) => res.data) });
  const reviews = data?.list || [];

  const handleUploadClick = (type) => {
    if (type === 'audio') {
      setUploadType(type);
      setView('upload');
    } else {
      setUploadType(type);
      setView('upload');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setContent(`[录音文件: ${file.name}]`);
    }
  };

  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // 过滤出音频文件
      const audioFiles = Array.from(files).filter(f =>
        /\.(m4a|mp3|wav|aac|ogg)$/i.test(f.name)
      );
      if (audioFiles.length > 0) {
        setSelectedFile(audioFiles[0]);
        setContent(`[录音文件: ${audioFiles[0].name}]`);
      }
    }
  };

  // 拖拽上传处理
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea || uploadType !== 'audio') return;

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (/\.(m4a|mp3|wav|aac|ogg)$/i.test(file.name)) {
          setSelectedFile(file);
          setContent(`[录音文件: ${file.name}]`);
        }
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
    // 音频文件需要先进行语音识别
    if (uploadType === 'audio' && selectedFile) {
      if (!company.trim() || !position.trim()) {
        setError('请填写公司和岗位');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // 语音识别
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('language', audioLanguage);
        formData.append('speaker_diarization', speakerDiarization);

        const transcribeRes = await transcribeAudio(formData);
        const transcribeData = transcribeRes.data;

        if (transcribeData.error) {
          setError('语音识别失败：' + transcribeData.error);
          setLoading(false);
          return;
        }

        // 保存语音识别原文和说话人信息
        setTranscribedText(transcribeData.text || '');
        setSpeakers(transcribeData.speakers || []);

        // 使用识别结果进行面试分析
        const analyzeRes = await analyzeInterview({
          company,
          position,
          round: round || '技术面试',
          content: transcribeData.text || content,
          speakers: transcribeData.speakers || [],
        });
        setResult(analyzeRes.data);
        setView('report');
      } catch (err) {
        setError(err.message || '分析失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    } else {
      // 文字稿或口述描述直接分析
      if (!company.trim() || !position.trim() || !content.trim()) {
        setError('请填写公司、岗位和面试内容');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await analyzeInterview({
          company,
          position,
          round: round || '技术面试',
          content,
        });
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
    if (!result?.questions?.length) {
      setError('没有问题可保存');
      return;
    }

    setSaving(true);
    try {
      await saveReview({
        company,
        position,
        round: round || '技术面试',
        summary: result?.summary,
        questions: result.questions.map(q => ({
          question: q.question,
          answer: q.answer,
          category: q.category,
          level: q.level,
          analysis: q.analysis,
          improvement: q.improvement,
        })),
        transcribed_text: transcribedText || content,
      });
      setSaved(true);
    } catch (err) {
      setError('保存失败：' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 查看历史记录详情
  const handleViewHistory = async (reviewId) => {
    setLoading(true);
    try {
      const res = await api.get(`/review/${reviewId}`);
      const data = res.data;

      // 设置公司、岗位等信息
      setCompany(data.company || '');
      setPosition(data.position || '');
      setRound(data.round || '');
      setViewingHistoryId(reviewId);
      setSaved(true); // 历史记录已保存

      // 转换问题格式
      const questions = (data.questions || []).map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        answer: q.answer,
        category: q.category,
        level: q.performance === 'good' ? 'good' : q.performance === 'poor' ? 'bad' : 'average',
        score: q.performance === 'good' ? 4 : q.performance === 'poor' ? 2 : 3,
        analysis: q.feedback,
      }));

      setResult({
        summary: data.summary || '历史复盘记录',
        total_questions: questions.length,
        questions,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      });

      setView('report');
    } catch (err) {
      setError('加载失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setUploadType(null);
    setCompany('');
    setPosition('');
    setRound('');
    setContent('');
    setTranscribedText('');
    setSpeakers([]);
    setError('');
    setResult(null);
    setSelectedFile(null);
    setShowTranscript(false);
    setSaved(false);
    setViewingHistoryId(null);
    setView('list');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2">面试复盘</h1>
          <p className="text-[#A1A1AA]">记录面试经历，AI帮你分析提升</p>
        </div>
        {view === 'list' && (
          <Button className="aurora-gradient text-white border-0 hover:opacity-90" onClick={() => { setUploadType('text'); setView('upload'); }}>
            <Plus size={16} className="mr-1" /> 新增复盘
          </Button>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".m4a,.mp3,.wav,.aac,.ogg"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        webkitdirectory=""
        directory=""
        onChange={handleFolderChange}
        className="hidden"
      />

      {view === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <UploadCard icon={Mic} title="上传录音" desc="支持m4a/mp3/wav" onClick={() => handleUploadClick('audio')} />
            <UploadCard icon={FileText} title="文字稿" desc="粘贴面试文字记录" onClick={() => handleUploadClick('text')} />
            <UploadCard icon={MessageSquare} title="口述描述" desc="语音/文字描述面试" onClick={() => handleUploadClick('describe')} />
          </div>
          {isLoading && <p className="text-sm text-[#A1A1AA] mb-6">正在加载复盘记录...</p>}
          {listError && <p className="text-sm text-[#F87171] mb-6">加载失败：{listError.message}</p>}
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">最近复盘</h3>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="rounded-3xl bg-[#18181B] border border-[#27272A] p-10 text-center text-[#A1A1AA]">
                暂无复盘记录，点击上方卡片开始记录面试
              </div>
            ) : (
              reviews.map((r) => {
                const passed = r.result === 'passed';
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-between cursor-pointer hover:border-[#3F3F46] transition-colors"
                    onClick={() => handleViewHistory(r.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#FAFAFA] font-medium">{r.company} | {r.position} | {r.round}</span>
                        <span className="text-xs text-[#71717A]">{r.date ? new Date(r.date).toLocaleDateString() : '未知日期'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                        <span className="flex items-center gap-1">
                          {passed ? <CheckCircle size={12} className="text-[#10B981]" /> : <XCircle size={12} className="text-[#EF4444]" />}
                          {passed ? '通过' : r.result === 'failed' ? '未通过' : '待定'}
                        </span>
                        <span>{r.duration ?? 0}分钟</span>
                        <span>创建于 {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '未知'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#00D9FF]">查看</Button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {view === 'upload' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#FAFAFA]">
              {uploadType === 'audio' ? '上传录音' : uploadType === 'text' ? '文字稿复盘' : '口述描述复盘'}
            </h2>
            <button onClick={resetUpload} className="text-[#71717A] hover:text-[#FAFAFA]">
              <X size={20} />
            </button>
          </div>

          {/* 基本信息 */}
          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">面试信息</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">公司 *</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="如：腾讯"
                  className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">岗位 *</label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="如：后端开发"
                  className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">轮次</label>
                <Input
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder="如：技术面试"
                  className="h-10 bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>
            </div>
          </div>

          {/* 内容输入 */}
          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">
              {uploadType === 'audio' ? '录音文件' : uploadType === 'text' ? '面试文字记录' : '面试描述'}
            </h3>

            {uploadType === 'audio' ? (
              <div className="grid grid-cols-[7fr_3fr] gap-4">
                {/* 左侧：拖拽上传（大区域） */}
                <div
                  ref={dropRef}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px] ${
                    isDragging
                      ? 'border-[#00D9FF] bg-[#00D9FF]/10'
                      : selectedFile
                        ? 'border-[#10B981] bg-[#10B981]/5'
                        : 'border-[#27272A] hover:border-[#00D9FF]/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <>
                      <FileAudio size={48} className="text-[#10B981] mb-4" />
                      <p className="text-[#FAFAFA] font-medium text-lg mb-2">{selectedFile.name}</p>
                      <p className="text-sm text-[#71717A]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-xs text-[#10B981] mt-3">点击更换文件</p>
                    </>
                  ) : (
                    <>
                      <Upload size={48} className={`mb-4 ${isDragging ? 'text-[#00D9FF]' : 'text-[#71717A]'}`} />
                      <p className="text-[#FAFAFA] font-medium text-lg mb-2">拖拽上传</p>
                      <p className="text-sm text-[#71717A]">或将文件粘贴到此处</p>
                      <p className="text-xs text-[#52525B] mt-4">支持 m4a、mp3、wav、aac、ogg 格式</p>
                    </>
                  )}
                </div>

                {/* 右侧：配置选项 */}
                <div className="border-2 border-[#27272A] rounded-xl p-5 flex flex-col">
                  {/* 音视频语言 */}
                  <div className="mb-5">
                    <p className="text-sm text-[#A1A1AA] mb-2">音视频语言</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'zh', label: '中文' },
                        { value: 'en', label: '英文' },
                        { value: 'ja', label: '日语' },
                        { value: 'yue', label: '粤语' },
                        { value: 'zh-en', label: '中英文自由说' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAudioLanguage(item.value)}
                          className={`h-9 rounded-lg text-sm transition-all ${
                            audioLanguage === item.value
                              ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                              : 'bg-[#0A0A0B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 区分发言人 */}
                  <div>
                    <p className="text-sm text-[#A1A1AA] mb-2">区分发言人</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'none', label: '暂不体验' },
                        { value: '2', label: '2人对话' },
                        { value: 'multi', label: '多人讨论' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setSpeakerDiarization(item.value)}
                          className={`h-9 rounded-lg text-sm transition-all ${
                            speakerDiarization === item.value
                              ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                              : 'bg-[#0A0A0B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={uploadType === 'text' ? '请粘贴面试的文字记录，包括面试官的问题和你的回答...' : '请描述面试过程，如面试官问了什么问题、你如何回答、面试氛围等...'}
                className="min-h-[200px] bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
              />
            )}
          </div>

          {error && <p className="text-sm text-[#F87171]">{error}</p>}

          <Button
            onClick={handleAnalyze}
            disabled={loading || !content.trim()}
            className="w-full h-12 aurora-gradient text-white border-0 text-base aurora-glow hover:opacity-90"
          >
            {loading ? <><Loader2 size={18} className="mr-2 animate-spin" /> 正在分析...</> : '开始 AI 分析'}
          </Button>
        </div>
      )}

      {view === 'report' && !showTranscript && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetUpload} className="border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B]">← 返回</Button>
            {transcribedText && (
              <Button
                variant="outline"
                onClick={() => setShowTranscript(true)}
                className="border-[#27272A] text-[#00D9FF] hover:bg-[#18181B]"
              >
                <FileText size={16} className="mr-1" /> 查看原文
              </Button>
            )}
          </div>

          {/* 总体评价 */}
          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h2 className="text-xl font-bold text-[#FAFAFA] mb-4">
              {viewingHistoryId ? '历史复盘记录' : '复盘报告'}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-[#A1A1AA] mb-4">
              <span>公司：{company}</span>
              <span>岗位：{position}</span>
              <span>轮次：{round || '技术面试'}</span>
              <span>问题数：{result?.total_questions || result?.questions?.length || 0}</span>
            </div>
            {result?.summary && (
              <p className="text-[#D4D4D8] mb-4">{result.summary}</p>
            )}

            {/* 优缺点 */}
            <div className="grid grid-cols-2 gap-4">
              {result?.strengths?.length > 0 && (
                <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                  <h4 className="text-sm font-medium text-[#10B981] mb-2">表现亮点</h4>
                  <ul className="text-xs text-[#D4D4D8] space-y-1">
                    {result.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}
              {result?.weaknesses?.length > 0 && (
                <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <h4 className="text-sm font-medium text-[#EF4444] mb-2">待改进</h4>
                  <ul className="text-xs text-[#D4D4D8] space-y-1">
                    {result.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 问题列表 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#FAFAFA]">问题详情</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddQuestion(true)}
              className="border-[#27272A] text-[#00D9FF] hover:bg-[#18181B]"
            >
              <PlusCircle size={16} className="mr-1" /> 手动添加问题
            </Button>
          </div>
          {result?.questions?.length > 0 ? (
            <div className="space-y-3">
              {result.questions.map((q, idx) => (
                <ReportQuestion
                  key={idx}
                  question={q}
                  onClick={() => setSelectedQuestion(q)}
                />
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A] text-center text-[#A1A1AA]">
              <p>暂无问题分析结果</p>
            </div>
          )}

          {/* 学习建议 */}
          {result?.recommendations?.length > 0 && (
            <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
              <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3">学习建议</h3>
              <ul className="text-sm text-[#D4D4D8] space-y-2">
                {result.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}

          {/* 沉淀到知识库 */}
          {!viewingHistoryId && (
            <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
              <h3 className="text-lg font-semibold text-[#FAFAFA] mb-3 flex items-center gap-2"><Save size={18} className="text-[#00D9FF]" /> 沉淀到知识库</h3>
              <div className="space-y-2 text-sm text-[#D4D4D8]">
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-[#10B981]" /> 新增面试问题 {result?.questions?.length || 0} 道</div>
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-[#10B981]" /> 自动关联相关经历</div>
              </div>
              {saved ? (
                <div className="mt-4 flex items-center gap-2 text-[#10B981]">
                  <CheckCircle size={18} /> 已保存到知识库
                </div>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving || !result?.questions?.length}
                  className="mt-4 aurora-gradient text-white border-0 hover:opacity-90"
                >
                  {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> 保存中...</> : '确认沉淀'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 问题详情弹窗 */}
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
                  {selectedQuestion.score && ` (${selectedQuestion.score}分)`}
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

              {/* 参考回答 */}
              {selectedQuestion.reference_answer && (
                <div>
                  <h3 className="text-sm text-[#A1A1AA] mb-1">参考回答要点</h3>
                  <p className="text-[#D4D4D8] bg-[#10B981]/5 rounded-lg p-3 border border-[#10B981]/20">{selectedQuestion.reference_answer}</p>
                </div>
              )}

              {/* 可能的追问 */}
              {selectedQuestion.follow_up && (
                <div>
                  <h3 className="text-sm text-[#A1A1AA] mb-1">可能的追问</h3>
                  <p className="text-sm text-[#A1A1AA]">{selectedQuestion.follow_up}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedQuestion(null)} className="flex-1 border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A]">
                关闭
              </Button>
              <Button className="flex-1 aurora-gradient text-white border-0 hover:opacity-90">
                添加到知识库
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 原文视图 */}
      {view === 'report' && showTranscript && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowTranscript(false)} className="border-[#27272A] text-[#D4D4D8] hover:bg-[#18181B]">
              ← 返回报告
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowAddQuestion(true); }}
              className="border-[#27272A] text-[#00D9FF] hover:bg-[#18181B]"
            >
              <PlusCircle size={16} className="mr-1" /> 手动添加问题
            </Button>
          </div>

          <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
            <h2 className="text-xl font-bold text-[#FAFAFA] mb-4">语音识别原文</h2>
            <div className="flex flex-wrap gap-4 text-sm text-[#A1A1AA] mb-4">
              <span>公司：{company}</span>
              <span>岗位：{position}</span>
              <span>轮次：{round || '技术面试'}</span>
            </div>
            <div className="bg-[#0A0A0B] rounded-lg p-4 max-h-[60vh] overflow-y-auto">
              {/* 如果有说话人分段信息，按说话人显示 */}
              {speakers && speakers.length > 0 ? (
                <div className="space-y-4">
                  {speakers.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className={`shrink-0 w-16 text-xs font-medium px-2 py-1 rounded ${
                        item.speaker === '0' || item.speaker === 'Speaker0' || item.speaker === 0
                          ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                          : 'bg-[#A855F7]/20 text-[#A855F7]'
                      }`}>
                        {item.speaker === '0' || item.speaker === 'Speaker0' || item.speaker === 0 ? '面试官' : '候选人'}
                      </div>
                      <p className="text-[#D4D4D8] leading-relaxed flex-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#D4D4D8] whitespace-pre-wrap leading-relaxed">
                  {transcribedText || content || '暂无原文内容'}
                </p>
              )}
            </div>
          </div>

          {/* 已添加的问题列表 */}
          {result?.questions?.length > 0 && (
            <div className="p-5 rounded-xl bg-[#18181B] border border-[#27272A]">
              <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">已识别问题 ({result.questions.length})</h3>
              <div className="space-y-3">
                {result.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#0A0A0B] border border-[#27272A]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#FAFAFA] font-medium">{q.question}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        q.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        q.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                        'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {q.category || '其他'}
                      </span>
                    </div>
                    {q.answer && (
                      <p className="text-sm text-[#A1A1AA] line-clamp-2">回答：{q.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 手动添加问题弹窗 */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#FAFAFA]">手动添加问题</h2>
              <button onClick={() => setShowAddQuestion(false)} className="text-[#71717A] hover:text-[#FAFAFA]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">问题内容 *</label>
                <Textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="请输入面试官的问题"
                  className="min-h-[80px] bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">你的回答</label>
                <Textarea
                  value={newQuestion.answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                  placeholder="请输入你的回答（可选）"
                  className="min-h-[80px] bg-[#0A0A0B] border-[#27272A] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#A1A1AA] mb-2">问题分类</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'project', label: '项目经验' },
                    { value: 'basics', label: '基础知识' },
                    { value: 'algorithm', label: '算法' },
                    { value: 'behavior', label: '行为面试' },
                    { value: 'system', label: '系统设计' },
                    { value: 'other', label: '其他' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setNewQuestion({ ...newQuestion, category: item.value })}
                      className={`h-9 rounded-lg text-sm transition-all ${
                        newQuestion.category === item.value
                          ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                          : 'bg-[#0A0A0B] text-[#A1A1AA] border border-[#27272A] hover:border-[#3F3F46]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddQuestion(false);
                  setNewQuestion({ question: '', answer: '', category: 'project' });
                }}
                className="flex-1 border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A]"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  if (!newQuestion.question.trim()) return;
                  const newQ = {
                    id: (result?.questions?.length || 0) + 1,
                    question: newQuestion.question,
                    answer: newQuestion.answer,
                    category: newQuestion.category,
                    level: 'average',
                    score: 3,
                    analysis: '手动添加的问题，待分析',
                    improvement: '',
                    reference_answer: '',
                    follow_up: '',
                  };
                  setResult({
                    ...result,
                    questions: [...(result?.questions || []), newQ],
                    total_questions: (result?.total_questions || 0) + 1,
                  });
                  setShowAddQuestion(false);
                  setNewQuestion({ question: '', answer: '', category: 'project' });
                }}
                className="flex-1 aurora-gradient text-white border-0 hover:opacity-90"
                disabled={!newQuestion.question.trim()}
              >
                添加问题
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UploadCard = ({ icon: Icon, title, desc, onClick }) => (
  <div
    className="p-6 rounded-xl bg-[#18181B] border border-[#27272A] text-center cursor-pointer hover:border-[#00D9FF]/50 transition-all"
    onClick={onClick}
  >
    <div className="w-12 h-12 rounded-full bg-[#27272A] flex items-center justify-center mx-auto mb-3"><Icon size={24} className="text-[#00D9FF]" /></div>
    <h3 className="text-[#FAFAFA] font-medium mb-1">{title}</h3>
    <p className="text-xs text-[#71717A]">{desc}</p>
  </div>
);

const ReportQuestion = ({ question, onClick }) => (
  <div
    className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] cursor-pointer hover:border-[#3F3F46] transition-all"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[#FAFAFA] font-medium flex-1">{question.question}</span>
      <span className={`text-xs px-2 py-0.5 rounded ${
        question.level === 'good' ? 'bg-[#10B981]/10 text-[#10B981]' :
        question.level === 'bad' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
        'bg-[#F59E0B]/10 text-[#F59E0B]'
      }`}>
        {question.level === 'good' ? '⭐⭐⭐ 良好' :
         question.level === 'bad' ? '⭐ 待改进' : '⭐⭐ 一般'}
      </span>
    </div>
    {question.answer && (
      <p className="text-sm text-[#A1A1AA] mb-2 line-clamp-2">回答：{question.answer}</p>
    )}
    {question.analysis && (
      <p className="text-sm text-[#71717A] line-clamp-1">{question.analysis}</p>
    )}
    <div className="mt-3 flex items-center justify-between">
      <span className="text-xs text-[#71717A]">{question.category || '其他'}</span>
      <span className="text-xs text-[#00D9FF]">查看详情 →</span>
    </div>
  </div>
);

export default InterviewReview;