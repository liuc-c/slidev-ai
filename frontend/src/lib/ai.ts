import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText, stepCountIs } from 'ai';

import { BUILTIN_STYLES, DEFAULT_STYLE_ID, getStyleById } from './prompts';
import type { PromptStyle } from '../types';

// Default prompts (fallback to business style)
export const OutlinePrompt = BUILTIN_STYLES[0].outlinePrompt;
export const SlidePrompt = BUILTIN_STYLES[0].slidePrompt;

export function getProvider(config: any) {
  const { provider, apiKey, baseUrl } = config.ai;

  switch (provider) {
    case 'openai':
      return createOpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
      });
    case 'anthropic':
      return createAnthropic({
        apiKey,
      });
    case 'google':
      return createGoogleGenerativeAI({
        apiKey,
      });
    case 'openai-compatible':
      return createOpenAICompatible({
        name: 'custom',
        apiKey,
        baseURL: baseUrl,
      });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Preprocessor: Extract source cards from long text
 * Returns cards[] with card_id, quote, tags, importance
 */
export async function preprocessText(config: any, text: string) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  const systemPrompt = `You are an information extractor for slide authoring.

Rules:
- Only use information explicitly present in the user text.
- Do NOT add new facts, numbers, examples, or claims.
- Output **JSON only**. No explanations.
- Each card quote must be a direct excerpt from the user text.

Output schema (JSON):
{
  "cards": [
    {
      "card_id": "c001",
      "quote": "<direct excerpt>",
      "tags": ["..."],
      "importance": "high" | "medium" | "low"
    }
  ]
}`;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 300000);

  try {
    const { text: response } = await generateText({
      model,
      system: systemPrompt,
      prompt: `USER_TEXT:\n${text}`,
      abortSignal: abortController.signal,
    });

    clearTimeout(timeoutId);

    let content = response.trim();
    if (content.startsWith('```')) {
      const lines = content.split('\n');
      content = lines.slice(1, -1).join('\n');
      if (content.startsWith('json')) {
        content = content.substring(4).trim();
      }
    }

    try {
      const result = JSON.parse(content);
      return result.cards || [];
    } catch (e) {
      console.error('Failed to parse preprocessor response:', content);
      throw new Error('预处理器返回了数据，但格式不正确，请重试');
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('预处理响应超时（60秒），请检查网络或 API 配置后重试');
    }
    throw e;
  }
}

/**
 * Estimate page count based on number of cards
 * Clamped to [6, 18] range
 */
export function estimatePageCount(cardsCount: number): number {
  // Rough heuristic: ~2-3 cards per content slide
  // Fixed pages: cover + agenda + summary + qa = 4
  // Content slides = cardsCount / 2.5
  const contentSlides = Math.round(cardsCount / 2.5);
  const totalPages = 4 + contentSlides;
  
  // Clamp to [6, 18]
  return Math.max(6, Math.min(18, totalPages));
}

export async function generateOutline(
  config: any,
  cards: any[],
  estimatedPages: number,
  customOutlinePrompt?: string
) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customOutlinePrompt || OutlinePrompt;

  // 添加 60 秒超时
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 300000);

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: `CARDS_JSON:\n${JSON.stringify(cards, null, 2)}\n\nestimated_pages: ${estimatedPages}`,
      abortSignal: abortController.signal,
    });

    clearTimeout(timeoutId);

    let content = text.trim();
    if (content.startsWith('```')) {
      const lines = content.split('\n');
      content = lines.slice(1, -1).join('\n');
      // If it still has JSON tag
      if (content.startsWith('json')) {
          content = content.substring(4).trim();
      }
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI 返回了大纲，但格式不正确，请重试');
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('AI 响应超时（5分钟），请检查网络或 API 配置后重试');
    }
    throw e;
  }
}

