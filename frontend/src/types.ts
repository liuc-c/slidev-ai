
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR_AI = 'editor_ai',
  SETTINGS = 'settings'
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  layout: string;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface OutlineItem {
  id: string;
  title: string;
  type: 'primary' | 'secondary';
  children: { label: string; type: string }[];
}

// V1 Schema Types (from prompts-v1.md)
export interface SourceCard {
  card_id: string;
  quote: string;
  tags: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface OutlineSlide {
  slide_id: string;
  type: 'cover' | 'agenda' | 'content' | 'summary' | 'qa';
  title: string;
  purpose: '引入' | '定义' | '论证' | '对比' | '总结' | '行动' | '过渡';
  density: 'low' | 'med' | 'high';
  visual_hint: 'hero' | 'list' | 'table' | 'timeline' | 'diagram' | 'quote';
  bullets: string[];
  must_include: string[];
  source_card_ids: string[];
}

export interface OutlineV1 {
  outline_version: string;
  meta: {
    topic: string;
    estimated_pages: number;
  };
  slides: OutlineSlide[];
}

// Prompt Style Types
export interface PromptStyle {
  id: string;
  name: string;
  icon: string;
  description: string;
  outlinePrompt: string;
  slidePrompt: string;
  isBuiltin: boolean;
}

export interface PromptConfig {
  selectedStyleId: string;
  customStyles: PromptStyle[];
}
