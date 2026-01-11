
import React, { useState, useMemo } from 'react';
import { AppView } from '../types';

interface EditorProps {
  mode: 'code' | 'ai';
  projectName: string;
  markdown: string;
  activeSlideIndex: number;
  onMarkdownChange: (val: string) => void;
  onSwitchMode: (view: AppView) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

const Editor: React.FC<EditorProps> = ({ mode, projectName, markdown, activeSlideIndex, onMarkdownChange }) => {
  const [aiInput, setAiInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
  ]);

  // Enhanced mock parser for preview that respects the activeSlideIndex
  const previewData = useMemo(() => {
    const slides = markdown.split('---').map(s => s.trim()).filter(s => s);
    // frontmatter slides are often skipped in content navigation, let's filter them for display
    const contentSlides = slides.filter(s => !s.startsWith('theme:'));
    
    // Default to first if out of bounds
    const contentSlide = contentSlides[activeSlideIndex] || contentSlides[0];
    if (!contentSlide) return { title: '无标题', description: '' };
    
    const lines = contentSlide.split('\n');
    const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || 
                  lines.find(l => l.startsWith('## '))?.replace('## ', '') || 'Slidev Studio';
    const description = lines.find(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('layout:')) || '';
    
    return { title, description, count: contentSlides.length };
  }, [markdown, activeSlideIndex]);

  const handleSendAi = () => {
    if (!aiInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: aiInput };
    setChatHistory(prev => [...prev, userMsg]);
    setAiInput('');

    // Mock AI "Thinking" and response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '', isThinking: true }]);
      
      setTimeout(() => {
        setChatHistory(prev => {
          const filtered = prev.filter(m => !m.isThinking);
          return [...filtered, { 
            role: 'assistant', 
            content: `我已经为你更新了幻灯片。我在内容中添加了关于 "${userMsg.content}" 的相关信息，并优化了标题排版。` 
          }];
        });
        
        onMarkdownChange(markdown + `\n\n--- \n\n# AI 生成内容\n\n针对你的请求：${userMsg.content}\n\n- 自动生成的观点 1\n- 自动生成的观点 2`);
      }, 1500);
    }, 500);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Preview Section */}
      <section className="flex-[3] flex flex-col bg-[#161d2b] relative border-r border-border-dark overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-dark bg-panel-dark/30">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">实时预览</span>
            <div className="h-4 w-px bg-border-dark"></div>
            <span className="text-[10px] text-[#90a4cb] font-bold">页面 {activeSlideIndex + 1} / {previewData.count}</span>
          </div>
          <div className="flex items-center gap-2 text-[#90a4cb]">
            <button className="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span className="material-symbols-outlined text-lg">desktop_windows</span></button>
            <button className="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span className="material-symbols-outlined text-lg">refresh</span></button>
          </div>
        </div>

        <div className="flex-1 p-12 flex items-center justify-center bg-[#0b0f1a] overflow-auto custom-scrollbar">
          <div className="w-full max-w-4xl aspect-video bg-white rounded-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative transition-transform duration-500 ease-in-out">
             <div className="flex-1 bg-gradient-to-br from-primary to-[#001c54] p-16 flex flex-col justify-center text-left">
              <div className="inline-block px-3 py-1 bg-white/10 rounded border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-8 w-fit animate-pulse">
                Live Preview
              </div>
              <h1 className="text-6xl font-display font-bold text-white mb-8 leading-tight drop-shadow-lg">{previewData.title}</h1>
              <p className="text-white/70 text-xl max-w-2xl leading-relaxed">{previewData.description}</p>
              
              <div className="absolute bottom-10 right-10 opacity-10">
                <span className="material-symbols-outlined text-white text-[160px]">auto_awesome</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/10 w-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((activeSlideIndex + 1) / previewData.count) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Editor */}
      {mode === 'code' && (
        <section className="flex-[2] flex flex-col bg-[#0b0f1a]">
          <div className="flex border-b border-border-dark bg-background-dark/50">
            <div className="flex items-center gap-2 px-4 py-3 border-r border-border-dark bg-[#0b0f1a] border-t-2 border-t-primary">
              <span className="material-symbols-outlined text-primary text-sm">description</span>
              <span className="text-xs font-bold text-white">{projectName}</span>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden font-mono text-[13px]">
            <div className="w-12 py-4 flex flex-col items-center text-[#314368] select-none bg-[#0b0f1a] border-r border-border-dark/30">
              {Array.from({length: 40}).map((_, i) => <span key={i} className={i > 30 ? 'opacity-20' : ''}>{i+1}</span>)}
            </div>
            <textarea 
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[#79c0ff] p-4 resize-none leading-relaxed custom-scrollbar whitespace-pre font-mono"
              spellCheck={false}
            />
          </div>
        </section>
      )}

      {/* AI Panel */}
      {mode === 'ai' && (
        <aside className="flex-[2] flex flex-col bg-panel-dark">
          <div className="flex border-b border-border-dark px-4 shrink-0 h-14">
            <div className="flex-1 flex flex-col items-center justify-center border-b-[3px] border-primary text-white shadow-[0_4px_12px_rgba(13,89,242,0.1)]">
              <p className="text-xs font-bold tracking-widest flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-[18px]">forum</span>
                AI 协作
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}>
                {msg.role === 'assistant' && (
                  <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
                    <span className="material-symbols-outlined text-[20px]">memory</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-[#222f49] text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.isThinking ? (
                       <div className="flex items-center gap-2 italic text-[#90a4cb]">
                         <span className="size-1.5 bg-primary rounded-full animate-bounce"></span>
                         <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                         <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                         思考中...
                       </div>
                    ) : msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border-dark bg-background-dark/30 shrink-0">
            <div className="relative">
              <textarea 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendAi())}
                className="w-full bg-[#0a0f18] border border-border-dark rounded-xl p-4 pr-12 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600 resize-none font-sans min-h-[100px] shadow-inner"
                placeholder="尝试说：'把标题改成赛博朋克风格'..."
              />
              <button 
                onClick={handleSendAi}
                className="absolute bottom-3 right-3 bg-primary text-white size-10 rounded-lg flex items-center justify-center hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[22px]">send</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Editor;
