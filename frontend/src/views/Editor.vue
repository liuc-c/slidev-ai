<script setup lang="ts">
import { ref, computed } from 'vue';
import { AppView } from '../types';

const props = defineProps<{
  activeView: string; // 'editor_code' or 'editor_ai'
  projectName: string;
  activeSlideIndex: number;
}>();

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
}>();

const mode = computed(() => props.activeView === AppView.EDITOR_CODE ? 'code' : 'ai');

const markdown = ref(`---
theme: seriph
background: https://picsum.photos/id/10/1920/1080
class: text-center
highlighter: shiki
lineNumbers: true
---

# Slidev Studio AI

AI 驱动的现代化演示文稿引擎。

---
layout: default
---

## 核心功能

- 📝 **Markdown 驱动** - 专注内容创作
- 🧑‍💻 **开发者友好** - 支持代码片段与实时预览
- 🤖 **AI 协作** - 自动生成大纲与内容优化

---
layout: section
---

## AI 生成内容

点击左侧大纲即可快速切换幻灯片。

---
layout: default
---

## 交互组件

这是一个模拟的交互演示。`);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

const aiInput = ref('');
const chatHistory = ref<ChatMessage[]>([
  { role: 'assistant', content: '你好！我是 Slidev AI 助手。我可以帮你润色内容、生成图表代码或者调整布局。有什么我可以帮你的吗？' }
]);

const previewData = computed(() => {
  const slides = markdown.value.split('---').map(s => s.trim()).filter(s => s);
  const contentSlides = slides.filter(s => !s.startsWith('theme:'));

  const contentSlide = contentSlides[props.activeSlideIndex] || contentSlides[0];
  if (!contentSlide) return { title: '无标题', description: '', count: contentSlides.length };

  const lines = contentSlide.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') ||
                lines.find(l => l.startsWith('## '))?.replace('## ', '') || 'Slidev Studio';
  const description = lines.find(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('layout:')) || '';

  return { title, description, count: contentSlides.length };
});

const handleSendAi = () => {
  if (!aiInput.value.trim()) return;

  const userMsg: ChatMessage = { role: 'user', content: aiInput.value };
  chatHistory.value.push(userMsg);
  const inputContent = aiInput.value;
  aiInput.value = '';

  // Mock AI "Thinking" and response
  setTimeout(() => {
    chatHistory.value.push({ role: 'assistant', content: '', isThinking: true });

    setTimeout(() => {
      chatHistory.value = chatHistory.value.filter(m => !m.isThinking);
      chatHistory.value.push({
        role: 'assistant',
        content: `我已经为你更新了幻灯片。我在内容中添加了关于 "${inputContent}" 的相关信息，并优化了标题排版。`
      });

      markdown.value = markdown.value + `\n\n--- \n\n# AI 生成内容\n\n针对你的请求：${inputContent}\n\n- 自动生成的观点 1\n- 自动生成的观点 2`;
    }, 1500);
  }, 500);
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
          <button class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span class="material-symbols-outlined text-lg">desktop_windows</span></button>
          <button class="p-1.5 hover:bg-[#222f49] rounded-md transition-colors"><span class="material-symbols-outlined text-lg">refresh</span></button>
        </div>
      </div>

      <div class="flex-1 p-12 flex items-center justify-center bg-[#0b0f1a] overflow-auto custom-scrollbar">
        <div class="w-full max-w-4xl aspect-video bg-white rounded-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative transition-transform duration-500 ease-in-out">
            <div class="flex-1 bg-gradient-to-br from-primary to-[#001c54] p-16 flex flex-col justify-center text-left">
            <div class="inline-block px-3 py-1 bg-white/10 rounded border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-8 w-fit animate-pulse">
              Live Preview
            </div>
            <h1 class="text-6xl font-display font-bold text-white mb-8 leading-tight drop-shadow-lg">{{ previewData.title }}</h1>
            <p class="text-white/70 text-xl max-w-2xl leading-relaxed">{{ previewData.description }}</p>

            <div class="absolute bottom-10 right-10 opacity-10">
              <span class="material-symbols-outlined text-white text-[160px]">auto_awesome</span>
            </div>
          </div>
          <div class="h-1.5 bg-white/10 w-full overflow-hidden">
            <div class="h-full bg-primary transition-all duration-300" :style="`width: ${((activeSlideIndex + 1) / previewData.count) * 100}%`"></div>
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
            v-model="markdown"
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
          <div v-for="(msg, idx) in chatHistory" :key="idx" :class="`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`">
            <div v-if="msg.role === 'assistant'" class="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm shadow-emerald-500/10">
              <span class="material-symbols-outlined text-[20px]">memory</span>
            </div>
            <div class="flex flex-col gap-1 max-w-[85%]">
              <div :class="`p-4 rounded-xl text-sm leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-[#222f49] text-slate-200 rounded-tl-none'
              }`">
                <template v-if="msg.isThinking">
                    <div class="flex items-center gap-2 italic text-[#90a4cb]">
                      <span class="size-1.5 bg-primary rounded-full animate-bounce"></span>
                      <span class="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span class="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      思考中...
                    </div>
                </template>
                <template v-else>
                  {{ msg.content }}
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-border-dark bg-background-dark/30 shrink-0">
          <div class="relative">
            <textarea
              v-model="aiInput"
              @keydown.enter.prevent="!$event.shiftKey && handleSendAi()"
              class="w-full bg-[#0a0f18] border border-border-dark rounded-xl p-4 pr-12 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-600 resize-none font-sans min-h-[100px] shadow-inner"
              placeholder="尝试说：'把标题改成赛博朋克风格'..."
            ></textarea>
            <button
              @click="handleSendAi"
              class="absolute bottom-3 right-3 bg-primary text-white size-10 rounded-lg flex items-center justify-center hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <span class="material-symbols-outlined text-[22px]">send</span>
            </button>
          </div>
        </div>
      </aside>
    </template>
  </div>
</template>
