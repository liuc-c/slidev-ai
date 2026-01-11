import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

export const OutlinePrompt = `You are an expert presentation designer.
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
Make the outline comprehensive, logical, and engaging.`;

export const SlidePrompt = `You are an expert Slidev (Markdown-based presentation) generator.
Your task is to generate the full Markdown content for a presentation based on the provided outline.
Use the following Slidev syntax conventions:
- Frontmatter at the top (theme: seriph, etc.)
- "---" to separate slides.
- "# Title" for slide titles.
- Use layouts like "cover", "intro", "default", "two-cols".
- Include images using standard markdown syntax or Slidev components if relevant.
- Return ONLY the raw markdown content. Do not wrap in code blocks.

Outline:
`;

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

export async function generateOutline(config: any, topic: string) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  const { text } = await generateText({
    model,
    system: OutlinePrompt,
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

export async function generateSlides(config: any, outline: any[]) {
  const provider = getProvider(config);
  const model = provider(config.ai.model);

  const { text } = await generateText({
    model,
    system: SlidePrompt,
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
