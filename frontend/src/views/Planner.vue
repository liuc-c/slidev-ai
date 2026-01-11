<script setup lang="ts">
import { ref } from 'vue';
import { OutlineItem } from '../types';

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
  // (e: 'generate', markdown: string): void; // We are handling generation by updating parent potentially, but passing back via event is fine.
  // Actually the React code updated state directly. Here we can maybe just emit an event to navigate,
  // and we'd need a way to pass the generated markdown.
  // Since we don't have a global store set up fully, I'll mock the behavior or just emit an event
  // that the parent App.vue could handle if we extended it,
  // but for now I'll just navigate back to Editor.
}>();

const steps = ref<OutlineItem[]>([
  {
    id: '01',
    title: '标题: Slidev AI 深度解析',
    type: 'primary',
    children: [ { label: '副标题: 探索演示文稿的未来', type: 'detail' } ]
  },
  {
    id: '02',
    title: '介绍: 什么是 Slidev?',
    type: 'secondary',
    children: [
      { label: '内容: 核心优势', type: 'content' },
      { label: '内容: 技术栈选型', type: 'content' }
    ]
  },
  {
    id: '03',
    title: '核心功能演示',
    type: 'secondary',
    children: [
      { label: '内容: 代码实时预览', type: 'content' },
      { label: '内容: AI 辅助编辑', type: 'content' }
    ]
  },
]);

const addStep = () => {
  const nextId = (steps.value.length + 1).toString().padStart(2, '0');
  steps.value.push({
    id: nextId,
    title: '新幻灯片标题',
    type: 'secondary',
    children: [{ label: '待补充内容...', type: 'content' }]
  });
};

const handleGenerate = () => {
  let md = `---
theme: seriph
background: https://picsum.photos/id/20/1920/1080
---
`;
  steps.value.forEach((step, idx) => {
    md += `\n# ${step.title}\n\n${step.children.map(c => `- ${c.label}`).join('\n')}\n`;
    if (idx < steps.value.length - 1) md += `\n---\n`;
  });
  // In a real app, we would update the markdown state here.
  // Since we don't have a shared store connecting Planner to Editor easily without prop drilling or Pinia,
  // I will just navigate to editor_code.
  // The Editor component uses its own local state in this migration.
  emit('update:activeView', 'editor_code');
};

const removeStep = (id: string) => {
  steps.value = steps.value.filter(s => s.id !== id);
};
</script>

<template>
  <div class="flex-1 flex overflow-hidden">
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
          <button class="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors bg-white/5 rounded border border-white/10">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>
            重置提示词
          </button>
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
        <div class="flex items-start gap-3">
            <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shrink-0">
              <span class="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div class="bg-slate-800/80 border border-border-dark p-4 rounded-xl text-xs leading-relaxed text-slate-300 shadow-md">
              你好！我是大纲生成助手。我已经根据你的初始要求生成了一个基本大纲。
              <br/><br/>
              你可以直接<b>点击标题</b>进行修改，或者在下方提出新的要求，让我为你重新规划。
            </div>
        </div>

        <div class="flex flex-col gap-3">
          <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">常用优化</h4>
          <div class="grid grid-cols-2 gap-2">
            <button class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              增加技术深度
            </button>
            <button class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              减少演示时间
            </button>
            <button class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              添加交互提示
            </button>
            <button class="px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-all text-left">
              更口语化一些
            </button>
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-border-dark bg-background-dark/30">
        <div class="relative">
          <textarea
            class="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-xs text-white focus:ring-1 focus:ring-primary placeholder:text-slate-600 resize-none h-24 shadow-inner"
            placeholder="提出优化建议，例如：'让整体风格更幽默一点'..."
          ></textarea>
          <button class="absolute bottom-3 right-3 bg-primary/20 text-primary size-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <span class="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
