<script setup lang="ts">
import { computed } from 'vue';
import { AppView } from '../types';

const props = defineProps<{
  activeView: string;
  projectName: string;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string): void;
}>();

const isEditor = computed(() => {
  return props.activeView === AppView.EDITOR_CODE ||
         props.activeView === AppView.EDITOR_AI ||
         props.activeView === AppView.PLANNER;
});

const onNavigate = (view: string) => {
  emit('navigate', view);
};
</script>

<template>
  <header v-if="activeView !== AppView.DASHBOARD" class="h-14 border-b border-border-dark bg-panel-dark flex items-center justify-between px-6 shrink-0 z-10">
    <div class="flex items-center gap-4">
      <!-- explicit Back Button -->
      <button
        @click="onNavigate(AppView.DASHBOARD)"
        class="flex items-center gap-2 px-2 py-1.5 text-[#90a4cb] hover:text-white hover:bg-white/5 rounded-lg transition-all group"
        title="返回项目列表"
      >
        <span class="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        <span class="text-xs font-bold uppercase tracking-wider hidden sm:inline">列表</span>
      </button>

      <div class="h-4 w-[1px] bg-border-dark mx-1"></div>

      <div
        class="bg-primary rounded-lg p-1.5 flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        @click="onNavigate(AppView.DASHBOARD)"
      >
        <span class="material-symbols-outlined text-white text-xl">layers</span>
      </div>
      <div class="flex flex-col">
        <h1 class="text-white text-sm font-bold leading-none">Slidev Studio</h1>
        <p class="text-[#90a4cb] text-[10px] font-mono mt-0.5 uppercase tracking-wider">{{ projectName }}</p>
      </div>

      <template v-if="isEditor">
        <div class="h-4 w-[1px] bg-border-dark mx-2"></div>
        <nav class="flex items-center gap-1 bg-background-dark/50 p-1 rounded-lg border border-border-dark/30 shadow-inner">
          <button
            @click="onNavigate(AppView.EDITOR_CODE)"
            :class="`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.EDITOR_CODE ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`"
          >
            代码
          </button>
          <button
            @click="onNavigate(AppView.EDITOR_AI)"
            :class="`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.EDITOR_AI ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`"
          >
            AI
          </button>
          <button
            @click="onNavigate(AppView.PLANNER)"
            :class="`px-4 py-1 rounded-md text-xs font-bold transition-all ${activeView === AppView.PLANNER ? 'bg-primary text-white shadow-lg' : 'text-[#90a4cb] hover:text-white'}`"
          >
            大纲
          </button>
        </nav>
      </template>
    </div>

    <div class="flex items-center gap-3">
      <button
        v-if="activeView === AppView.SETTINGS"
        @click="onNavigate(AppView.DASHBOARD)"
        class="text-[#90a4cb] hover:text-white transition-colors p-2"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
      <template v-else>
        <button class="flex items-center gap-2 px-3 h-8 bg-[#222f49] text-white rounded-lg hover:bg-[#2c3b5a] transition-colors" @click="onNavigate(AppView.SETTINGS)">
          <span class="material-symbols-outlined text-lg">settings</span>
          <span class="text-[11px] font-bold">项目设置</span>
        </button>
        <button class="flex items-center gap-2 px-4 h-8 bg-primary text-white rounded-lg shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
          <span class="material-symbols-outlined text-lg">play_arrow</span>
          <span class="text-[11px] font-bold">演示</span>
        </button>
      </template>
    </div>
  </header>
</template>
