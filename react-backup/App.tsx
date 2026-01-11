
import React, { useState, useCallback } from 'react';
import { AppView } from './types';
import Dashboard from './views/Dashboard';
import Editor from './views/Editor';
import Planner from './views/Planner';
import Settings from './views/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

const DEFAULT_MARKDOWN = `---
theme: seriph
background: https://picsum.photos/id/10/1920/1080
class: text-center
highlighter: shiki
lineNumbers: true
---

# Slidev Studio AI

AI 驱动的现代化演示文稿引擎。

---
layout: default
---

## 核心功能

- 📝 **Markdown 驱动** - 专注内容创作
- 🧑‍💻 **开发者友好** - 支持代码片段与实时预览
- 🤖 **AI 协作** - 自动生成大纲与内容优化

---
layout: section
---

## AI 生成内容

点击左侧大纲即可快速切换幻灯片。

---
layout: default
---

## 交互组件

这是一个模拟的交互演示。`;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [activeProjectName, setActiveProjectName] = useState('slides.md');
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
  }, []);

  const handleOpenProject = (name: string) => {
    setActiveProjectName(name);
    setActiveView(AppView.EDITOR_CODE);
  };

  const handleCreateProject = () => {
    setActiveProjectName('untitled_project.md');
    setMarkdown(''); // Start fresh
    setActiveSlideIndex(0);
    setActiveView(AppView.PLANNER);
  };

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <Dashboard onOpenProject={handleOpenProject} onCreateProject={handleCreateProject} />;
      case AppView.EDITOR_CODE:
        return (
          <Editor 
            mode="code" 
            projectName={activeProjectName} 
            markdown={markdown}
            activeSlideIndex={activeSlideIndex}
            onMarkdownChange={setMarkdown}
            onSwitchMode={handleNavigate} 
          />
        );
      case AppView.EDITOR_AI:
        return (
          <Editor 
            mode="ai" 
            projectName={activeProjectName} 
            markdown={markdown}
            activeSlideIndex={activeSlideIndex}
            onMarkdownChange={setMarkdown}
            onSwitchMode={handleNavigate} 
          />
        );
      case AppView.PLANNER:
        return (
          <Planner 
            onGenerate={(newMarkdown) => {
              setMarkdown(newMarkdown);
              setActiveSlideIndex(0);
              setActiveView(AppView.EDITOR_CODE);
            }} 
          />
        );
      case AppView.SETTINGS:
        return <Settings onClose={() => setActiveView(AppView.DASHBOARD)} />;
      default:
        return <Dashboard onOpenProject={handleOpenProject} onCreateProject={handleCreateProject} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background-dark text-slate-100 font-display">
      <Header 
        activeView={activeView} 
        projectName={activeProjectName} 
        onNavigate={handleNavigate}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {activeView !== AppView.DASHBOARD && activeView !== AppView.SETTINGS && (
          <Sidebar 
            activeView={activeView} 
            onNavigate={handleNavigate} 
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={setActiveSlideIndex}
          />
        )}
        
        <main className="flex-1 flex overflow-hidden">
          {renderView()}
        </main>
      </div>

      <Footer activeView={activeView} />
    </div>
  );
};

export default App;
