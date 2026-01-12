<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { OutlineItem, PromptStyle } from '../types';
import * as App from '../../wailsjs/go/main/App';
import { generateOutline as aiGenerateOutline, generateSlides as aiGenerateSlides } from '../lib/ai';
import { getMergedStyles, getStyleById, createEmptyStyle, DEFAULT_STYLE_ID } from '../lib/prompts';
import StyleSelector from '../components/StyleSelector.vue';
import StyleEditor from '../components/StyleEditor.vue';

const props = defineProps<{
  projectName?: string;
}>();

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
}>();

const steps = ref<OutlineItem[]>([]);
const topic = ref('');
const isLoading = ref(false);
const loadingMessage = ref('');
const config = ref<any>(null);

// Style management state
const selectedStyleId = ref(DEFAULT_STYLE_ID);
const customStyles = ref<PromptStyle[]>([]);
const editorOpen = ref(false);
const editingStyle = ref<PromptStyle | null>(null);

// Computed: all available styles (builtin + custom)
const availableStyles = computed(() => getMergedStyles(customStyles.value));

// Computed: currently selected style object
const currentStyle = computed(() => 
  getStyleById(selectedStyleId.value, customStyles.value) || availableStyles.value[0]
);

onMounted(async () => {
  try {
    config.value = await App.GetSettings();
    
    // Load saved prompt config
    if (config.value?.prompts) {
      if (config.value.prompts.selectedStyleId) {
        selectedStyleId.value = config.value.prompts.selectedStyleId;
      }
      if (config.value.prompts.customStyles) {
        customStyles.value = config.value.prompts.customStyles;
      }
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
});

// Save prompt config to backend
const savePromptConfig = async () => {
  if (!config.value) return;
  
  const updatedConfig = {
    ...config.value,
    prompts: {
      selectedStyleId: selectedStyleId.value,
      customStyles: customStyles.value,
    }
  };
  
  try {
    await App.SaveSettings(updatedConfig);
    config.value = updatedConfig;
  } catch (e) {
    console.error("Failed to save prompt config", e);
  }
};

// Style selection handler
const handleStyleSelect = async (styleId: string) => {
  selectedStyleId.value = styleId;
  await savePromptConfig();
};

// Open editor for a style
const handleStyleEdit = (style: PromptStyle) => {
  editingStyle.value = style;
  editorOpen.value = true;
};

// Open editor for new style
const handleStyleAdd = () => {
  editingStyle.value = createEmptyStyle();
  editorOpen.value = true;
};

// Save edited style
const handleStyleSave = async (style: PromptStyle) => {
  const existingIndex = customStyles.value.findIndex(s => s.id === style.id);
  
  if (existingIndex >= 0) {
    // Update existing
    customStyles.value[existingIndex] = style;
  } else {
    // Add new
    customStyles.value.push(style);
  }
  
  // Auto-select the saved style
  selectedStyleId.value = style.id;
  
  await savePromptConfig();
  editorOpen.value = false;
  editingStyle.value = null;
};

// Delete a custom style
const handleStyleDelete = async (styleId: string) => {
  customStyles.value = customStyles.value.filter(s => s.id !== styleId);
  
  // If deleted style was selected, switch to default
  if (selectedStyleId.value === styleId) {
    selectedStyleId.value = DEFAULT_STYLE_ID;
  }
  
  await savePromptConfig();
  editorOpen.value = false;
  editingStyle.value = null;
};

// Close editor
const handleEditorClose = () => {
  editorOpen.value = false;
  editingStyle.value = null;
};

const generateOutline = async () => {
  if (!topic.value) return;
  if (!config.value?.ai?.apiKey) {
    alert("请先在设置中配置 AI API Key");
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'AI 正在构思大纲...';
  try {
    // Use the selected style's outline prompt
    steps.value = await aiGenerateOutline(
      config.value, 
      topic.value,
      currentStyle.value?.outlinePrompt
    );
  } catch (e: any) {
    console.error(e);
    alert(e.message || "大纲生成失败");
  } finally {
    isLoading.value = false;
  }
};

const handleGenerate = async () => {
  if (steps.value.length === 0) return;
  if (!config.value?.ai?.apiKey) {
    alert("请先在设置中配置 AI API Key");
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'AI 正在撰写幻灯片内容...';

  try {
    const filename = props.projectName || 'slides.md';
    // Use the selected style's slide prompt
    const content = await aiGenerateSlides(
      config.value, 
      steps.value,
      currentStyle.value?.slidePrompt
    );
    await App.SaveSlides(filename, content);
    emit('update:activeView', 'editor_code');
  } catch (e: any) {
    console.error(e);
    alert(e.message || "幻灯片生成失败");
  } finally {
    isLoading.value = false;
  }
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
  <div class="flex-1 flex overflow-hidden">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
      <p class="text-white font-bold animate-pulse">{{ loadingMessage }}</p>
    </div>

    <main class="flex-1 flex flex-col bg-background-dark relative border-r border-border-dark overflow-hidden">
      <header class="h-14 border-b border-border-dark flex items-center justify-between px-8 bg-panel-dark/50 shrink-0">
        <div class="flex items-center gap-4">
          <span class="text-white text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
            <span class="material-symbols-outlined text-primary text-[20px]">account_tree</span>
            AI 生成大纲
          </span>
          <div class="h-4 w-px bg-border-dark"></div>
          <span class="text-[10px] font-bold bg-slate-800 text-[#90a4cb] px-2 py-0.5 rounded border border-border-dark uppercase">
            共 {{ steps.length }} 个幻灯片节点
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-slate-400 bg-white/5 rounded border border-white/10">
            <span class="material-symbols-outlined text-[14px] text-primary">{{ currentStyle?.icon }}</span>
            <span>{{ currentStyle?.name }}</span>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#0b0f1a]">
        <div class="max-w-3xl mx-auto flex flex-col gap-10">
          <div v-for="step in steps" :key="step.id" class="flex flex-col gap-3 relative group">
            <div class="flex items-center gap-4">
              <div :class="`size-8 rounded ${step.type === 'primary' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-[11px] font-bold shrink-0 shadow-lg border border-white/5`">
                {{ step.id }}
              </div>
              <div class="flex-1 bg-panel-dark border border-border-dark p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all shadow-xl group-hover:shadow-primary/5">
                <input
                  type="text"
                  v-model="step.title"
                  class="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full placeholder:text-slate-700"
                  placeholder="幻灯片标题..."
                />
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="removeStep(step.id)"
                    class="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="删除节点"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  <button class="text-slate-600 hover:text-white transition-colors p-1 cursor-grab">
                    <span class="material-symbols-outlined text-[18px]">drag_indicator</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="ml-12 pl-8 relative border-l border-border-dark/50 flex flex-col gap-3">
              <div v-for="(child, idx) in step.children" :key="idx" class="relative flex items-center gap-3 group/child">
                <div class="absolute -left-8 top-1/2 w-8 h-[1px] bg-border-dark/50"></div>
                <div class="flex-1 bg-slate-800/40 border border-border-dark/50 px-4 py-2.5 rounded-lg text-xs text-slate-400 italic shadow-inner group-hover/child:text-slate-200 transition-colors">
                  {{ child.label }}
                </div>
              </div>
            </div>
          </div>

          <button
            @click="addStep"
            class="ml-12 mt-2 w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-border-dark text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all uppercase tracking-widest shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            插入新大纲节点
          </button>
        </div>
      </div>

      <div class="h-28 bg-panel-dark/95 backdrop-blur-md border-t border-border-dark flex items-center justify-center px-8 shrink-0 gap-6">
          <div class="flex flex-col items-center gap-1">
            <button
            @click="handleGenerate"
            class="bg-primary text-white h-14 px-12 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div class="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            确认并生成完整幻灯片
            <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">rocket_launch</span>
          </button>
          <p class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">同步将覆盖当前编辑器内容</p>
          </div>
      </div>
    </main>

    <aside class="w-96 flex flex-col border-l border-border-dark bg-panel-dark">
      <div class="h-14 border-b border-border-dark px-4 shrink-0 flex items-center justify-center gap-2 border-b-2 border-primary text-white bg-background-dark/20">
        <span class="material-symbols-outlined text-[20px] text-primary">auto_fix_high</span>
        <span class="text-xs font-bold uppercase tracking-widest">AI 优化助手</span>
      </div>
      <div class="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <!-- Style Selector -->
        <StyleSelector
          :styles="availableStyles"
          :selectedId="selectedStyleId"
          @select="handleStyleSelect"
          @edit="handleStyleEdit"
          @add="handleStyleAdd"
        />

        <div class="h-px bg-border-dark"></div>

        <div class="flex items-start gap-3">
            <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shrink-0">
              <span class="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div class="bg-slate-800/80 border border-border-dark p-4 rounded-xl text-xs leading-relaxed text-slate-300 shadow-md">
              你好！我是大纲生成助手。当前使用 <strong class="text-primary">{{ currentStyle?.name }}</strong> 风格，请输入演示文稿主题。
            </div>
        </div>

        <div v-if="steps.length === 0" class="flex flex-col gap-3">
          <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">示例主题</h4>
          <div class="flex flex-col gap-2">
            <button @click="topic='React Hooks 深度解析'; generateOutline()" class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              React Hooks 深度解析
            </button>
             <button @click="topic='Q4 产品路线图'; generateOutline()" class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              Q4 产品路线图
            </button>
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-border-dark bg-background-dark/30">
        <div class="relative">
          <textarea
            v-model="topic"
            @keydown.enter.prevent="generateOutline"
            class="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-xs text-white focus:ring-1 focus:ring-primary placeholder:text-slate-600 resize-none h-24 shadow-inner"
            placeholder="输入主题，例如：'Golang 并发编程'..."
          ></textarea>
          <button
            @click="generateOutline"
            class="absolute bottom-3 right-3 bg-primary/20 text-primary size-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <span class="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Style Editor Drawer -->
    <StyleEditor
      :style="editingStyle"
      :isOpen="editorOpen"
      @close="handleEditorClose"
      @save="handleStyleSave"
      @delete="handleStyleDelete"
    />
  </div>
</template>
