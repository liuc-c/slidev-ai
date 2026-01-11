<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { AppView } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { config } from '../../wailsjs/go/models';
import { getChatStream } from '../lib/ai';
import { tool } from 'ai';
import { z } from 'zod';

const props = defineProps<{
  activeView: string; // 'editor_code' or 'editor_ai'
  projectName: string;
  activeSlideIndex: number;
  slidevUrl?: string; // Passed from App.vue
  markdown: string;
}>();

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
  (e: 'update:markdown', value: string): void;
}>();

const mode = computed(() => props.activeView === AppView.EDITOR_CODE ? 'code' : 'ai');

// AI Configuration from backend
const aiConfig = ref<config.Config | null>(null);
const isConfigLoaded = ref(false);

// Chat state
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const messages = ref<ChatMessage[]>([
  { id: 'welcome', role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
]);
const input = ref('');
const isLoading = ref(false);

// System prompt with available tools
const systemPrompt = `你是 Slidev AI 助手，专门帮助用户编辑和优化演示文稿。回复时请使用中文，保持简洁友好。`;

// Tool definitions for Vercel AI SDK
const tools = {
  update_page: tool({
    description: '更新指定页面的 Markdown 内容',
    parameters: z.object({
      pageIndex: z.number().describe('页面索引（从0开始）'),
      markdown: z.string().describe('新的 Markdown 内容'),
    }),
    execute: async ({ pageIndex, markdown }) => {
      await App.UpdatePage(pageIndex, markdown);
      return `✅ 已更新第 ${pageIndex + 1} 页`;
    },
  }),
  insert_page: tool({
    description: '在指定位置后插入新页面',
    parameters: z.object({
      afterIndex: z.number().describe('在此索引之后插入（从0开始）'),
      layout: z.string().describe('页面布局类型（default, center, two-cols 等）'),
    }),
    execute: async ({ afterIndex, layout }) => {
      await App.InsertPage(afterIndex, layout);
      return `✅ 已在第 ${afterIndex + 1} 页后插入新页面`;
    },
  }),
  apply_theme: tool({
    description: '应用全局主题到演示文稿',
    parameters: z.object({
      themeName: z.string().describe('主题名称（seriph, apple-basic, default 等）'),
    }),
    execute: async ({ themeName }) => {
      await App.ApplyTheme(themeName);
      return `✅ 已应用主题: ${themeName}`;
    },
  }),
};

// Send message to AI using SDK
const handleSubmit = async (e?: Event) => {
  if (e) e.preventDefault();
  if (!input.value.trim() || isLoading.value) return;
  
  if (!aiConfig.value?.ai?.apiKey) {
    alert('请先在设置中配置 AI API Key');
    return;
  }
  
  const userMessage = input.value.trim();
  input.value = '';
  
  // Add user message
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userMessage
  });
  
  isLoading.value = true;
  
  try {
    // Build messages for SDK
    const history = messages.value.map(m => ({ role: m.role, content: m.content }));
    const apiMessages = [
      ...history.slice(0, -1),
      { role: 'user' as const, content: `当前幻灯片内容：\n\`\`\`markdown\n${props.markdown}\n\`\`\`\n\n用户请求：${userMessage}` }
    ];
    
    const result = await getChatStream(aiConfig.value, apiMessages, systemPrompt, tools);
    
    let fullContent = '';
    const assistantMsgId = (Date.now() + 1).toString();
    messages.value.push({
      id: assistantMsgId,
      role: 'assistant',
      content: ''
    });

    for await (const delta of result.textStream) {
      fullContent += delta;
      const msg = messages.value.find(m => m.id === assistantMsgId);
      if (msg) msg.content = fullContent;
    }

    const finalResult = await result.toDataStreamResponse(); // This ensures tools are executed and resolved
    // Since we're using execute in tools, they run during the stream processing if supported or after.
    // Wait for all tool executions to finish
    await result.steps;
    
    // Refresh markdown after potential tool execution
    const newContent = await App.ReadSlides();
    emit('update:markdown', newContent);

  } catch (error) {
    console.error('AI request failed:', error);
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `❌ 请求失败: ${error}`
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    aiConfig.value = await App.GetSettings();
    isConfigLoaded.value = true;
  } catch (e) {
    console.error("Failed to get settings", e);
  }
});

// Computed for preview
const previewData = computed(() => {
  if (!props.markdown) return { title: '无内容', description: '', count: 0 };
  const slides = props.markdown.split('---').map(s => s.trim()).filter(s => s);
  const contentSlides = slides.filter(s => !s.startsWith('theme:'));

  const contentSlide = contentSlides[props.activeSlideIndex] || contentSlides[0];
  if (!contentSlide) return { title: '无标题', description: '', count: contentSlides.length };

  const lines = contentSlide.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') ||
                lines.find(l => l.startsWith('## '))?.replace('## ', '') || 'Slidev Studio';
  const description = lines.find(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('layout:')) || '';

  return { title, description, count: contentSlides.length };
});

</script>

