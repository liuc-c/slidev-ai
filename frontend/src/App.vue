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
  
  // Standard Slidev separator
  const rawSlides = markdown.value.split(/^---$/m);

  let contentSlides = [];
  // Slidev usually has frontmatter first. 
  // If it starts with ---, parts[0] is empty, parts[1] is frontmatter, parts[2] is slide 1.
  let startIndex = 0;
  if (markdown.value.trim().startsWith('---')) {
      startIndex = 2;
  } else {
      startIndex = 0;
  }

  const allParts = rawSlides.map(s => s.trim());
  const actualSlides = allParts.slice(startIndex).filter(s => s.length > 0);

  return actualSlides.map((s, i) => {
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
  else if (to.name === 'Editor') activeView.value = 'editor_ai'; // Or editor_ai

  else if (to.name === 'Planner') activeView.value = 'planner';
  else if (to.name === 'Settings') activeView.value = 'settings';
});

const handleNavigate = (view: string) => {
  activeView.value = view;
  if (view === 'dashboard') router.push('/');
  else if (view === 'editor_ai') router.push('/editor');

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
        await App.SaveSlides(activeProjectName.value, newValue);
    } catch (e) {
        console.error("Failed to save slides", e);
    }
  }, 1000); // 1s debounce
});

// Watch for project name changes to reload content and server
watch(activeProjectName, async (newName, oldName) => {
  if (!newName || newName === oldName) return;
  try {
    markdown.value = await App.ReadSlides(newName);
    activeSlideIndex.value = 0;
    
    // Start server for new file
    slidevUrl.value = ""; // Show loading
    const url = await App.StartSlidevServer(newName);
    
    // Ensure we are still on the same project when response arrives
    if (activeProjectName.value === newName) {
      slidevUrl.value = url;
    }
  } catch (e) {
    console.error("Failed to switch project", e);
  }
});

onMounted(async () => {
  try {
    // 1. Read content immediately (use current activeProjectName)
    markdown.value = await App.ReadSlides(activeProjectName.value);

    // 2. Start server in parallel (don't block the UI)
    App.StartSlidevServer(activeProjectName.value).then(url => {
      slidevUrl.value = url;
    }).catch(e => {
      console.error("Failed to start slidev server", e);
    });
    
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
      :slidevUrl="slidevUrl"
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
        :projectName="activeProjectName"
      />


      <main class="flex-1 flex overflow-hidden">
        <router-view
          :activeView="activeView"
          :projectName="activeProjectName"
          :activeSlideIndex="activeSlideIndex"
          v-model:markdown="markdown"
          :slidevUrl="slidevUrl"
          @update:activeView="handleNavigate"
          @update:projectName="(n) => (activeProjectName = n)"
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
