<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AppView } from './types';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import * as App from '../wailsjs/go/main/App';

// State (mocking what was in App.tsx)
const activeView = ref('dashboard');
const activeProjectName = ref('slides.md');
const markdown = ref('');
const activeSlideIndex = ref(0);
const slidevUrl = ref('');

const router = useRouter();

// Parse markdown to get slide structure
const slides = computed(() => {
  if (!markdown.value) return [];
  // Simple splitting by ---
  const rawSlides = markdown.value.split(/^---$/m);

  // Filter out frontmatter if it exists (first item usually empty or frontmatter)
  // Standard Slidev:
  // --- (optional)
  // frontmatter
  // ---
  // slide 1

  let validSlides = [];
  let startIndex = 0;

  // Check frontmatter
  if (markdown.value.startsWith('---')) {
     // Skip frontmatter
     startIndex = 2; // parts[0] is empty, parts[1] is frontmatter
  }

  // Actually simpler: split, then map.
  // We need to match the logic of Editor's preview count.
  const allParts = rawSlides.map(s => s.trim()).filter(s => s);
  const contentSlides = allParts.filter(s => !s.startsWith('theme:')); // Crude check for frontmatter

  return contentSlides.map((s, i) => {
    const lines = s.split('\n');
    const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') ||
                  lines.find(l => l.startsWith('## '))?.replace('## ', '') ||
                  `Page ${i + 1}`;
    return {
      id: i,
      label: `${(i+1).toString().padStart(2, '0')}: ${title.substring(0, 20)}`
    };
  });
});

// Update activeView based on route
router.afterEach((to) => {
  if (to.name === 'Dashboard') activeView.value = 'dashboard';
  else if (to.name === 'Editor') activeView.value = 'editor_code'; // Or editor_ai
  else if (to.name === 'Planner') activeView.value = 'planner';
  else if (to.name === 'Settings') activeView.value = 'settings';
});

const handleNavigate = (view: string) => {
  activeView.value = view;
  if (view === 'dashboard') router.push('/');
  else if (view === 'editor_code' || view === 'editor_ai') router.push('/editor');
  else if (view === 'planner') router.push('/planner');
  else if (view === 'settings') router.push('/settings');
};

const setActiveSlideIndex = (index: number) => {
  activeSlideIndex.value = index;
};

// Auto-save logic
let saveTimer: any;
watch(markdown, (newValue) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
        await App.SaveSlides(newValue);
    } catch (e) {
        console.error("Failed to save slides", e);
    }
  }, 1000); // 1s debounce
});

onMounted(async () => {
  try {
    // Start server once
    const url = await App.StartSlidevServer();
    slidevUrl.value = url;

    // Read content
    markdown.value = await App.ReadSlides();
  } catch (e) {
    console.error("Failed to init app", e);
  }
});

</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-background-dark text-slate-100 font-display">
    <Header
      :activeView="activeView"
      :projectName="activeProjectName"
      @navigate="handleNavigate"
    />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar
        v-if="activeView !== 'dashboard' && activeView !== 'settings'"
        :activeView="activeView"
        @navigate="handleNavigate"
        :activeSlideIndex="activeSlideIndex"
        @selectSlide="setActiveSlideIndex"
        :slides="slides"
      />

      <main class="flex-1 flex overflow-hidden">
        <router-view
          :activeView="activeView"
          :projectName="activeProjectName"
          :activeSlideIndex="activeSlideIndex"
          v-model:markdown="markdown"
          :slidevUrl="slidevUrl"
          @update:activeView="handleNavigate"
          @update:projectName="(n) => activeProjectName = n"
          @update:activeSlideIndex="setActiveSlideIndex"
        ></router-view>
      </main>
    </div>

    <Footer :activeView="activeView" @navigate="handleNavigate" />
  </div>
</template>

<style>
/* Global styles are in style.css, but we can add specific overrides here if needed */
</style>
