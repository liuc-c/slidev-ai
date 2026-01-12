<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { PromptStyle } from '../types';
import { ICON_OPTIONS, getBuiltinStyleById } from '../lib/prompts';

const props = defineProps<{
  style: PromptStyle | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', style: PromptStyle): void;
  (e: 'delete', styleId: string): void;
}>();

// Local editable copy
const editingStyle = ref<PromptStyle | null>(null);
const showIconPicker = ref(false);

// Reset local state when style prop changes
watch(
  () => props.style,
  (newStyle) => {
    if (newStyle) {
      editingStyle.value = { ...newStyle };
    } else {
      editingStyle.value = null;
    }
    showIconPicker.value = false;
  },
  { immediate: true }
);

const isNewStyle = computed(() => {
  return editingStyle.value && editingStyle.value.id.startsWith('custom_');
});

const canReset = computed(() => {
  return editingStyle.value?.isBuiltin && getBuiltinStyleById(editingStyle.value.id);
});

const handleSave = () => {
  if (editingStyle.value) {
    emit('save', { ...editingStyle.value });
  }
};

const handleDelete = () => {
  if (editingStyle.value && !editingStyle.value.isBuiltin) {
    if (confirm('确定要删除这个风格吗？')) {
      emit('delete', editingStyle.value.id);
    }
  }
};

const handleReset = () => {
  if (editingStyle.value?.isBuiltin) {
    const builtin = getBuiltinStyleById(editingStyle.value.id);
    if (builtin) {
      editingStyle.value = { ...builtin };
    }
  }
};

const selectIcon = (iconName: string) => {
  if (editingStyle.value) {
    editingStyle.value.icon = iconName;
  }
  showIconPicker.value = false;
};

const handleOverlayClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    emit('close');
  }
};
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        @click="handleOverlayClick"
      >
        <!-- Drawer -->
        <Transition name="slide">
          <div
            v-if="isOpen && editingStyle"
            class="absolute right-0 top-0 h-full w-full max-w-[480px] bg-panel-dark border-l border-border-dark flex flex-col shadow-2xl"
            @click.stop
          >
            <!-- Header -->
            <header class="h-14 border-b border-border-dark flex items-center justify-between px-5 shrink-0">
              <div class="flex items-center gap-3">
                <button
                  @click="emit('close')"
                  class="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <h2 class="text-sm font-bold text-white">
                  {{ isNewStyle ? '新建风格' : '编辑风格' }}
                </h2>
              </div>
              <button
                @click="handleSave"
                class="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                保存
              </button>
            </header>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              <!-- Name -->
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2">
                  风格名称
                </label>
                <input
                  v-model="editingStyle.name"
                  type="text"
                  class="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="输入风格名称"
                />
              </div>

              <!-- Icon Picker -->
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2">
                  图标
                </label>
                <button
                  @click="showIconPicker = !showIconPicker"
                  class="flex items-center gap-3 w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white hover:border-slate-500 transition-colors"
                >
                  <div class="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-[18px]">{{ editingStyle.icon }}</span>
                  </div>
                  <span class="flex-1 text-left text-slate-300">{{ editingStyle.icon }}</span>
                  <span class="material-symbols-outlined text-slate-500 text-[18px]">
                    {{ showIconPicker ? 'expand_less' : 'expand_more' }}
                  </span>
                </button>

                <!-- Icon Grid -->
                <Transition name="expand">
                  <div
                    v-if="showIconPicker"
                    class="mt-2 p-3 bg-background-dark border border-border-dark rounded-lg"
                  >
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="icon in ICON_OPTIONS"
                        :key="icon.name"
                        @click="selectIcon(icon.name)"
                        :class="[
                          'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                          editingStyle.icon === icon.name
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                        ]"
                        :title="icon.label"
                      >
                        <span class="material-symbols-outlined text-[20px]">{{ icon.name }}</span>
                        <span class="text-[8px] font-medium truncate w-full text-center">{{ icon.label }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2">
                  简短描述
                </label>
                <input
                  v-model="editingStyle.description"
                  type="text"
                  class="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="简短描述这个风格的特点"
                />
              </div>

              <!-- Outline Prompt -->
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2">
                  大纲生成提示词
                </label>
                <textarea
                  v-model="editingStyle.outlinePrompt"
                  class="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-xs text-white font-mono leading-relaxed focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y min-h-[160px]"
                  placeholder="输入用于生成大纲的系统提示词..."
                ></textarea>
              </div>

              <!-- Slide Prompt -->
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-2">
                  幻灯片生成提示词
                </label>
                <textarea
                  v-model="editingStyle.slidePrompt"
                  class="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-xs text-white font-mono leading-relaxed focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y min-h-[160px]"
                  placeholder="输入用于生成幻灯片内容的系统提示词..."
                ></textarea>
              </div>
            </div>

            <!-- Footer Actions -->
            <footer class="border-t border-border-dark p-4 flex items-center justify-between shrink-0">
              <div>
                <button
                  v-if="canReset"
                  @click="handleReset"
                  class="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                  恢复默认
                </button>
              </div>
              <div>
                <button
                  v-if="!editingStyle.isBuiltin"
                  @click="handleDelete"
                  class="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                  删除此风格
                </button>
              </div>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition for drawer */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Expand transition for icon picker */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease-out;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
}
</style>
