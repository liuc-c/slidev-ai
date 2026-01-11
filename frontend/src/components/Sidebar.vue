<script setup lang="ts">
import { computed } from 'vue';
import { AppView } from '../types';

const props = defineProps<{
  activeView: string;
  activeSlideIndex: number;
  slides?: { id: number; label: string }[];
  projectName?: string;
}>();


const emit = defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'selectSlide', index: number): void;
}>();

const isPlanner = computed(() => props.activeView === AppView.PLANNER);

// Fallback if not provided, though App.vue should provide it
const displaySlides = computed(() => props.slides || []);

const onNavigate = (view: string) => {
  emit('navigate', view);
};

const onSelectSlide = (id: number) => {
  emit('selectSlide', id);
};
</script>

<template>
  <aside class="w-64 border-r border-border-dark flex flex-col bg-panel-dark h-full shrink-0">
    <div class="p-4 border-b border-border-dark flex items-center justify-between bg-background-dark/20">
      <span class="text-[11px] font-bold text-[#90a4cb] uppercase tracking-widest">
        {{ isPlanner ? '大纲规划器' : '幻灯片结构' }}
      </span>
      <div class="flex items-center gap-2">
        <button
          v-if="!isPlanner"
          @click="onNavigate(AppView.PLANNER)"
          class="group flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-all"
          title="切换至大纲编辑器"
        >
          <span class="material-symbols-outlined text-sm">account_tree</span>
          <span class="text-[9px] font-bold uppercase tracking-tighter">大纲</span>
        </button>
        <button
          v-else
          @click="onNavigate(AppView.EDITOR_CODE)"
          class="group flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md transition-all"
          title="返回代码编辑器"
        >
          <span class="material-symbols-outlined text-sm">code</span>
          <span class="text-[9px] font-bold uppercase tracking-tighter">代码</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar py-2">
      <template v-if="!isPlanner">
        <div class="px-4 py-2 mb-2">
          <div class="flex items-center gap-2 text-[#90a4cb] text-[10px] font-bold mb-3 uppercase tracking-widest opacity-60">
            <span class="material-symbols-outlined text-sm">folder_open</span>
            本地文件
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2 px-3 py-2 text-xs text-white bg-primary/10 border-l-2 border-primary rounded-r cursor-default">
              <span class="material-symbols-outlined text-sm text-primary">description</span>
              {{ projectName || 'slides.md' }}
            </div>
            <div class="flex items-center gap-2 px-3 py-2 text-xs text-[#90a4cb] hover:bg-[#222f49]/30 rounded cursor-pointer transition-colors">
              <span class="material-symbols-outlined text-sm">settings_suggest</span>
              slidev.config.ts
            </div>
          </div>

        </div>

        <div class="px-4 py-2 border-t border-border-dark/50">
          <div class="text-[#90a4cb] text-[10px] font-bold mb-3 uppercase tracking-widest opacity-60">幻灯片结构</div>
          <div class="space-y-1">
            <div
              v-for="slide in displaySlides"
              :key="slide.id"
              @click="() => {
                onSelectSlide(slide.id);
                if (isPlanner) onNavigate(AppView.EDITOR_CODE);
              }"
              :class="`flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded group relative ${
                activeSlideIndex === slide.id
                  ? 'bg-primary/20 border-l-2 border-primary text-white shadow-lg shadow-primary/5'
                  : 'text-[#90a4cb] hover:bg-[#222f49]/30 hover:text-slate-200'
              }`"
            >
              <span :class="`material-symbols-outlined text-base ${activeSlideIndex === slide.id ? 'text-primary animate-pulse' : 'text-[#314368] group-hover:text-[#4b6392]'}`">tag</span>
              <p :class="`text-xs font-bold ${activeSlideIndex === slide.id ? 'text-white' : ''}`">{{ slide.label }}</p>
              <div v-if="activeSlideIndex === slide.id" class="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="px-4 py-2">
          <div class="flex flex-col gap-6 mt-2">
            <div class="flex flex-col gap-3">
              <h3 class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest opacity-60">初始提示词</h3>
              <div class="bg-background-dark/50 border border-border-dark p-3 rounded-lg ring-1 ring-primary/20 shadow-inner">
                <p class="text-xs text-slate-300 italic leading-relaxed">
                  "创建一个关于 Slidev 架构的技术深度演示稿..."
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <h3 class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest opacity-60">大纲设置</h3>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/10 cursor-pointer shadow-sm">
                  <div class="size-3 rounded-full border border-primary flex items-center justify-center">
                    <div class="size-1.5 bg-primary rounded-full"></div>
                  </div>
                  <span class="text-xs font-medium">逻辑严密模式</span>
                </label>
                <label class="flex items-center gap-3 p-3 rounded-lg border border-border-dark hover:border-slate-500 cursor-pointer transition-colors group">
                  <div class="size-3 rounded-full border border-border-dark group-hover:border-slate-500"></div>
                  <span class="text-xs font-medium text-slate-400">极简摘要模式</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="p-4 border-t border-border-dark bg-background-dark/30">
      <button class="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/5 active:scale-95">
        <span class="material-symbols-outlined text-sm">add_circle</span>
        <span>插入新幻灯片</span>
      </button>
    </div>
  </aside>
</template>
