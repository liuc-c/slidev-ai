<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
}>();

const models = ref([
  { name: 'llama3:8b', size: '4.7GB', selected: true },
  { name: 'mistral:latest', size: '4.1GB', selected: false },
  { name: 'codellama:7b', size: '3.8GB', selected: false },
]);

const menuItems = ref([
  { icon: 'person', label: '常规', active: false },
  { icon: 'palette', label: '外观', active: false },
  { icon: 'smart_toy', label: 'AI 模型', active: true },
  { icon: 'extension', label: '插件', active: false },
  { icon: 'terminal', label: '系统信息', active: false },
]);

const onClose = () => {
  emit('update:activeView', 'dashboard');
};
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <nav class="w-64 border-r border-border-dark bg-panel-dark p-4 flex flex-col gap-1 shrink-0 h-full">
      <p class="text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3 px-3 opacity-60">首选项</p>
      <a
        v-for="(item, idx) in menuItems"
        :key="idx"
        :class="`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-[#90a4cb] hover:text-white'}`"
        href="#"
      >
        <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
        <p class="text-xs font-bold uppercase tracking-wider">{{ item.label }}</p>
      </a>
    </nav>

    <main class="flex-1 overflow-y-auto custom-scrollbar bg-background-dark p-12">
      <div class="max-w-3xl mx-auto space-y-12 pb-20">
        <section>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-white mb-2">模型提供商</h2>
            <p class="text-sm text-[#90a4cb] font-medium">选择用于生成和辅助幻灯片的 AI 提供商</p>
          </div>

          <div class="space-y-8">
            <div>
              <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">提供商</label>
              <div class="relative max-w-md">
                <select class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-3 text-sm text-white appearance-none focus:ring-1 focus:ring-primary focus:border-primary">
                  <option value="ollama">Ollama (本地)</option>
                  <option value="openai">OpenAI (云端)</option>
                  <option value="deepseek">DeepSeek (云端)</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-3 text-[#90a4cb] pointer-events-none">expand_more</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl opacity-40">
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">API 密钥</label>
                <input class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary" disabled placeholder="sk-••••••••••••••••" type="password" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">代理地址</label>
                <input class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary" disabled placeholder="https://api.openai.com/v1" type="text" />
              </div>
            </div>

            <div class="bg-panel-dark border border-border-dark rounded-2xl p-8 space-y-8 shadow-2xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="size-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                  <span class="font-mono text-sm text-white font-bold tracking-tight">localhost:11434</span>
                </div>
                <span class="text-[10px] font-bold bg-green-500/10 text-green-500 px-3 py-1 rounded border border-green-500/20 uppercase tracking-widest">已连接</span>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-4">可用的本地模型</label>
                <div class="grid grid-cols-1 gap-3">
                  <label
                    v-for="model in models"
                    :key="model.name"
                    :class="`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${model.selected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border-dark hover:border-[#4b6392]'}`"
                  >
                    <input type="radio" :checked="model.selected" name="model" class="text-primary focus:ring-primary bg-background-dark border-border-dark" />
                    <div class="flex-1 flex items-center justify-between">
                      <span :class="`text-sm font-bold font-mono ${model.selected ? 'text-white' : 'text-[#90a4cb]'}`">{{ model.name }}</span>
                      <span class="text-[10px] text-[#90a4cb] font-bold font-mono">{{ model.size }}</span>
                    </div>
                  </label>
                </div>
                <button class="mt-6 flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest hover:underline transition-all">
                  <span class="material-symbols-outlined text-sm">download</span>
                  拉取更多模型
                </button>
              </div>
            </div>
          </div>
        </section>

        <hr class="border-border-dark opacity-30" />

        <section>
          <div class="mb-6">
            <h2 class="text-xl font-bold text-white mb-2">全局引擎</h2>
            <p class="text-xs text-[#90a4cb] font-bold uppercase tracking-widest">运行时环境和 CLI 版本</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-panel-dark/50 border border-border-dark rounded-xl p-5 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                  <span class="material-symbols-outlined">javascript</span>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-[#90a4cb] uppercase font-mono tracking-widest">Node.js 版本</p>
                  <p class="text-white font-mono text-sm font-bold">v20.12.2</p>
                </div>
              </div>
              <span class="text-[10px] text-green-500 font-bold px-2 py-0.5 bg-green-500/10 rounded uppercase">LTS</span>
            </div>
            <div class="bg-panel-dark/50 border border-border-dark rounded-xl p-5 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">terminal</span>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-[#90a4cb] uppercase font-mono tracking-widest">Slidev CLI</p>
                  <p class="text-white font-mono text-sm font-bold">v0.48.0</p>
                </div>
              </div>
              <button class="text-[10px] text-primary font-bold hover:underline uppercase">检查更新</button>
            </div>
          </div>
        </section>

        <div class="flex items-center justify-end gap-4 pt-10">
          <button
            @click="onClose"
            class="px-8 py-2.5 rounded-xl text-xs font-bold text-[#90a4cb] hover:text-white transition-colors uppercase tracking-widest"
          >
            取消
          </button>
          <button
            @click="onClose"
            class="px-10 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all uppercase tracking-widest"
          >
            保存配置
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
