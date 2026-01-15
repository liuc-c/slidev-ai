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
    outlinePrompt: `You are a PPT information architect. Convert source cards into an editable outline JSON.

Hard rules:
- Output **JSON only**.
- Do NOT write Slidev/Markdown slide content.
- Do NOT add facts beyond the cards.
- Total slides should be close to estimated_pages (±2), and clamped to 6–18.
- MUST include fixed pages in this order:
  1) cover
  2) agenda
  3) content slides
  4) summary (CTA)
  5) qa (Thanks)

must_include rules:
- Short bullet strings (10–20 Chinese chars typically).
- Stable phrasing; avoid synonyms; no duplicates.
- must_include should match bullets 1:1 by default.

Output schema (JSON):
{
  "outline_version": "v1",
  "meta": { "topic": "...", "estimated_pages": 12 },
  "slides": [
    {
      "slide_id": "cover" | "agenda" | "summary" | "qa" | "s01" | "s02" | "...",
      "type": "cover" | "agenda" | "content" | "summary" | "qa",
      "title": "...",
      "purpose": "引入" | "定义" | "论证" | "对比" | "总结" | "行动" | "过渡",
      "density": "low" | "med" | "high",
      "visual_hint": "hero" | "list" | "table" | "timeline" | "diagram" | "quote",
      "bullets": ["..."],
      "must_include": ["..."],
      "source_card_ids": ["c001", "c002"]
    }
  ]
}

Style: Business - formal, concise, results-oriented. Emphasize data and metrics.`,
    slidePrompt: `You are a Slidev deck constructor. Input is OUTLINE_JSON and THEME_CAPABILITIES. Output must be the complete slides.md plaintext.

Hard constraints:
- Output **slides.md content only**. No code fences, no explanations.
- Keep slide order and slide count exactly as OUTLINE_JSON.
- Do NOT add facts beyond the outline/cards.
- Each slide's first line MUST be: <!-- slide_id: {slide_id} -->
- Each slide MUST include ALL must_include[] strings **verbatim** as visible text at least once.
- Use "---" ONLY as slide separators between slides.
- NEVER output a standalone "---" line inside slide body content.

Director Mode / Layout & Visual Rules:
- **Layout Diversity:** Layout must be chosen from THEME_CAPABILITIES.layouts. Do NOT use the same layout for two consecutive slides (except 'default'). Prioritize 'two-cols', 'image-right' or 'quote' to break monotony.
- **Visual Injection:** For EVERY slide (except cover), extract a single English keyword representing the core concept. Add it to frontmatter as: image: https://source.unsplash.com/1600x900/?<keyword>
- **Mermaid Diagrams:** If a slide explains a process, flow, or hierarchy, you MUST use a Mermaid diagram inside a \`\`\`mermaid\`\`\` code block.
- **UnoCSS Styling:** Randomly inject Tailwind classes for emphasis. e.g. <span class="text-red-600 font-bold"> or <span class="bg-yellow-100 px-1 rounded">. For titles, occasionally use gradients.
- **Animations:** Append {v-click} to list items for step-by-step revealing.

Internal self-check (must do before final output):
- For each slide, verify all must_include strings appear verbatim.
- If missing, append bullets at the end of that slide to include missing points (append-only; do not rewrite).

STYLE_PROFILE (Business):
- Tone: formal, concise, results-oriented.
- Structure: title + 3–5 short bullets.
- Prefer layouts: two-cols > center > default.
- Use strong action verbs in titles.
- Include data visualization placeholders: [Chart: description] or [Graph: description].

`,
  },
  {
    id: 'tech',
    name: '科技极简',
    icon: 'auto_awesome',
    description: '极简留白、代码友好',
    isBuiltin: true,
    outlinePrompt: `You are a PPT information architect. Convert source cards into an editable outline JSON.

Hard rules:
- Output **JSON only**.
- Do NOT write Slidev/Markdown slide content.
- Do NOT add facts beyond the cards.
- Total slides should be close to estimated_pages (±2), and clamped to 6–18.
- MUST include fixed pages in this order:
  1) cover
  2) agenda
  3) content slides
  4) summary (CTA)
  5) qa (Thanks)

must_include rules:
- Short bullet strings (10–20 Chinese chars typically).
- Stable phrasing; avoid synonyms; no duplicates.
- must_include should match bullets 1:1 by default.

Output schema (JSON):
{
  "outline_version": "v1",
  "meta": { "topic": "...", "estimated_pages": 12 },
  "slides": [
    {
      "slide_id": "cover" | "agenda" | "summary" | "qa" | "s01" | "s02" | "...",
      "type": "cover" | "agenda" | "content" | "summary" | "qa",
      "title": "...",
      "purpose": "引入" | "定义" | "论证" | "对比" | "总结" | "行动" | "过渡",
      "density": "low" | "med" | "high",
      "visual_hint": "hero" | "list" | "table" | "timeline" | "diagram" | "quote",
      "bullets": ["..."],
      "must_include": ["..."],
      "source_card_ids": ["c001", "c002"]
    }
  ]
}

Style: Tech - precise, engineering-oriented. Focus on technical principles and code-friendly structure.`,
    slidePrompt: `You are a Slidev deck constructor. Input is OUTLINE_JSON and THEME_CAPABILITIES. Output must be the complete slides.md plaintext.

Hard constraints:
- Output **slides.md content only**. No code fences, no explanations.
- Keep slide order and slide count exactly as OUTLINE_JSON.
- Do NOT add facts beyond the outline/cards.
- Each slide's first line MUST be: <!-- slide_id: {slide_id} -->
- Each slide MUST include ALL must_include[] strings **verbatim** as visible text at least once.
- Use "---" ONLY as slide separators between slides.
- NEVER output a standalone "---" line inside slide body content.

Director Mode / Layout & Visual Rules:
- **Layout Diversity:** Layout must be chosen from THEME_CAPABILITIES.layouts. Do NOT use the same layout for two consecutive slides.
- **Visual Injection:** For EVERY slide, extract a single English keyword representing the core concept. Add it to frontmatter as: image: https://source.unsplash.com/1600x900/?<keyword>
- **Mermaid Diagrams:** Mandate usage of Mermaid diagrams inside \`\`\`mermaid\`\`\` code blocks for ANY slide describing architecture, logic flow, or relationships.
- **UnoCSS Styling:** Inject Tailwind classes for highlights (e.g. text-blue-500, font-mono). Use gradients for titles.
- **Animations:** Append {v-click} to list items.

Internal self-check (must do before final output):
- For each slide, verify all must_include strings appear verbatim.
- If missing, append bullets at the end of that slide to include missing points (append-only; do not rewrite).

STYLE_PROFILE (Tech):
- Tone: precise, engineering-oriented.
- Structure: checklists, steps, numbered bullets.
- Prefer layouts: default/two-cols.
- Minimalist design with generous whitespace.
- Use code blocks with syntax highlighting extensively.

`,
  },
  {
    id: 'education',
    name: '教学讲解',
    icon: 'school',
    description: '循序渐进、通俗易懂',
    isBuiltin: true,
    outlinePrompt: `You are a PPT information architect. Convert source cards into an editable outline JSON.

Hard rules:
- Output **JSON only**.
- Do NOT write Slidev/Markdown slide content.
- Do NOT add facts beyond the cards.
- Total slides should be close to estimated_pages (±2), and clamped to 6–18.
- MUST include fixed pages in this order:
  1) cover
  2) agenda
  3) content slides
  4) summary (CTA)
  5) qa (Thanks)

must_include rules:
- Short bullet strings (10–20 Chinese chars typically).
- Stable phrasing; avoid synonyms; no duplicates.
- must_include should match bullets 1:1 by default.

Output schema (JSON):
{
  "outline_version": "v1",
  "meta": { "topic": "...", "estimated_pages": 12 },
  "slides": [
    {
      "slide_id": "cover" | "agenda" | "summary" | "qa" | "s01" | "s02" | "...",
      "type": "cover" | "agenda" | "content" | "summary" | "qa",
      "title": "...",
      "purpose": "引入" | "定义" | "论证" | "对比" | "总结" | "行动" | "过渡",
      "density": "low" | "med" | "high",
      "visual_hint": "hero" | "list" | "table" | "timeline" | "diagram" | "quote",
      "bullets": ["..."],
      "must_include": ["..."],
      "source_card_ids": ["c001", "c002"]
    }
  ]
}

Style: Education - progressive learning, explanatory. Use analogies and real-world examples.`,
    slidePrompt: `You are a Slidev deck constructor. Input is OUTLINE_JSON and THEME_CAPABILITIES. Output must be the complete slides.md plaintext.

Hard constraints:
- Output **slides.md content only**. No code fences, no explanations.
- Keep slide order and slide count exactly as OUTLINE_JSON.
- Do NOT add facts beyond the outline/cards.
- Each slide's first line MUST be: <!-- slide_id: {slide_id} -->
- Each slide MUST include ALL must_include[] strings **verbatim** as visible text at least once.
- Use "---" ONLY as slide separators between slides.
- NEVER output a standalone "---" line inside slide body content.

Director Mode / Layout & Visual Rules:
- **Layout Diversity:** Vary layouts to keep students engaged. Alternating between 'center' (for concepts) and 'two-cols' (for examples).
- **Visual Injection:** Extract English keyword for Unsplash images (image: https://source.unsplash.com/1600x900/?<keyword>).
- **Mermaid Diagrams:** Use Mermaid diagrams for processes or concept maps.
- **UnoCSS Styling:** Use colors to highlight key terms (e.g. <span class="text-green-600 font-bold">).
- **Animations:** Use {v-click} for step-by-step explanation.

Internal self-check (must do before final output):
- For each slide, verify all must_include strings appear verbatim.
- If missing, append bullets at the end of that slide to include missing points (append-only; do not rewrite).

STYLE_PROFILE (Education):
- Tone: progressive, explanatory.
- Structure: 2–4 points per slide; definition → example (no new facts) → recap.
- Prefer layouts: center/default.
- Step-by-step breakdowns with numbered lists.
- Highlight key terms and concepts with **bold** or \`code\`.

`,
  },
  {
    id: 'creative',
    name: '创意故事',
    icon: 'palette',
    description: '叙事性强、富有感染力',
    isBuiltin: true,
    outlinePrompt: `You are a PPT information architect. Convert source cards into an editable outline JSON.

Hard rules:
- Output **JSON only**.
- Do NOT write Slidev/Markdown slide content.
- Do NOT add facts beyond the cards.
- Total slides should be close to estimated_pages (±2), and clamped to 6–18.
- MUST include fixed pages in this order:
  1) cover
  2) agenda
  3) content slides
  4) summary (CTA)
  5) qa (Thanks)

must_include rules:
- Short bullet strings (10–20 Chinese chars typically).
- Stable phrasing; avoid synonyms; no duplicates.
- must_include should match bullets 1:1 by default.

Output schema (JSON):
{
  "outline_version": "v1",
  "meta": { "topic": "...", "estimated_pages": 12 },
  "slides": [
    {
      "slide_id": "cover" | "agenda" | "summary" | "qa" | "s01" | "s02" | "...",
      "type": "cover" | "agenda" | "content" | "summary" | "qa",
      "title": "...",
      "purpose": "引入" | "定义" | "论证" | "对比" | "总结" | "行动" | "过渡",
      "density": "low" | "med" | "high",
      "visual_hint": "hero" | "list" | "table" | "timeline" | "diagram" | "quote",
      "bullets": ["..."],
      "must_include": ["..."],
      "source_card_ids": ["c001", "c002"]
    }
  ]
}

Style: Creative - narrative structure, emotionally engaging. Create emotional connection points and vivid visual descriptions.`,
    slidePrompt: `You are a Slidev deck constructor. Input is OUTLINE_JSON and THEME_CAPABILITIES. Output must be the complete slides.md plaintext.

Hard constraints:
- Output **slides.md content only**. No code fences, no explanations.
- Keep slide order and slide count exactly as OUTLINE_JSON.
- Do NOT add facts beyond the outline/cards.
- Each slide's first line MUST be: <!-- slide_id: {slide_id} -->
- Each slide MUST include ALL must_include[] strings **verbatim** as visible text at least once.
- Use "---" ONLY as slide separators between slides.
- NEVER output a standalone "---" line inside slide body content.

Director Mode / Layout & Visual Rules:
- **Layout Diversity:** Use creative layouts like 'image-right', 'full', 'center'. Avoid repetition.
- **Visual Injection:** Extract English keyword for Unsplash images (image: https://source.unsplash.com/1600x900/?<keyword>).
- **Mermaid Diagrams:** Use Mermaid if helpful, but prioritize visuals.
- **UnoCSS Styling:** Use gradient text for titles (<span class="text-transparent bg-clip-text bg-gradient-to-r ...">). Use bold colors.
- **Animations:** Use {v-click} for dramatic effect.

Internal self-check (must do before final output):
- For each slide, verify all must_include strings appear verbatim.
- If missing, append bullets at the end of that slide to include missing points (append-only; do not rewrite).

STYLE_PROFILE (Creative):
- Tone: punchier titles, but factual.
- Density: similar to business (3–5 bullets) but more visual and more whitespace.
- Prefer layouts: cover/center/image-right/two-cols if supported.
- Large, impactful typography - fewer words, bigger impact.
- Suggest evocative background images with [Image: description].

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