<template>
  <div class="flex-1 flex overflow-hidden">
    <!-- Preview Section -->
    <section class="flex-[3] flex flex-col bg-[#161d2b] relative border-r border-border-dark overflow-hidden">
      <div class="flex items-center justify-between px-6 py-3 border-b border-border-dark bg-panel-dark/30">
        <div class="flex items-center gap-4">
          <span class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">实时预览</span>
          <div class="h-4 w-px bg-border-dark"></div>
          <span class="text-[10px] text-[#90a4cb] font-bold">页面 {{ activeSlideIndex + 1 }} / {{ previewData.count }}</span>
        </div>
        <div class="flex items-center gap-2 text-[#90a4cb]">
          <button class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span class="material-symbols-outlined text-lg">desktop_windows</span></button>
          <button class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span class="material-symbols-outlined text-lg">refresh</span></button>
        </div>
      </div>

      <div class="flex-1 bg-[#0b0f1a] overflow-hidden relative">
          <iframe
            v-if="slidevUrl"
            :src="`${slidevUrl}/${activeSlideIndex+1}`"
            class="w-full h-full border-none"
            allow="fullscreen; clipboard-write"
          ></iframe>
          <div v-else class="flex items-center justify-center h-full text-slate-500">
             <div class="flex flex-col items-center gap-4">
                 <span class="material-symbols-outlined text-4xl animate-spin">sync</span>
                 <p>启动 Slidev 预览服务中...</p>
             </div>
          </div>
      </div>
    </section>

    <!-- Code Editor -->
    <template v-if="mode === 'code'">
      <section class="flex-[2] flex flex-col bg-[#0b0f1a]">
        <div class="flex border-b border-border-dark bg-background-dark/50">
          <div class="flex items-center gap-2 px-4 py-3 border-r border-border-dark bg-[#0b0f1a] border-t-2 border-t-primary">
            <span class="material-symbols-outlined text-primary text-sm">description</span>
            <span class="text-xs font-bold text-white">{{ projectName }}</span>
          </div>
        </div>
        <div class="flex-1 flex overflow-hidden font-mono text-[13px]">
          <div class="w-12 py-4 flex flex-col items-center text-[#314368] select-none bg-[#0b0f1a] border-r border-border-dark/30">
            <span v-for="i in 40" :key="i" :class="i > 30 ? 'opacity-20' : ''">{{ i }}</span>
          </div>
          <textarea
            :value="markdown"
            @input="(e) => emit('update:markdown', (e.target as HTMLTextAreaElement).value)"
            class="flex-1 bg-transparent border-none focus:ring-0 text-[#79c0ff] p-4 resize-none leading-relaxed custom-scrollbar whitespace-pre font-mono"
            spellcheck="false"
          ></textarea>
        </div>
      </section>
    </template>

    <!-- AI Panel -->
    <template v-if="mode === 'ai'">
      <aside class="flex-[2] flex flex-col bg-panel-dark">
        <div class="flex border-b border-border-dark px-4 shrink-0 h-14">
          <div class="flex-1 flex flex-col items-center justify-center border-b-[3px] border-primary text-white shadow-[0_4px_12px_rgba(13,89,242,0.1)]">
            <p class="text-xs font-bold tracking-widest flex items-center gap-2 uppercase">
              <span class="material-symbols-outlined text-[18px]">forum</span>
              AI 协作
            </p>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          <!-- Config warning -->
          <div v-if="isConfigLoaded && !aiConfig?.ai?.apiKey" class="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-amber-300 text-sm">
            <span class="material-symbols-outlined text-lg align-middle mr-2">warning</span>
            请先在设置中配置 AI API Key
          </div>

          <div v-for="msg in messages" :key="msg.id" :class="`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`">
            <div v-if="msg.role === 'assistant'" class="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
              <span class="material-symbols-outlined text-[20px]">memory</span>
            </div>
            <div class="flex flex-col gap-1 max-w-[85%]">
              <div :class="`p-4 rounded-xl text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-[#222f49] text-slate-200 rounded-tl-none'
              }`">
                  {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="isLoading" class="flex justify-start items-start gap-3">
            <div class="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
              <span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            </div>
            <div class="bg-[#222f49] text-slate-400 p-4 rounded-xl rounded-tl-none text-sm">
              思考中...
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-border-dark bg-background-dark/30 shrink-0">
          <form @submit="handleSubmit" class="relative">
            <textarea
              v-model="input"
              @keydown.enter.prevent="!$event.shiftKey && handleSubmit($event)"
              class="w-full bg-[#0a0f18] border border-border-dark rounded-xl p-4 pr-12 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600 resize-none font-sans min-h-[100px] shadow-inner"
              placeholder="尝试说：'把标题改成赛博朋克风格'..."
              :disabled="!aiConfig?.ai?.apiKey"
            ></textarea>
            <button
              type="submit"
              :disabled="!aiConfig?.ai?.apiKey || isLoading"
              class="absolute bottom-3 right-3 bg-primary text-white size-10 rounded-lg flex items-center justify-center hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-[22px]">send</span>
            </button>
          </form>
        </div>
      </aside>
    </template>
  </div>
</template>
