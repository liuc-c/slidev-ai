import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

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

export async function generateOutline(
  config: any,
  topic: string,
  customOutlinePrompt?: string
) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customOutlinePrompt || OutlinePrompt;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: `Topic: ${topic}`,
  });

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
}

export async function generateSlides(
  config: any,
  outline: any[],
  customSlidePrompt?: string
) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customSlidePrompt || SlidePrompt;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: JSON.stringify(outline, null, 2),
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
  });
}
