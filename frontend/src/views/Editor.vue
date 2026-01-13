<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { AppView } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { config } from '../../wailsjs/go/models';
import { getChatStream } from '../lib/ai';
import { tool } from 'ai';
import { z } from 'zod';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

const props = defineProps<{
  projectName: string;
  activeSlideIndex: number;
  slidevUrl?: string; // Passed from App.vue
  markdown: string;
}>();

const emit = defineEmits<{
  (e: 'update:markdown', value: string): void;
}>();

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
const systemPrompt = `你是 Slidev AI 助手，专门帮助用户编辑和优化演示文稿。回复时请使用中文，保持简洁友好。

你有以下工具可以使用：
1. update_page(pageIndex, markdown) - 更新指定页面内容。pageIndex 从 0 开始。
2. insert_page(afterIndex, layout) - 在指定页面后插入新空白页面。afterIndex 从 0 开始。插入后新页面的索引是 afterIndex + 1。
3. apply_theme(themeName) - 应用主题。

⚠️ 重要规则：
- 每次工具调用只能操作一个页面
- 如果需要添加2页，必须分开调用：先 insert_page，再 insert_page，然后分别 update_page
- 插入第一个页面后，后续页面的索引会变化！例如：在第3页后插入新页面，新页面是第4页；再在第4页后插入，新页面是第5页
- update_page 的 markdown 内容不要包含 --- 分隔符，只写页面内容
- 先完成所有 insert_page，再依次 update_page

示例：添加2页到第5页之后
1. insert_page(afterIndex=5) → 新页面索引是6
2. insert_page(afterIndex=6) → 新页面索引是7
3. update_page(pageIndex=6, markdown="# 第一页内容...")
4. update_page(pageIndex=7, markdown="# 第二页内容...")`;

// Tool definitions for Vercel AI SDK
const tools = {
  update_page: tool({
    description: '更新指定页面的 Markdown 内容。pageIndex 从 0 开始，0 表示第一页幻灯片。',
    parameters: z.object({
      pageIndex: z.number().describe('要更新的页面索引，从0开始。0=第一页，1=第二页，以此类推'),
      markdown: z.string().describe('新的 Markdown 内容，不需要包含 --- 分隔符'),
    }),
    execute: async (input) => {
      console.log('update_page execute input:', JSON.stringify(input));
      const { pageIndex, markdown } = input;
      if (pageIndex === undefined || pageIndex === null || typeof pageIndex !== 'number' || isNaN(pageIndex)) {
        console.error('update_page parameter error:', input);
        return `❌ 参数错误：pageIndex 必须是数字，收到: ${JSON.stringify(input)}`;
      }
      await App.UpdatePage(props.projectName, pageIndex, markdown);
      return `✅ 已更新第 ${pageIndex + 1} 页`;
    },
  }),
  insert_page: tool({
    description: '在指定位置后插入新的空白页面。afterIndex 从 0 开始，表示在哪一页之后插入。',
    parameters: z.object({
      afterIndex: z.number().describe('在此页面之后插入新页面。0=在第一页后插入，-1=在最开头插入'),
      layout: z.string().optional().describe('页面布局类型：default, center, two-cols, image-right 等'),
    }),
    execute: async (input) => {
      console.log('insert_page execute input:', JSON.stringify(input));
      const { afterIndex, layout = 'default' } = input;
      if (afterIndex === undefined || afterIndex === null || typeof afterIndex !== 'number' || isNaN(afterIndex)) {
        console.error('insert_page parameter error:', input);
        return `❌ 参数错误：afterIndex 必须是数字，收到: ${JSON.stringify(input)}`;
      }
      await App.InsertPage(props.projectName, afterIndex, layout);
      return `✅ 已在第 ${afterIndex + 1} 页后插入新页面`;
    },
  }),
  apply_theme: tool({
    description: '应用全局主题到演示文稿',
    parameters: z.object({
      themeName: z.string().describe('主题名称（seriph, apple-basic, default 等）'),
    }),
    execute: async (input) => {
      const { themeName } = input;
      await App.ApplyTheme(props.projectName, themeName);
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

    // 使用 fullStream 处理工具调用
    for await (const part of result.fullStream) {
      const msg = messages.value.find(m => m.id === assistantMsgId);
      if (!msg) continue;
      
      switch (part.type) {
        case 'text-delta':
          // AI SDK v3+ 使用 'text' 属性
          const textContent = (part as any).text ?? (part as any).textDelta ?? '';
          if (textContent) {
            fullContent += textContent;
            msg.content = fullContent;
          }
          break;
        case 'tool-call':
          console.log('Tool call:', part.toolName, (part as any).input);
          msg.content = fullContent + `\n\n🔧 正在执行: ${part.toolName}...`;
          break;
        case 'tool-result':
          console.log('Tool result:', part.toolName, (part as any).output);
          fullContent += `\n\n✅ ${part.toolName} 执行完成`;
          msg.content = fullContent;
          // 工具执行完成后刷新 markdown
          const newContent = await App.ReadSlides(props.projectName);
          emit('update:markdown', newContent);
          break;
      }
    }
    
    // 最终再刷新一次确保同步
    const finalContent = await App.ReadSlides(props.projectName);
    emit('update:markdown', finalContent);

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

const insertPage = async () => {
  try {
    isLoading.value = true;
    // Insert after current page
    await App.InsertPage(props.projectName, props.activeSlideIndex, 'default');
    
    // Refresh content
    const newContent = await App.ReadSlides(props.projectName);
    emit('update:markdown', newContent);
    
    // Navigation will be handled by Slidev automatically if the server is running, 
    // but we might want to increment index here if we want the UI to reflect it.
  } catch (e) {
    console.error("Failed to insert page", e);
    alert("插入幻灯片失败");
  } finally {
    isLoading.value = false;
  }
};

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
            <button 
              @click="insertPage"
              class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"
              title="在当前页后插入新幻灯片"
            >
              <span class="material-symbols-outlined text-lg">add_box</span>
            </button>
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

    <!-- AI Panel -->
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
  </div>
</template>
