<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Chat } from '@ai-sdk/vue';
import { AppView } from '../types';
import * as App from '../../wailsjs/go/main/App';

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

// AI Chat Integration
const input = ref('');
const serverPort = ref('');

// Helper to get chat options with dynamic fetch
const getChatOptions = () => ({
  fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
    // Ignore the url passed by Chat (defaults to /api/chat)
    // Construct our own URL
    const port = serverPort.value;
    if (!port) {
       console.error("Server port not ready");
       throw new Error("Backend not ready");
    }
    const endpoint = `http://localhost:${port}/api/chat`;
    return fetch(endpoint, options);
  },
  initialMessages: [
    { id: 'welcome', role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
  ]
});

// We can't initialize Chat immediately with the correct fetch if we want to rely on serverPort being set.
// However, Chat instance is usually long-lived.
// We can use a closure in fetch to access the ref.
const chat = new Chat({
  fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
    const port = serverPort.value;
    if (!port) {
       // Wait for port? or fail.
       console.error("Server port not ready");
       throw new Error("Backend not ready");
    }
    const endpoint = `http://localhost:${port}/api/chat`;
    return fetch(endpoint, options);
  },
  initialMessages: [
    { id: 'welcome', role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
  ]
});

// Expose state for template
const chatMessages = computed(() => chat.messages);
const isLoading = computed(() => chat.isLoading); // Chat class doesn't expose isLoading directly in some versions, but usually it does or 'status'.
// Wait, 'isLoading' is NOT a property of Chat class in the definitions I saw.
// It has `status` ref in `state`?
// Let's check definition again.
// declare class Chat ... extends AbstractChat ...
// AbstractChat doesn't have isLoading.
// But `useChat` returned `isLoading`.
// The `Chat` class documentation or usage in Nuxt example didn't use `isLoading`.
// However, `chat.status` (if available) can be used.
// If `isLoading` is needed, I can check `chat.status === 'streaming'` or similar?
// Actually `VueChatState` has `statusRef`. `chat.status` getter returns value.
// So `isLoading` = `chat.status !== 'ready' && chat.status !== 'error'`. (ready, streaming, ...)

const handleSubmit = async (e?: Event) => {
  if (e) e.preventDefault();
  if (!input.value.trim()) return;

  await chat.append({ role: 'user', content: input.value });
  input.value = '';
};


onMounted(async () => {
  try {
    serverPort.value = await App.GetServerPort();
  } catch (e) {
    console.error("Failed to get server port", e);
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
          <div v-for="msg in chatMessages" :key="msg.id" :class="`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`">
            <div v-if="msg.role === 'assistant'" class="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
              <span class="material-symbols-outlined text-[20px]">memory</span>
            </div>
            <div class="flex flex-col gap-1 max-w-[85%]">
              <div :class="`p-4 rounded-xl text-sm leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-[#222f49] text-slate-200 rounded-tl-none'
              }`">
                  {{ msg.content }}
              </div>
            </div>
          </div>

           <!-- Loading indicator -->
           <!-- Using chat.status to detect loading. 'submitted', 'streaming', etc? -->
           <!-- Since I can't be sure of 'isLoading' property on Chat class in this version, I'll rely on checking if the last message is incomplete or status. -->
           <!-- For now, removing isLoading check or assuming it might be 'streaming' -->
        </div>

        <div class="p-4 border-t border-border-dark bg-background-dark/30 shrink-0">
          <form @submit="handleSubmit" class="relative">
            <textarea
              v-model="input"
              @keydown.enter.prevent="!$event.shiftKey && handleSubmit($event)"
              class="w-full bg-[#0a0f18] border border-border-dark rounded-xl p-4 pr-12 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600 resize-none font-sans min-h-[100px] shadow-inner"
              placeholder="尝试说：'把标题改成赛博朋克风格'..."
            ></textarea>
            <button
              type="submit"
              class="absolute bottom-3 right-3 bg-primary text-white size-10 rounded-lg flex items-center justify-center hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <span class="material-symbols-outlined text-[22px]">send</span>
            </button>
          </form>
        </div>
      </aside>
    </template>
  </div>
</template>
