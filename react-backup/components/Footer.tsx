
import React from 'react';
import { AppView } from '../types';

interface FooterProps {
  activeView: AppView;
}

const Footer: React.FC<FooterProps> = ({ activeView }) => {
  const isPrimary = activeView === AppView.EDITOR_AI || activeView === AppView.PLANNER;
  
  return (
    <footer className={`h-6 flex shrink-0 items-center justify-between px-4 text-[10px] font-mono z-20 transition-colors ${isPrimary ? 'bg-primary text-white' : 'bg-background-dark border-t border-border-dark text-[#90a4cb]'}`}>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className={`material-symbols-outlined text-[12px] ${!isPrimary ? 'text-green-500' : ''}`}>check_circle</span>
          SYSTEM_OK
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">timer</span>
          RENDER: 12ms
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">bolt</span>
          AI_LAYER_ACTIVE
        </span>
        <div className="flex items-center gap-2">
          <span>v0.48.0-studio</span>
          <span className="opacity-50">|</span>
          <span className="uppercase tracking-widest">UTF-8</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
