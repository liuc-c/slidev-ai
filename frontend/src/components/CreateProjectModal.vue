<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { AppView, type OutlineItem } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { preprocessText, estimatePageCount, generateOutline as aiGenerateOutline, generateSlides as aiGenerateSlides } from '../lib/ai';

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
const isConfirmed = ref(false);
const outlineVersion = ref<number | null>(null);
const isLoading = ref(false);
const loadingMessage = ref('');
const config = ref<any>(null);
const selectedTheme = ref('default');

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
  
  try {
    // Step 1: 预处理长文，提取素材卡
    loadingMessage.value = 'AI 正在提取关键信息...';
    const cards = await preprocessText(config.value, topic.value);
    
    // Step 2: 估算页数
    const estimatedPages = estimatePageCount(cards.length);
    
    // Step 3: 生成大纲
    loadingMessage.value = 'AI 正在构思大纲...';
    const outlineResult = await aiGenerateOutline(config.value, cards, estimatedPages);
    
    // Step 4: 转换为 UI 期望的格式
    const outlineSlides = outlineResult.slides || [];
    steps.value = outlineSlides.map((slide: any, index: number) => ({
      id: slide.slide_id || String(index + 1).padStart(2, '0'),
      title: slide.title || '',
      type: index === 0 ? 'primary' : 'secondary',
      children: (slide.bullets || slide.must_include || []).map((b: string) => ({ label: b }))
    }));
    
    step.value = 2;
    // Reset confirmation when new outline is generated
    isConfirmed.value = false;
    outlineVersion.value = null;
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
    const content = await aiGenerateSlides(config.value, steps.value, selectedTheme.value);
    
    // Save outline to localStorage for coverage validation
    try {
      const outlineData = {
        outline_version: 'v1',
        slides: steps.value.map(s => ({
          slide_id: s.id, // Using the ID we generated (01, 02...)
          title: s.title,
          must_include: s.children?.map(c => c.label) || []
        }))
      };
      localStorage.setItem(`slidev_outline_${finalName}`, JSON.stringify(outlineData));
    } catch (e) {
      console.warn('Failed to save outline to localStorage', e);
    }

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
  isConfirmed.value = false;
  outlineVersion.value = null;
  step.value = 1;
  topic.value = '';
  projectName.value = '';
  steps.value = [];
  selectedTheme.value = 'default';
  emit('close');
};

const toggleConfirm = () => {
  if (isConfirmed.value) {
    // Unlock
    isConfirmed.value = false;
    outlineVersion.value = null;
  } else {
    // Confirm
    if (steps.value.length === 0) return;
    isConfirmed.value = true;
    outlineVersion.value = Date.now();
  }
};

const removeStep = (id: string) => {
  if (isConfirmed.value) return;
  steps.value = steps.value.filter(s => s.id !== id);
};

const addStep = () => {
  if (isConfirmed.value) return;
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
                    <div :class="`size-8 rounded-lg ${isConfirmed ? 'bg-primary/20 text-primary border-primary/50' : 'bg-slate-800 text-slate-400 border-white/5'} border flex items-center justify-center text-[11px] font-bold shrink-0 shadow-lg transition-colors`">
                      <span v-if="isConfirmed" class="material-symbols-outlined text-sm">lock</span>
                      <span v-else>{{ item.id }}</span>
                    </div>
                    <div :class="`flex-1 ${isConfirmed ? 'bg-[#1a2333]/30 border-primary/20' : 'bg-[#1a2333] border-white/5 hover:border-primary/40'} border p-4 rounded-xl flex items-center justify-between transition-all shadow-xl`">
                      <input
                        v-model="item.title"
                        :disabled="isConfirmed"
                        :class="`bg-transparent border-none focus:ring-0 text-sm font-bold w-full placeholder:text-slate-700 ${isConfirmed ? 'text-slate-400 cursor-not-allowed' : 'text-white'}`"
                        placeholder="幻灯片标题..."
                      />
                      <button
                        v-if="!isConfirmed"
                        @click="removeStep(item.id)"
                        class="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      >
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  v-if="!isConfirmed"
                  @click="addStep"
                  class="ml-12 w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-white/10 text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary/50 transition-all uppercase tracking-widest"
                >
                  <span class="material-symbols-outlined text-lg">add_circle</span>
                  添加幻灯片
                </button>

                <!-- Theme Selection -->
                <div class="mt-8 border-t border-white/5 pt-8">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">选择设计风格</label>
                  <div class="grid grid-cols-2 gap-4">
                    <div 
                      @click="!isConfirmed && (selectedTheme = 'default')"
                      :class="`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${
                        selectedTheme === 'default' 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                          : 'bg-[#1a2333] border-white/10 hover:border-primary/50'
                      } ${isConfirmed ? 'opacity-50 cursor-not-allowed grayscale' : ''}`"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-white">Default</span>
                        <div v-if="selectedTheme === 'default'" class="text-primary">
                          <span class="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                      </div>
                      <p class="text-xs text-slate-400">现代极简风格，适用于大多数演示场景</p>
                    </div>

                    <div 
                      @click="!isConfirmed && (selectedTheme = 'seriph')"
                      :class="`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${
                        selectedTheme === 'seriph' 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                          : 'bg-[#1a2333] border-white/10 hover:border-primary/50'
                      } ${isConfirmed ? 'opacity-50 cursor-not-allowed grayscale' : ''}`"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-serif font-bold text-white">Seriph</span>
                        <div v-if="selectedTheme === 'seriph'" class="text-primary">
                          <span class="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                      </div>
                      <p class="text-xs text-slate-400 font-serif">优雅衬线风格，适合文档与阅读</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="p-6 border-t border-white/5 bg-[#1a2333]/50 flex items-center justify-between shrink-0 gap-6">
              <div @click="toggleConfirm" class="flex items-center gap-3 cursor-pointer group select-none">
                <div :class="`w-5 h-5 rounded flex items-center justify-center border transition-all ${isConfirmed ? 'bg-primary border-primary' : 'border-slate-600 group-hover:border-primary'}`">
                  <span v-if="isConfirmed" class="material-symbols-outlined text-sm text-white">check</span>
                </div>
                <span :class="`text-xs font-bold uppercase tracking-widest transition-colors ${isConfirmed ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`">
                  {{ isConfirmed ? '大纲已确认' : '确认大纲内容' }}
                </span>
              </div>

              <button
                @click="createPresentation"
                :disabled="!projectName || isLoading || !isConfirmed"
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
