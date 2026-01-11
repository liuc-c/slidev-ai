
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, activeSlideIndex, onSelectSlide }) => {
  const isPlanner = activeView === AppView.PLANNER;

  const slides = [
    { id: 0, label: '01: 项目介绍' },
    { id: 1, label: '02: 核心功能' },
    { id: 2, label: '03: AI 生成' },
    { id: 3, label: '04: 交互组件' }
  ];

  return (
    <aside className="w-64 border-r border-border-dark flex flex-col bg-panel-dark h-full shrink-0">
      <div className="p-4 border-b border-border-dark flex items-center justify-between bg-background-dark/20">
        <span className="text-[11px] font-bold text-[#90a4cb] uppercase tracking-widest">
          {isPlanner ? '大纲规划器' : '幻灯片结构'}
        </span>
        <div className="flex items-center gap-2">
          {!isPlanner ? (
            <button 
              onClick={() => onNavigate(AppView.PLANNER)}
              className="group flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-all"
              title="切换至大纲编辑器"
            >
              <span className="material-symbols-outlined text-sm">account_tree</span>
              <span className="text-[9px] font-bold uppercase tracking-tighter">大纲</span>
            </button>
          ) : (
             <button 
              onClick={() => onNavigate(AppView.EDITOR_CODE)}
              className="group flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md transition-all"
              title="返回代码编辑器"
            >
              <span className="material-symbols-outlined text-sm">code</span>
              <span className="text-[9px] font-bold uppercase tracking-tighter">代码</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {!isPlanner ? (
          <>
            <div className="px-4 py-2 mb-2">
              <div className="flex items-center gap-2 text-[#90a4cb] text-[10px] font-bold mb-3 uppercase tracking-widest opacity-60">
                <span className="material-symbols-outlined text-sm">folder_open</span>
                本地文件
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-white bg-primary/10 border-l-2 border-primary rounded-r cursor-pointer">
                  <span className="material-symbols-outlined text-sm text-primary">description</span>
                  slides.md
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#90a4cb] hover:bg-[#222f49]/30 rounded cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-sm">settings_suggest</span>
                  slidev.config.ts
                </div>
              </div>
            </div>

            <div className="px-4 py-2 border-t border-border-dark/50">
              <div className="text-[#90a4cb] text-[10px] font-bold mb-3 uppercase tracking-widest opacity-60">幻灯片结构</div>
              <div className="space-y-1">
                {slides.map((slide) => (
                  <div 
                    key={slide.id} 
                    onClick={() => {
                      onSelectSlide(slide.id);
                      // Fix: isPlanner is derived from activeView === AppView.PLANNER.
                      // This branch is only reachable when !isPlanner is true.
                      // Since isPlanner is false here, this condition is redundant but safe.
                      if (isPlanner) onNavigate(AppView.EDITOR_CODE);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded group relative ${
                      activeSlideIndex === slide.id 
                        ? 'bg-primary/20 border-l-2 border-primary text-white shadow-lg shadow-primary/5' 
                        : 'text-[#90a4cb] hover:bg-[#222f49]/30 hover:text-slate-200'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base ${activeSlideIndex === slide.id ? 'text-primary animate-pulse' : 'text-[#314368] group-hover:text-[#4b6392]'}`}>tag</span>
                    <p className={`text-xs font-bold ${activeSlideIndex === slide.id ? 'text-white' : ''}`}>{slide.label}</p>
                    {activeSlideIndex === slide.id && (
                       <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-2">
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest opacity-60">初始提示词</h3>
                <div className="bg-background-dark/50 border border-border-dark p-3 rounded-lg ring-1 ring-primary/20 shadow-inner">
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "创建一个关于 Slidev 架构的技术深度演示稿..."
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest opacity-60">大纲设置</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/10 cursor-pointer shadow-sm">
                    <div className="size-3 rounded-full border border-primary flex items-center justify-center">
                      <div className="size-1.5 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs font-medium">逻辑严密模式</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border-dark hover:border-slate-500 cursor-pointer transition-colors group">
                    <div className="size-3 rounded-full border border-border-dark group-hover:border-slate-500"></div>
                    <span className="text-xs font-medium text-slate-400">极简摘要模式</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-dark bg-background-dark/30">
        <button className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/5 active:scale-95">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>插入新幻灯片</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