export async function generateSlides(
  config: any,
  outline: any,
  theme: string = 'default',
  customSlidePrompt?: string
) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  // Theme Capabilities (Layouts)
  const THEME_LAYOUTS: Record<string, string[]> = {
    'default': ['cover', 'intro', 'center', 'default', 'two-cols', 'end', 'full'],
    'seriph': ['cover', 'intro', 'center', 'default', 'two-cols', 'end', 'quote', 'image-right'],
  };

  const layouts = THEME_LAYOUTS[theme] || THEME_LAYOUTS['default'];
  const themeCapabilities = {
    layouts,
  };

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customSlidePrompt || SlidePrompt;

  // Build user prompt with structured context
  const userPrompt = `OUTLINE_JSON:
${JSON.stringify(outline, null, 2)}

THEME_CAPABILITIES:
${JSON.stringify(themeCapabilities, null, 2)}

IMPORTANT: You MUST use "theme: ${theme}" in the frontmatter.`;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
  });

  let content = text.trim();
  if (content.startsWith('```')) {
    const lines = content.split('\n');
    content = lines.slice(1, -1).join('\n');
    if (content.startsWith('markdown')) {
        content = content.substring(8).trim();
    }
  }

  return content;
}

export function getChatStream(config: any, messages: any[], system: string, tools: any) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  return streamText({
    model,
    system,
    messages,
    tools,
    stopWhen: stepCountIs(20), // 允许最多20轮工具调用，让 AI 能够执行工具后继续对话
  });
}

// Coverage Validator Types
export interface CoverageReport {
  outline_version: string;
  summary: {
    total_outline_slides: number;
    total_deck_slides: number;
    missing_slide_count: number;
    missing_point_count: number;
  };
  missing_slides: Array<{
    slide_id: string;
    expected_index: number;
    title: string;
    must_include: string[];
    reason: string;
  }>;
  missing_points: Array<{
    slide_id: string;
    page_index: number;
    title: string;
    missing: string[];
    evidence: {
      matched_points: string[];
      checked_text_excerpt: string;
    };
  }>;
  proposed_patches: Array<{
    patch_id: string;
    type: 'append_bullets' | 'insert_slide';
    slide_id: string;
    page_index?: number;
    append_position?: 'slide_end';
    append?: string[];
    insert_at_index?: number;
    markdown?: string;
    confidence: 'high' | 'medium' | 'low';
    explain: string;
  }>;
  notes: string[];
}

/**
 * Parse slides markdown and extract slide_id anchors
 * Returns array of { slideId, content, index }
 */
function parseSlidesMarkdown(slidesMarkdown: string): Array<{ slideId: string; content: string; index: number }> {
  // Split by --- separator (must be on its own line)
  const slides = slidesMarkdown.split(/\n---\n/);
  const result: Array<{ slideId: string; content: string; index: number }> = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i].trim();
    if (!slide) continue;

    // Extract slide_id from anchor comment
    const slideIdMatch = slide.match(/<!--\s*slide_id:\s*([^\s]+)\s*-->/);
    if (slideIdMatch) {
      result.push({
        slideId: slideIdMatch[1],
        content: slide,
        index: i,
      });
    } else {
      // Slide without id - assign a generated id
      result.push({
        slideId: `unknown-${i}`,
        content: slide,
        index: i,
      });
    }
  }

  return result;
}

/**
 * Check if a must_include string is present verbatim in the slide content
 */
function containsVerbatim(slideContent: string, mustInclude: string): boolean {
  // Remove the slide_id anchor comment for checking
  const contentWithoutAnchor = slideContent.replace(/<!--\s*slide_id:.*?-->\s*/g, '');
  return contentWithoutAnchor.includes(mustInclude);
}

/**
 * Validate coverage: check if all outline slides and must_include points are present
 * Returns a structured CoverageReport with proposed patches
 */
