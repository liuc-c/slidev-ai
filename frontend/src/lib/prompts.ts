import type { PromptStyle } from '../types';

/**
 * Common icon options for user to choose from when creating custom styles
 */
export const ICON_OPTIONS = [
  { name: 'business_center', label: '商务' },
  { name: 'auto_awesome', label: '科技' },
  { name: 'school', label: '教育' },
  { name: 'palette', label: '创意' },
  { name: 'rocket_launch', label: '发布' },
  { name: 'analytics', label: '数据' },
  { name: 'psychology', label: '思维' },
  { name: 'lightbulb', label: '灵感' },
  { name: 'code', label: '代码' },
  { name: 'architecture', label: '架构' },
  { name: 'groups', label: '团队' },
  { name: 'trending_up', label: '增长' },
  { name: 'medical_services', label: '医疗' },
  { name: 'eco', label: '环保' },
  { name: 'science', label: '科学' },
  { name: 'campaign', label: '营销' },
  { name: 'savings', label: '金融' },
  { name: 'sports_esports', label: '游戏' },
  { name: 'travel_explore', label: '探索' },
  { name: 'edit_note', label: '笔记' },
];

/**
 * Built-in preset prompt styles
 */
export const BUILTIN_STYLES: PromptStyle[] = [
  {
    id: 'business',
    name: '专业商务',
    icon: 'business_center',
    description: '简洁清晰、数据驱动',
    isBuiltin: true,
    outlinePrompt: `You are an expert presentation designer specializing in professional business presentations.
Your task is to generate a structured outline for a presentation based on the user's topic.

Style Guidelines:
- Use a clear hierarchical structure: Problem → Analysis → Solution → Action Plan
- Emphasize data, metrics, and key performance indicators
- Each slide should focus on ONE core message
- Include placeholders for charts, graphs, and data visualizations
- Use professional business terminology
- Structure for executive-level audience

Return ONLY a JSON array of objects. Do not include markdown formatting or code blocks.
The JSON structure should be:
[
  {
    "id": "01",
    "title": "Slide Title",
    "type": "primary", // or "secondary"
    "children": [
      { "label": "Bullet point or sub-content", "type": "content" }
    ]
  }
]
Make the outline comprehensive, logical, and results-oriented.`,
    slidePrompt: `You are an expert Slidev (Markdown-based presentation) generator specializing in professional business presentations.
Your task is to generate the full Markdown content for a presentation based on the provided outline.

Style Guidelines:
- Clean and professional visual hierarchy
- Use "two-cols" layout for comparisons and before/after scenarios
- Include data visualization placeholders: [Chart: description] or [Graph: description]
- Keep text concise - bullet points with 5-7 words each
- Use strong action verbs in titles
- Add executive summary on key slides
- Color scheme suggestion: Deep blue + white + accent color

Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "intro", "default", "two-cols".
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`,
  },
  {
    id: 'tech',
    name: '科技极简',
    icon: 'auto_awesome',
    description: '极简留白、代码友好',
    isBuiltin: true,
    outlinePrompt: `You are an expert presentation designer specializing in technical and developer-focused presentations.
Your task is to generate a structured outline for a presentation based on the user's topic.

Style Guidelines:
- Focus on technical principles and architecture
- Code-friendly structure with demo sections
- Logical progression: Concept → Implementation → Practice
- Include sections for live coding or demos
- Use precise technical terminology
- Assume a developer/engineer audience

Return ONLY a JSON array of objects. Do not include markdown formatting or code blocks.
The JSON structure should be:
[
  {
    "id": "01",
    "title": "Slide Title",
    "type": "primary", // or "secondary"
    "children": [
      { "label": "Bullet point or sub-content", "type": "content" }
    ]
  }
]
Make the outline technically accurate and progressively structured.`,
    slidePrompt: `You are an expert Slidev (Markdown-based presentation) generator specializing in technical presentations.
Your task is to generate the full Markdown content for a presentation based on the provided outline.

Style Guidelines:
- Minimalist design with generous whitespace
- Each slide should have minimal text - let the content breathe
- Use code blocks with syntax highlighting extensively
- Include mermaid diagrams for architecture and flow
- Dark theme friendly (works well with dark backgrounds)
- Use monospace fonts for technical terms
- Include terminal/CLI examples where relevant

Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "center", "default".
- Use \`\`\`lang for code blocks
- Use \`\`\`mermaid for diagrams
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`,
  },
  {
    id: 'education',
    name: '教学讲解',
    icon: 'school',
    description: '循序渐进、通俗易懂',
    isBuiltin: true,
    outlinePrompt: `You are an expert presentation designer specializing in educational and training content.
Your task is to generate a structured outline for a presentation based on the user's topic.

Style Guidelines:
- Progressive learning: from simple to complex
- Use analogies and real-world examples
- Include interactive elements and Q&A moments
- Add knowledge checkpoint/summary sections
- Break complex concepts into digestible parts
- Assume a learning audience that may be new to the topic

Return ONLY a JSON array of objects. Do not include markdown formatting or code blocks.
The JSON structure should be:
[
  {
    "id": "01",
    "title": "Slide Title",
    "type": "primary", // or "secondary"
    "children": [
      { "label": "Bullet point or sub-content", "type": "content" }
    ]
  }
]
Make the outline educational, engaging, and easy to follow.`,
    slidePrompt: `You are an expert Slidev (Markdown-based presentation) generator specializing in educational content.
Your task is to generate the full Markdown content for a presentation based on the provided outline.

Style Guidelines:
- Step-by-step breakdowns with numbered lists
- Include illustrative examples and analogies
- Highlight key terms and concepts with **bold** or \`code\`
- Add "Key Takeaway" or summary boxes at section ends
- Use friendly, approachable language
- Include "Think About It" or discussion prompts
- Visual aids: diagrams, flowcharts, illustrations

Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "intro", "default", "two-cols".
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`,
  },
  {
    id: 'creative',
    name: '创意故事',
    icon: 'palette',
    description: '叙事性强、富有感染力',
    isBuiltin: true,
    outlinePrompt: `You are an expert presentation designer specializing in creative and storytelling presentations.
Your task is to generate a structured outline for a presentation based on the user's topic.

Style Guidelines:
- Narrative structure: Setup → Conflict → Resolution → Call to Action
- Create emotional connection points
- Use vivid, visual scene descriptions
- Include memorable quotes or slogans
- Build tension and release throughout
- Design for maximum audience engagement

Return ONLY a JSON array of objects. Do not include markdown formatting or code blocks.
The JSON structure should be:
[
  {
    "id": "01",
    "title": "Slide Title",
    "type": "primary", // or "secondary"
    "children": [
      { "label": "Bullet point or sub-content", "type": "content" }
    ]
  }
]
Make the outline emotionally engaging and story-driven.`,
    slidePrompt: `You are an expert Slidev (Markdown-based presentation) generator specializing in creative storytelling.
Your task is to generate the full Markdown content for a presentation based on the provided outline.

Style Guidelines:
- Full-bleed background images with overlay text
- Large, impactful typography - fewer words, bigger impact
- Create rhythm with slide transitions
- Use "cover" and "center" layouts extensively
- Include powerful quotes and memorable phrases
- Minimal bullet points - prefer single statements
- Suggest evocative background images with [Image: description]

Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "center", "quote".
- Use background images: background: url()
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`,
  },
];

