<script setup lang="ts">
import type { PromptStyle } from '../types';

const props = defineProps<{
  styles: PromptStyle[];
  selectedId: string;
}>();

const emit = defineEmits<{
  (e: 'select', styleId: string): void;
  (e: 'edit', style: PromptStyle): void;
  (e: 'add'): void;
}>();

const handleSelect = (styleId: string) => {
  emit('select', styleId);
};

const handleEdit = (style: PromptStyle, event: Event) => {
  event.stopPropagation();
  emit('edit', style);
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[18px]">palette</span>
        <span class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest">PPT 风格</span>
      </div>
      <button
        @click="emit('add')"
        class="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/30"
      >
        <span class="material-symbols-outlined text-[14px]">add</span>
        新增
      </button>
    </div>

    <!-- Style Grid -->
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="style in styles"
        :key="style.id"
        @click="handleSelect(style.id)"
        :class="[
          'group relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left',
          selectedId === style.id
            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
            : 'bg-background-dark border-border-dark hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-md'
        ]"
      >
        <!-- Selected Check Badge -->
        <div
          v-if="selectedId === style.id"
          class="absolute -top-1.5 -right-1.5 size-5 bg-primary rounded-full flex items-center justify-center shadow-lg"
        >
          <span class="material-symbols-outlined text-white text-[12px]">check</span>
        </div>

        <!-- Edit Button (hover) -->
        <button
          @click="handleEdit(style, $event)"
          class="absolute top-2 right-2 size-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:border-white/20"
          :class="{ 'opacity-0': selectedId === style.id }"
          title="编辑风格"
        >
          <span class="material-symbols-outlined text-slate-400 text-[14px]">edit</span>
        </button>

        <!-- Icon -->
        <div
          :class="[
            'size-8 rounded-lg flex items-center justify-center mb-2 transition-colors',
            selectedId === style.id
              ? 'bg-primary/20 text-primary'
              : 'bg-slate-800 text-slate-400 group-hover:text-white'
          ]"
        >
          <span class="material-symbols-outlined text-[18px]">{{ style.icon }}</span>
        </div>

        <!-- Name -->
        <p
          :class="[
            'text-xs font-bold transition-colors',
            selectedId === style.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
          ]"
        >
          {{ style.name }}
        </p>

        <!-- Description -->
        <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
          {{ style.description }}
        </p>

        <!-- Custom Badge -->
        <div
          v-if="!style.isBuiltin"
          class="absolute bottom-2 right-2"
        >
          <span class="text-[8px] font-bold text-slate-600 uppercase tracking-wider">自定义</span>
        </div>
      </button>
    </div>
  </div>
</template>
