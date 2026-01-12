<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AiMode } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { config } from '../../wailsjs/go/models';
import { getChatStream, generateOutline as aiGenerateOutline, generateSlides as aiGenerateSlides } from '../lib/ai';
import { tool } from 'ai';
import { z } from 'zod';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';
import type { OutlineItem } from '../types';

const props = defineProps<{
  activeView: string;
  projectName: string;
  activeSlideIndex: number;
  slidevUrl?: string;
  markdown: string;
  aiMode: AiMode;
}>();

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
  (e: 'update:markdown', value: string): void;
  (e: 'update:activeSlideIndex', index: number): void;
  (e: 'update:aiMode', mode: AiMode): void;
}>();

// AI Configuration from backend
const aiConfig = ref<config.Config | null>(null);
const isConfigLoaded = ref(false);

// ========== PPT AI State ==========
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const messages = ref<ChatMessage[]>([
  { id: 'welcome', role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色当前页内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
]);
const input = ref('');
const isLoading = ref(false);

// ========== Outline AI State ==========
const outlineSteps = ref<OutlineItem[]>([]);
const outlineTopic = ref('');
const outlineLoading = ref(false);
const outlineLoadingMessage = ref('');

// Helper: Get current slide content
const getCurrentSlideContent = computed(() => {
  if (!props.markdown) return '';
  
  const rawSlides = props.markdown.split(/^---$/m);
  let startIndex = 0;
  if (props.markdown.trim().startsWith('---')) {
    startIndex = 2;
  }
  
  const allParts = rawSlides.map(s => s.trim());
  const actualSlides = allParts.slice(startIndex).filter(s => s.length > 0);
  
  return actualSlides[props.activeSlideIndex] || '';
});

// System prompt for PPT AI - focused on current page
const systemPrompt = computed(() => `你是 Slidev AI 助手，专门帮助用户编辑和优化演示文稿。
当前用户正在编辑第 ${props.activeSlideIndex + 1} 页。
默认情况下，你的修改只针对当前页（第 ${props.activeSlideIndex + 1} 页）。
如果用户明确要求修改其他页面或全局设置，再使用对应的页面索引。
回复时请使用中文，保持简洁友好。`);

// Tool definitions for Vercel AI SDK
const tools = computed(() => ({
  update_page: tool({
    description: '更新指定页面的 Markdown 内容',
    parameters: z.object({
      pageIndex: z.number().describe('页面索引（从0开始）'),
      markdown: z.string().describe('新的 Markdown 内容'),
    }),
    execute: async ({ pageIndex, markdown }) => {
      await App.UpdatePage(props.projectName, pageIndex, markdown);
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
      await App.InsertPage(props.projectName, afterIndex, layout);
      return `✅ 已在第 ${afterIndex + 1} 页后插入新页面`;
    },
  }),
  apply_theme: tool({
    description: '应用全局主题到演示文稿',
    parameters: z.object({
      themeName: z.string().describe('主题名称（seriph, apple-basic, default 等）'),
    }),
    execute: async ({ themeName }) => {
      await App.ApplyTheme(props.projectName, themeName);
      return `✅ 已应用主题: ${themeName}`;
    },
  }),
}));

// ========== PPT AI: Send message ==========
const handleSubmit = async (e?: Event) => {
  if (e) e.preventDefault();
  if (!input.value.trim() || isLoading.value) return;
  
  if (!aiConfig.value?.ai?.apiKey) {
    alert('请先在设置中配置 AI API Key');
    return;
  }
  
  const userMessage = input.value.trim();
  input.value = '';
  
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userMessage
  });
  
  isLoading.value = true;
  
  try {
    const history = messages.value.map(m => ({ role: m.role, content: m.content }));
    // Only send current page content, not entire markdown
    const apiMessages = [
      ...history.slice(0, -1),
      { role: 'user' as const, content: `当前页（第 ${props.activeSlideIndex + 1} 页）内容：\n\`\`\`markdown\n${getCurrentSlideContent.value}\n\`\`\`\n\n用户请求：${userMessage}` }
    ];
    
    const result = await getChatStream(aiConfig.value, apiMessages, systemPrompt.value, tools.value);
    
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

    await result.toDataStreamResponse(); 
    await result.steps;
    
    // Refresh markdown after potential tool execution
    const newContent = await App.ReadSlides(props.projectName);
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

// ========== Outline AI: Generate outline ==========
const generateOutline = async () => {
  if (!outlineTopic.value) return;
  if (!aiConfig.value?.ai?.apiKey) {
    alert("请先在设置中配置 AI API Key");
    return;
  }

  outlineLoading.value = true;
  outlineLoadingMessage.value = 'AI 正在构思大纲...';
  try {
    outlineSteps.value = await aiGenerateOutline(aiConfig.value, outlineTopic.value);
  } catch (e: any) {
    console.error(e);
    alert(e.message || "大纲生成失败");
  } finally {
    outlineLoading.value = false;
  }
};

// ========== Outline AI: Generate slides and overwrite ==========
const handleGenerateSlides = async () => {
  if (outlineSteps.value.length === 0) return;
  if (!aiConfig.value?.ai?.apiKey) {
    alert("请先在设置中配置 AI API Key");
    return;
  }

  // Confirm overwrite
  if (!confirm('确认生成幻灯片？这将覆盖当前 slides.md 文件。')) {
    return;
  }

  outlineLoading.value = true;
  outlineLoadingMessage.value = 'AI 正在撰写幻灯片内容...';

  try {
    const content = await aiGenerateSlides(aiConfig.value, outlineSteps.value);
    await App.SaveSlides(props.projectName, content);
    
    // Refresh markdown and reset slide index
    const newContent = await App.ReadSlides(props.projectName);
    emit('update:markdown', newContent);
    emit('update:activeSlideIndex', 0);
    
    // Switch to PPT AI mode to see result
    emit('update:aiMode', 'ppt');
  } catch (e: any) {
    console.error(e);
    alert(e.message || "幻灯片生成失败");
  } finally {
    outlineLoading.value = false;
  }
};

const addOutlineStep = () => {
  const newId = (outlineSteps.value.length + 1).toString().padStart(2, '0');
  outlineSteps.value.push({
    id: newId,
    title: '',
    type: 'secondary',
    children: []
  });
};

const removeOutlineStep = (id: string) => {
  outlineSteps.value = outlineSteps.value.filter(s => s.id !== id);
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
    <!-- Loading Overlay for Outline AI -->
    <div v-if="outlineLoading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
      <p class="text-white font-bold animate-pulse">{{ outlineLoadingMessage }}</p>
    </div>

    <!-- Preview Section -->
    <section class="flex-[3] flex flex-col bg-[#161d2b] relative border-r border-border-dark overflow-hidden">
      <div class="flex items-center justify-between px-6 py-3 border-b border-border-dark bg-panel-dark/30">
        <div class="flex items-center gap-4">
          <span class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">实时预览</span>
          <div class="h-4 w-px bg-border-dark"></div>
          <span class="text-[10px] text-[#90a4cb] font-bold">页面 {{ activeSlideIndex + 1 }} / {{ previewData.count }}</span>
        </div>
        <div class="flex items-center gap-2 text-[#90a4cb]">
          <button 
            v-if="slidevUrl"
            @click="BrowserOpenURL(`${slidevUrl}/${activeSlideIndex+1}`)"
            class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"
            title="在浏览器中打开"
          >
            <span class="material-symbols-outlined text-lg">open_in_new</span>
          </button>
        </div>
      </div>

      <div class="flex-1 bg-[#0b0f1a] overflow-hidden relative flex flex-col items-center justify-center">
          <iframe v-if="slidevUrl" :src="`${slidevUrl}/${activeSlideIndex+1}`" class="w-full h-full border-none" allow="fullscreen; clipboard-write"></iframe>
          
          <template v-else>
             <div class="flex flex-col items-center gap-6 animate-pulse">
                 <div class="relative">
                    <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <span class="material-symbols-outlined text-5xl text-primary animate-spin relative z-10">sync</span>
                 </div>
                 <p class="text-slate-500 text-sm font-medium tracking-wider uppercase">启动预览服务中...</p>
             </div>
          </template>
      </div>
    </section>

    <!-- AI Panel (Always visible) -->
    <aside class="flex-[2] flex flex-col bg-panel-dark">
      <!-- AI Mode Tabs -->
      <div class="flex border-b border-border-dark shrink-0 h-14">
        <button 
          @click="emit('update:aiMode', 'ppt')"
          :class="`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
            aiMode === 'ppt' 
              ? 'border-b-[3px] border-primary text-white bg-background-dark/20' 
              : 'text-[#90a4cb] hover:text-white hover:bg-white/5'
          }`"
        >
          <span class="material-symbols-outlined text-[18px]">forum</span>
          PPT 编辑
        </button>
        <button 
          @click="emit('update:aiMode', 'outline')"
          :class="`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
            aiMode === 'outline' 
              ? 'border-b-[3px] border-primary text-white bg-background-dark/20' 
              : 'text-[#90a4cb] hover:text-white hover:bg-white/5'
          }`"
        >
          <span class="material-symbols-outlined text-[18px]">account_tree</span>
          大纲生成
        </button>
      </div>

      <!-- PPT AI Panel -->
      <template v-if="aiMode === 'ppt'">
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          <!-- Config warning -->
          <div v-if="isConfigLoaded && !aiConfig?.ai?.apiKey" class="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-amber-300 text-sm">
            <span class="material-symbols-outlined text-lg align-middle mr-2">warning</span>
            请先在设置中配置 AI API Key
          </div>

          <!-- Current page indicator -->
          <div class="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-base">info</span>
            当前正在编辑第 {{ activeSlideIndex + 1 }} 页
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
      </template>

      <!-- Outline AI Panel -->
      <template v-if="aiMode === 'outline'">
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          <!-- Config warning -->
          <div v-if="isConfigLoaded && !aiConfig?.ai?.apiKey" class="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-amber-300 text-sm">
            <span class="material-symbols-outlined text-lg align-middle mr-2">warning</span>
            请先在设置中配置 AI API Key
          </div>

          <!-- AI Assistant Message -->
          <div class="flex items-start gap-3">
            <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shrink-0">
              <span class="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div class="bg-slate-800/80 border border-border-dark p-4 rounded-xl text-xs leading-relaxed text-slate-300 shadow-md">
              你好！我是大纲生成助手。请输入你想要生成的演示文稿主题。
            </div>
          </div>

          <!-- Example topics -->
          <div v-if="outlineSteps.length === 0" class="flex flex-col gap-3">
            <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">示例主题</h4>
            <div class="flex flex-col gap-2">
              <button @click="outlineTopic='React Hooks 深度解析'; generateOutline()" class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                React Hooks 深度解析
              </button>
              <button @click="outlineTopic='Q4 产品路线图'; generateOutline()" class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
                Q4 产品路线图
              </button>
            </div>
          </div>

          <!-- Outline Steps -->
          <div v-if="outlineSteps.length > 0" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">
                共 {{ outlineSteps.length }} 个幻灯片节点
              </span>
              <button 
                @click="outlineSteps = []" 
                class="text-[10px] text-slate-500 hover:text-white transition-colors"
              >
                清空重来
              </button>
            </div>

            <div v-for="step in outlineSteps" :key="step.id" class="flex flex-col gap-2 group">
              <div class="flex items-center gap-3">
                <div :class="`size-6 rounded ${step.type === 'primary' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-[10px] font-bold shrink-0`">
                  {{ step.id }}
                </div>
                <div class="flex-1 bg-panel-dark border border-border-dark px-3 py-2 rounded-lg flex items-center justify-between hover:border-primary/50 transition-all">
                  <input
                    type="text"
                    v-model="step.title"
                    class="bg-transparent border-none focus:ring-0 text-xs font-bold text-white w-full placeholder:text-slate-700"
                    placeholder="幻灯片标题..."
                  />
                  <button
                    @click="removeOutlineStep(step.id)"
                    class="text-slate-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    title="删除节点"
                  >
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div v-if="step.children.length > 0" class="ml-9 pl-3 border-l border-border-dark/50 flex flex-col gap-1">
                <div v-for="(child, idx) in step.children" :key="idx" class="text-[10px] text-slate-500 italic">
                  {{ child.label }}
                </div>
              </div>
            </div>

            <button
              @click="addOutlineStep"
              class="w-fit flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-dashed border-border-dark text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span class="material-symbols-outlined text-[14px]">add_circle</span>
              添加节点
            </button>
          </div>
        </div>

        <!-- Outline Input & Generate Button -->
        <div class="p-4 border-t border-border-dark bg-background-dark/30 shrink-0 flex flex-col gap-3">
          <div class="relative">
            <textarea
              v-model="outlineTopic"
              @keydown.enter.prevent="generateOutline"
              class="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-xs text-white focus:ring-1 focus:ring-primary placeholder:text-slate-600 resize-none h-20 shadow-inner"
              placeholder="输入主题，例如：'Golang 并发编程'..."
              :disabled="!aiConfig?.ai?.apiKey"
            ></textarea>
            <button
              @click="generateOutline"
              :disabled="!aiConfig?.ai?.apiKey || !outlineTopic.trim()"
              class="absolute bottom-3 right-3 bg-primary/20 text-primary size-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-base">auto_awesome</span>
            </button>
          </div>

          <button
            v-if="outlineSteps.length > 0"
            @click="handleGenerateSlides"
            class="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95"
          >
            确认并生成幻灯片
            <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
          </button>
          <p v-if="outlineSteps.length > 0" class="text-[9px] text-slate-500 text-center uppercase tracking-widest">
            将覆盖当前 slides.md 内容
          </p>
        </div>
      </template>
    </aside>
  </div>
</template>
