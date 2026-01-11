
import React, { useState } from 'react';
import { OutlineItem } from '../types';

interface PlannerProps {
  onGenerate: (markdown: string) => void;
}

const Planner: React.FC<PlannerProps> = ({ onGenerate }) => {
  const [steps, setSteps] = useState<OutlineItem[]>([
    { 
      id: '01', 
      title: '标题: Slidev AI 深度解析', 
      type: 'primary',
      children: [ { label: '副标题: 探索演示文稿的未来', type: 'detail' } ]
    },
    { 
      id: '02', 
      title: '介绍: 什么是 Slidev?', 
      type: 'secondary',
      children: [ 
        { label: '内容: 核心优势', type: 'content' },
        { label: '内容: 技术栈选型', type: 'content' }
      ]
    },
    { 
      id: '03', 
      title: '核心功能演示', 
      type: 'secondary',
      children: [ 
        { label: '内容: 代码实时预览', type: 'content' },
        { label: '内容: AI 辅助编辑', type: 'content' }
      ]
    },
  ]);

  const addStep = () => {
    const nextId = (steps.length + 1).toString().padStart(2, '0');
    setSteps([...steps, {
      id: nextId,
      title: '新幻灯片标题',
      type: 'secondary',
      children: [{ label: '待补充内容...', type: 'content' }]
    }]);
  };

  const handleGenerate = () => {
    let md = `---
theme: seriph
background: https://picsum.photos/id/20/1920/1080
---
`;
    steps.forEach((step, idx) => {
      md += `\n# ${step.title}\n\n${step.children.map(c => `- ${c.label}`).join('\n')}\n`;
      if (idx < steps.length - 1) md += `\n---\n`;
    });
    onGenerate(md);
  };

  const updateTitle = (id: string, newTitle: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 flex flex-col bg-background-dark relative border-r border-border-dark overflow-hidden">
        <header className="h-14 border-b border-border-dark flex items-center justify-between px-8 bg-panel-dark/50 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-white text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
              AI 生成大纲
            </span>
            <div className="h-4 w-px bg-border-dark"></div>
            <span className="text-[10px] font-bold bg-slate-800 text-[#90a4cb] px-2 py-0.5 rounded border border-border-dark uppercase">
              共 {steps.length} 个幻灯片节点
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors bg-white/5 rounded border border-white/10">
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              重置提示词
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#0b0f1a]">
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col gap-3 relative group">
                <div className="flex items-center gap-4">
                  <div className={`size-8 rounded ${step.type === 'primary' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-[11px] font-bold shrink-0 shadow-lg border border-white/5`}>
                    {step.id}
                  </div>
                  <div className="flex-1 bg-panel-dark border border-border-dark p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all shadow-xl group-hover:shadow-primary/5">
                    <input 
                      type="text" 
                      value={step.title}
                      onChange={(e) => updateTitle(step.id, e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full placeholder:text-slate-700"
                      placeholder="幻灯片标题..."
                    />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                        title="删除节点"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      <button className="text-slate-600 hover:text-white transition-colors p-1 cursor-grab">
                        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="ml-12 pl-8 relative border-l border-border-dark/50 flex flex-col gap-3">
                  {step.children.map((child, idx) => (
                    <div key={idx} className="relative flex items-center gap-3 group/child">
                      <div className="absolute -left-8 top-1/2 w-8 h-[1px] bg-border-dark/50"></div>
                      <div className="flex-1 bg-slate-800/40 border border-border-dark/50 px-4 py-2.5 rounded-lg text-xs text-slate-400 italic shadow-inner group-hover/child:text-slate-200 transition-colors">
                        {child.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <button 
              onClick={addStep}
              className="ml-12 mt-2 w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-border-dark text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all uppercase tracking-widest shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              插入新大纲节点
            </button>
          </div>
        </div>

        <div className="h-28 bg-panel-dark/95 backdrop-blur-md border-t border-border-dark flex items-center justify-center px-8 shrink-0 gap-6">
           <div className="flex flex-col items-center gap-1">
             <button 
              onClick={handleGenerate}
              className="bg-primary text-white h-14 px-12 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              确认并生成完整幻灯片
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">rocket_launch</span>
            </button>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">同步将覆盖当前编辑器内容</p>
           </div>
        </div>
      </main>

      <aside className="w-96 flex flex-col border-l border-border-dark bg-panel-dark">
        <div className="h-14 border-b border-border-dark px-4 shrink-0 flex items-center justify-center gap-2 border-b-2 border-primary text-white bg-background-dark/20">
          <span className="material-symbols-outlined text-[20px] text-primary">auto_fix_high</span>
          <span className="text-xs font-bold uppercase tracking-widest">AI 优化助手</span>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-start gap-3">
             <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shrink-0">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
             </div>
             <div className="bg-slate-800/80 border border-border-dark p-4 rounded-xl text-xs leading-relaxed text-slate-300 shadow-md">
                你好！我是大纲生成助手。我已经根据你的初始要求生成了一个基本大纲。
                <br/><br/>
                你可以直接<b>点击标题</b>进行修改，或者在下方提出新的要求，让我为你重新规划。
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">常用优化</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                增加技术深度
              </button>
              <button className="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                减少演示时间
              </button>
              <button className="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                添加交互提示
              </button>
              <button className="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                更口语化一些
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-border-dark bg-background-dark/30">
          <div className="relative">
            <textarea 
              className="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-xs text-white focus:ring-1 focus:ring-primary placeholder:text-slate-600 resize-none h-24 shadow-inner"
              placeholder="提出优化建议，例如：'让整体风格更幽默一点'..."
            />
            <button className="absolute bottom-3 right-3 bg-primary/20 text-primary size-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Planner;
