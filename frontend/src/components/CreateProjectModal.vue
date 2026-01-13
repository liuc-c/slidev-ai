<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { AppView, type OutlineItem } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { generateOutline as aiGenerateOutline, generateSlides as aiGenerateSlides } from '../lib/ai';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', payload: { name: string; content: string }): void;
}>();

const step = ref<1 | 2>(1);
const topic = ref('');
const projectName = ref('');
const steps = ref<OutlineItem[]>([]);
const isLoading = ref(false);
const loadingMessage = ref('');
const config = ref<any>(null);

onMounted(async () => {
  try {
    config.value = await App.GetSettings();
  } catch (e) {
    console.error("Failed to load settings", e);
  }
});

const generateOutline = async () => {
  if (!topic.value) return;
  if (!config.value?.ai?.apiKey) {
    alert("请先在设置中配置 AI API Key");
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'AI 正在构思大纲...';
  try {
    // Using default prompts as StyleSelector is removed
    steps.value = await aiGenerateOutline(config.value, topic.value);
    step.value = 2;
  } catch (e: any) {
    console.error(e);
    alert(e.message || "大纲生成失败");
  } finally {
    isLoading.value = false;
  }
};

const createPresentation = async () => {
  if (steps.value.length === 0) return;
  if (!projectName.value) {
    alert("请输入项目名称");
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'AI 正在撰写幻灯片内容...';

  try {
    const finalName = projectName.value.endsWith('.md') ? projectName.value : `${projectName.value}.md`;
    const content = await aiGenerateSlides(config.value, steps.value);
    
    // Create the project file
    await App.CreateProject(finalName);
    await App.SaveSlides(finalName, content);
    
    emit('created', { name: finalName, content });
    reset();
  } catch (e: any) {
    console.error(e);
    alert(e.message || "幻灯片生成失败");
  } finally {
    isLoading.value = false;
  }
};

const reset = () => {
  step.value = 1;
  topic.value = '';
  projectName.value = '';
  steps.value = [];
  emit('close');
};

const removeStep = (id: string) => {
  steps.value = steps.value.filter(s => s.id !== id);
};

const addStep = () => {
  const newId = String(steps.value.length + 1).padStart(2, '0');
  steps.value.push({
    id: newId,
    title: '',
    type: 'secondary',
    children: []
  });
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="reset"></div>
      
      <!-- Modal Content -->
      <div :class="`relative bg-[#161d2b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out flex flex-col ${
        step === 1 ? 'w-full max-w-xl scale-100 opacity-100' : 'w-full max-w-4xl h-[80vh] scale-100 opacity-100'
      }`">
        
        <!-- Loading Overlay -->
        <div v-if="isLoading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 shadow-lg shadow-primary/20"></div>
          <p class="text-white font-bold animate-pulse tracking-widest uppercase text-xs">{{ loadingMessage }}</p>
        </div>

        <!-- Step 1: Input Topic -->
        <div v-if="step === 1" class="p-10 flex flex-col gap-8 text-center">
          <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-bold text-white tracking-tight">开启你的 AI 创作</h2>
            <p class="text-slate-500 text-sm">输入主题，AI 将为你规划演示文稿的大纲</p>
          </div>
          
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <textarea
              v-model="topic"
              class="relative w-full bg-[#0a0f18] border border-white/5 rounded-2xl p-6 text-lg text-white placeholder:text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none h-40"
              placeholder="输入演示主题，例如：'Slidev Studio AI 助手功能介绍'..."
              @keydown.enter.prevent="generateOutline"
            ></textarea>
          </div>

          <button
            @click="generateOutline"
            :disabled="!topic || isLoading"
            class="bg-primary text-white h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale group"
          >
            构思大纲
            <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">magic_button</span>
          </button>
        </div>

        <!-- Step 2: Review Outline -->
        <div v-else class="flex flex-col h-full overflow-hidden">
          <header class="p-6 border-b border-white/5 bg-[#1a2333]/50 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-4">
              <button @click="step = 1" class="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <h2 class="text-xl font-bold text-white tracking-tight">审查 & 优化大纲</h2>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex flex-col items-end">
                <input 
                  v-model="projectName"
                  class="bg-transparent border-b border-white/10 text-right text-sm font-bold text-primary focus:border-primary focus:ring-0 placeholder:text-slate-700"
                  placeholder="项目名称 (例如: slides)"
                />
                <span class="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Slidev Project Name</span>
              </div>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0b0f1a]">
            <div class="max-w-2xl mx-auto flex flex-col gap-6">
              <div v-for="item in steps" :key="item.id" class="group flex flex-col gap-2">
                <div class="flex items-center gap-4">
                  <div class="size-8 rounded-lg bg-slate-800 text-slate-400 border border-white/5 flex items-center justify-center text-[11px] font-bold shrink-0 shadow-lg">
                    {{ item.id }}
                  </div>
                  <div class="flex-1 bg-[#1a2333] border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all shadow-xl">
                    <input
                      v-model="item.title"
                      class="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full placeholder:text-slate-700"
                      placeholder="幻灯片标题..."
                    />
                    <button
                      @click="removeStep(item.id)"
                      class="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    >
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                @click="addStep"
                class="ml-12 w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-white/10 text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary/50 transition-all uppercase tracking-widest"
              >
                <span class="material-symbols-outlined text-lg">add_circle</span>
                添加幻灯片
              </button>
            </div>
          </div>

          <footer class="p-6 border-t border-white/5 bg-[#1a2333]/50 flex items-center justify-between shrink-0">
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              AI 将根据以上大纲生成完整的 Markdown 内容
            </p>
            <button
              @click="createPresentation"
              :disabled="!projectName || isLoading"
              class="bg-primary text-white h-12 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale group"
            >
              生成幻灯片
              <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">rocket_launch</span>
            </button>
          </footer>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
