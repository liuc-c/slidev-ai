
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR_CODE = 'editor_code',
  EDITOR_AI = 'editor_ai',
  PLANNER = 'planner',
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
