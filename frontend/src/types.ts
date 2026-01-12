
export enum AppView {
  DASHBOARD = 'dashboard',
  EDITOR = 'editor',
  SETTINGS = 'settings'
}

export type AiMode = 'ppt' | 'outline';

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