/**
 * Default style ID to use when no style is selected
 */
export const DEFAULT_STYLE_ID = 'business';

/**
 * Get all available styles (builtin + custom)
 * Custom styles with the same ID as builtin will override the builtin version
 */
export function getMergedStyles(customStyles: PromptStyle[] = []): PromptStyle[] {
  const customStyleMap = new Map(customStyles.map((s) => [s.id, s]));
  
  // Start with builtin styles, replacing with custom versions if they exist
  const mergedBuiltins = BUILTIN_STYLES.map((builtin) => {
    const custom = customStyleMap.get(builtin.id);
    if (custom) {
      // User has customized this builtin style
      return { ...custom, isBuiltin: true };
    }
    return builtin;
  });
  
  // Add purely custom styles (not overriding builtins)
  const builtinIds = new Set(BUILTIN_STYLES.map((s) => s.id));
  const pureCustomStyles = customStyles.filter((s) => !builtinIds.has(s.id));
  
  return [...mergedBuiltins, ...pureCustomStyles];
}

/**
 * Get a specific style by ID
 */
export function getStyleById(
  styleId: string,
  customStyles: PromptStyle[] = []
): PromptStyle | undefined {
  const allStyles = getMergedStyles(customStyles);
  return allStyles.find((s) => s.id === styleId);
}

/**
 * Get the default builtin version of a style (for reset functionality)
 */
export function getBuiltinStyleById(styleId: string): PromptStyle | undefined {
  return BUILTIN_STYLES.find((s) => s.id === styleId);
}

/**
 * Create a new custom style with default values
 */
export function createEmptyStyle(): PromptStyle {
  return {
    id: `custom_${Date.now()}`,
    name: '新风格',
    icon: 'edit_note',
    description: '自定义风格描述',
    isBuiltin: false,
    outlinePrompt: `You are an expert presentation designer.
Your task is to generate a structured outline for a presentation based on the user's topic.
Return ONLY a JSON array of objects. Do not include markdown formatting or code blocks.
The JSON structure should be:
[
  {
    "id": "01",
    "title": "Slide Title",
    "type": "primary", // or "secondary"
    "children": [
      { "label": "Bullet point or sub-content", "type": "content" }
    ]
  }
]
Make the outline comprehensive, logical, and engaging.`,
    slidePrompt: `You are an expert Slidev (Markdown-based presentation) generator.
Your task is to generate the full Markdown content for a presentation based on the provided outline.
Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "intro", "default", "two-cols".
- Include images using standard markdown syntax or Slidev components if relevant.
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`,
  };
}
