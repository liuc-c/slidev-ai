<script setup lang="ts">
import { computed } from 'vue';
import { AppView, AiMode } from '../types';

const props = defineProps<{
  activeView: string;
  activeSlideIndex: number;
  slides?: { id: number; label: string }[];
  projectName?: string;
  aiMode?: AiMode;
}>();


const emit = defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'selectSlide', index: number): void;
  (e: 'update:aiMode', mode: AiMode): void;
}>();

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
        幻灯片结构
      </span>
      <div class="flex items-center gap-2">
        <button
          @click="emit('update:aiMode', aiMode === 'outline' ? 'ppt' : 'outline')"
          :class="`group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
            aiMode === 'outline' 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
          }`"
          :title="aiMode === 'outline' ? '切换至 PPT 编辑' : '切换至大纲生成'"
        >
          <span class="material-symbols-outlined text-sm">{{ aiMode === 'outline' ? 'forum' : 'account_tree' }}</span>
          <span class="text-[9px] font-bold uppercase tracking-tighter">{{ aiMode === 'outline' ? 'PPT' : '大纲' }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar py-2">
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
            @click="onSelectSlide(slide.id)"
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
    </div>

    <div class="p-4 border-t border-border-dark bg-background-dark/30">
      <button class="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/5 active:scale-95">
        <span class="material-symbols-outlined text-sm">add_circle</span>
        <span>插入新幻灯片</span>
      </button>
    </div>
  </aside>
</template>