export function validateCoverage(outline: any, slidesMarkdown: string): CoverageReport {
  const outlineVersion = outline.outline_version || 'v1';
  const outlineSlides = outline.slides || [];
  
  // Parse slides markdown into structured data
  const deckSlides = parseSlidesMarkdown(slidesMarkdown);
  
  // Create a map for quick lookup
  const deckSlidesMap = new Map<string, { slideId: string; content: string; index: number }>();
  deckSlides.forEach(slide => {
    deckSlidesMap.set(slide.slideId, slide);
  });

  // Track issues
  const missingSlides: CoverageReport['missing_slides'] = [];
  const missingPoints: CoverageReport['missing_points'] = [];
  const proposedPatches: CoverageReport['proposed_patches'] = [];
  const notes: string[] = [];

  let patchCounter = 1;

  // Check each outline slide
  outlineSlides.forEach((outlineSlide: any, index: number) => {
    const slideId = outlineSlide.slide_id;
    const mustIncludePoints = outlineSlide.must_include || [];
    const title = outlineSlide.title || '';

    // Check if slide exists in deck
    const deckSlide = deckSlidesMap.get(slideId);

    if (!deckSlide) {
      // Missing slide entirely
      missingSlides.push({
        slide_id: slideId,
        expected_index: index,
        title,
        must_include: mustIncludePoints,
        reason: `Slide with id "${slideId}" not found in generated deck`,
      });

      // Propose insert_slide patch
      const minimalMarkdown = `<!-- slide_id: ${slideId} -->
# ${title}

${mustIncludePoints.map((point: string) => `- ${point}`).join('\n')}`;

      proposedPatches.push({
        patch_id: `patch-${String(patchCounter++).padStart(3, '0')}`,
        type: 'insert_slide',
        slide_id: slideId,
        insert_at_index: index,
        markdown: minimalMarkdown,
        confidence: 'high',
        explain: `Insert missing slide "${title}" at expected position ${index}`,
      });
    } else {
      // Slide exists, check if all must_include points are present
      const missing: string[] = [];
      const matched: string[] = [];

      mustIncludePoints.forEach((point: string) => {
        if (containsVerbatim(deckSlide.content, point)) {
          matched.push(point);
        } else {
          missing.push(point);
        }
      });

      if (missing.length > 0) {
        // Extract excerpt for evidence (first 200 chars of content without anchor)
        const contentWithoutAnchor = deckSlide.content.replace(/<!--\s*slide_id:.*?-->\s*/g, '');
        const excerpt = contentWithoutAnchor.substring(0, 200).trim();

        missingPoints.push({
          slide_id: slideId,
          page_index: deckSlide.index,
          title,
          missing,
          evidence: {
            matched_points: matched,
            checked_text_excerpt: excerpt + (contentWithoutAnchor.length > 200 ? '...' : ''),
          },
        });

        // Propose append_bullets patch
        proposedPatches.push({
          patch_id: `patch-${String(patchCounter++).padStart(3, '0')}`,
          type: 'append_bullets',
          slide_id: slideId,
          page_index: deckSlide.index,
          append_position: 'slide_end',
          append: missing,
          confidence: 'high',
          explain: `Append ${missing.length} missing point(s) to slide "${title}"`,
        });
      }
    }
  });

  // Build summary
  const summary = {
    total_outline_slides: outlineSlides.length,
    total_deck_slides: deckSlides.length,
    missing_slide_count: missingSlides.length,
    missing_point_count: missingPoints.reduce((sum, mp) => sum + mp.missing.length, 0),
  };

  // Add notes if everything is clean
  if (missingSlides.length === 0 && missingPoints.length === 0) {
    notes.push('✓ Coverage validation passed: all slides and must_include points are present.');
  } else {
    notes.push(`Coverage issues detected: ${missingSlides.length} missing slide(s), ${summary.missing_point_count} missing point(s).`);
  }

  return {
    outline_version: outlineVersion,
    summary,
    missing_slides: missingSlides,
    missing_points: missingPoints,
    proposed_patches: proposedPatches,
    notes,
  };
}
