
import React, { useState } from 'react';
import { AppView } from '../types';

interface DashboardProps {
  onOpenProject: (name: string) => void;
  onCreateProject: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, onCreateProject }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const projects = [
    { id: '1', name: 'RAG_Tech_Share.md', updated: '2小时前', img: 'https://picsum.photos/seed/slide1/400/225' },
    { id: '2', name: 'Intro_to_Kubernetes.md', updated: '5小时前', img: 'https://picsum.photos/seed/slide2/400/225' },
    { id: '3', name: 'Q4_Roadmap.md', updated: '1天前', img: 'https://picsum.photos/seed/slide3/400/225' },
    { id: '4', name: 'AI_Agents_Deep_Dive.md', updated: '3天前', img: 'https://picsum.photos/seed/slide4/400/225' },
    { id: '5', name: 'Frontend_Performance.md', updated: '1周前', img: 'https://picsum.photos/seed/slide5/400/225' },
    { id: '6', name: 'System_Design_v2.md', updated: '2周前', img: 'https://picsum.photos/seed/slide6/400/225' },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <header className="h-16 border-b border-border-dark flex items-center justify-between px-8 bg-panel-dark shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white">terminal</span>
          </div>
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input 
              type="text" 
              placeholder="搜索本地文件 (Cmd + K)" 
              className="w-full bg-[#1a2333] border-none rounded-lg py-1.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary placeholder:text-slate-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-background-dark border border-border-dark rounded-lg p-0.5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              网格
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              列表
            </button>
          </div>
          <button 
            onClick={onCreateProject}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>新建项目</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-background-dark">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex justify-between items-baseline">
            <h2 className="text-2xl font-bold tracking-tight text-white">我的幻灯片</h2>
            <p className="text-xs text-slate-500">本地存储: {projects.length} 份文件</p>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  className="group flex flex-col gap-4 cursor-pointer"
                  onClick={() => onOpenProject(p.name)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border-dark bg-panel-dark transition-all group-hover:border-primary/50 group-hover:shadow-2xl group-hover:shadow-primary/10">
                    <img src={p.img} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <button className="w-full bg-white text-black py-2 rounded-lg text-xs font-bold">打开项目</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start px-1">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">修改于 {p.updated}</p>
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">Local</span>
                  </div>
                </div>
              ))}
              
              <div 
                onClick={onCreateProject}
                className="aspect-video rounded-xl border-2 border-dashed border-border-dark flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-slate-500 group-hover:text-primary text-3xl">add_circle</span>
                <span className="text-xs font-bold text-slate-500 group-hover:text-primary">创建新项目</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col bg-panel-dark border border-border-dark rounded-xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-border-dark text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="col-span-6">项目名称</div>
                <div className="col-span-3">修改时间</div>
                <div className="col-span-2">存储类型</div>
                <div className="col-span-1 text-right">操作</div>
              </div>
              <div className="flex flex-col">
                {projects.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => onOpenProject(p.name)}
                    className="grid grid-cols-12 px-6 py-4 items-center hover:bg-primary/5 cursor-pointer transition-colors group border-b border-border-dark/50 last:border-none"
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-6 rounded bg-slate-800 overflow-hidden shrink-0 border border-border-dark group-hover:border-primary/50">
                        <img src={p.img} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{p.name}</span>
                    </div>
                    <div className="col-span-3 text-xs text-slate-400">
                      {p.updated}
                    </div>
                    <div className="col-span-2">
                      <span className="bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase group-hover:text-slate-300">Local</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
