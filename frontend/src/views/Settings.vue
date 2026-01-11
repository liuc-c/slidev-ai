<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as App from '../../wailsjs/go/main/App';

const emit = defineEmits<{
  (e: 'update:activeView', view: string): void;
}>();

const models = ref([
  { name: 'llama3:8b', size: '4.7GB', selected: true },
  { name: 'mistral:latest', size: '4.1GB', selected: false },
  { name: 'gpt-4o', size: 'Cloud', selected: false },
]);

const config = ref({
  ai: {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4o'
  }
});


const menuItems = ref([
  { icon: 'person', label: '常规', active: false },
  { icon: 'palette', label: '外观', active: false },
  { icon: 'smart_toy', label: 'AI 模型', active: true },
  { icon: 'extension', label: '插件', active: false },
  { icon: 'terminal', label: '系统信息', active: false },
]);

onMounted(async () => {
  try {
    const cfg = await App.GetSettings();
    if (cfg && cfg.ai) {
      config.value = cfg;
      // Update selected model in UI if possible
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
});

const saveSettings = async () => {
  try {
    await App.SaveSettings(config.value);
    emit('update:activeView', 'dashboard');
  } catch (e) {
    console.error("Failed to load settings", e);
  }
};


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
                <select v-model="config.ai.provider" class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-3 text-sm text-white appearance-none focus:ring-1 focus:ring-primary focus:border-primary">
                  <option value="openai">OpenAI</option>
                  <option value="openai-compatible">OpenAI Compatible</option>
                  <option value="google">Google Gemini</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>

                <span class="material-symbols-outlined absolute right-3 top-3 text-[#90a4cb] pointer-events-none">expand_more</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl opacity-100">
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">API 密钥</label>
                <input v-model="config.ai.apiKey" class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary" placeholder="sk-••••••••••••••••" type="password" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">API 地址</label>
                <input v-model="config.ai.baseUrl" class="w-full bg-panel-dark border border-border-dark rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary" placeholder="https://api.openai.com/v1" type="text" />
              </div>
            </div>

             <div>
                  <label class="block text-[10px] font-bold text-[#90a4cb] uppercase tracking-widest mb-3">模型名称</label>
                  <input v-model="config.ai.model" class="w-full max-w-md bg-panel-dark border border-border-dark rounded-lg px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary" placeholder="gpt-4o, claude-3-5-sonnet-latest, or gemini-1.5-pro" type="text" />
             </div>

          </div>
        </section>

        <hr class="border-border-dark opacity-30" />

        <div class="flex items-center justify-end gap-4 pt-10">
          <button
            @click="onClose"
            class="px-8 py-2.5 rounded-xl text-xs font-bold text-[#90a4cb] hover:text-white transition-colors uppercase tracking-widest"
          >
            取消
          </button>
          <button
            @click="saveSettings"
            class="px-10 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all uppercase tracking-widest"
          >
            保存配置
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
