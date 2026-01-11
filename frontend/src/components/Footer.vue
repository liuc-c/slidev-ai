<script setup lang="ts">
import { computed } from 'vue';
import { AppView } from '../types';

const props = defineProps<{
  activeView: string;
}>();

const isPrimary = computed(() => props.activeView === AppView.EDITOR_AI || props.activeView === AppView.PLANNER);
</script>

<template>
  <footer :class="`h-6 flex shrink-0 items-center justify-between px-4 text-[10px] font-mono z-20 transition-colors ${isPrimary ? 'bg-primary text-white' : 'bg-background-dark border-t border-border-dark text-[#90a4cb]'}`">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1">
        <span :class="`material-symbols-outlined text-[12px] ${!isPrimary ? 'text-green-500' : ''}`">check_circle</span>
        SYSTEM_OK
      </span>
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-[12px]">timer</span>
        RENDER: 12ms
      </span>
    </div>

    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-[12px]">bolt</span>
        AI_LAYER_ACTIVE
      </span>
      <div class="flex items-center gap-2">
        <span>v0.48.0-studio</span>
        <span class="opacity-50">|</span>
        <span class="uppercase tracking-widest">UTF-8</span>
      </div>
    </div>
  </footer>
</template>
