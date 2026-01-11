
import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  activeView: AppView;
  projectName: string;
  onNavigate: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, projectName, onNavigate }) => {
  if (activeView === AppView.DASHBOARD) return null;

  const isEditor = activeView === AppView.EDITOR_CODE || activeView === AppView.EDITOR_AI || activeView === AppView.PLANNER;

  return (
    <header className="h-14 border-b border-border-dark bg-panel-dark flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-4">
        {/* explicit Back Button */}
        <button 
          onClick={() => onNavigate(AppView.DASHBOARD)}
          className="flex items-center gap-2 px-2 py-1.5 text-[#90a4cb] hover:text-white hover:bg-white/5 rounded-lg transition-all group"
          title="返回项目列表"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">列表</span>
        </button>

        <div className="h-4 w-[1px] bg-border-dark mx-1"></div>

        <div 
          className="bg-primary rounded-lg p-1.5 flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          onClick={() => onNavigate(AppView.DASHBOARD)}
        >
          <span className="material-symbols-outlined text-white text-xl">layers</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-white text-sm font-bold leading-none">Slidev Studio</h1>
          <p className="text-[#90a4cb] text-[10px] font-mono mt-0.5 uppercase tracking-wider">{projectName}</p>
        </div>
        
        {isEditor && (
          <>
            <div className="h-4 w-[1px] bg-border-dark mx-2"></div>
            <nav className="flex items-center gap-1 bg-background-dark/50 p-1 rounded-lg border border-border-dark/30 shadow-inner">
              <button 
                onClick={() => onNavigate(AppView.EDITOR_CODE)}
                className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.EDITOR_CODE ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`}
              >
                代码
              </button>
              <button 
                onClick={() => onNavigate(AppView.EDITOR_AI)}
                className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.EDITOR_AI ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`}
              >
                AI
              </button>
              <button 
                onClick={() => onNavigate(AppView.PLANNER)}
                className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.PLANNER ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`}
              >
                大纲
              </button>
            </nav>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeView === AppView.SETTINGS ? (
           <button 
            onClick={() => onNavigate(AppView.DASHBOARD)}
            className="text-[#90a4cb] hover:text-white transition-colors p-2"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        ) : (
          <>
            <button className="flex items-center gap-2 px-3 h-8 bg-[#222f49] text-white rounded-lg hover:bg-[#2c3b5a] transition-colors" onClick={() => onNavigate(AppView.SETTINGS)}>
              <span className="material-symbols-outlined text-lg">settings</span>
              <span className="text-[11px] font-bold">项目设置</span>
            </button>
            <button className="flex items-center gap-2 px-4 h-8 bg-primary text-white rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              <span className="text-[11px] font-bold">演示</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
