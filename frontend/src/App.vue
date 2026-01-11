<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AppView } from './types';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';

// State (mocking what was in App.tsx)
const activeView = ref('dashboard');
const activeProjectName = ref('slides.md');
// const markdown = ref(''); // If this needs to be global, use a store. For now, we might pass it or just let views handle it.
const activeSlideIndex = ref(0);

const router = useRouter();

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
      />

      <main class="flex-1 flex overflow-hidden">
        <router-view
          :activeView="activeView"
          :projectName="activeProjectName"
          :activeSlideIndex="activeSlideIndex"
          @update:activeView="handleNavigate"
          @update:projectName="(n) => activeProjectName = n"
          @update:activeSlideIndex="setActiveSlideIndex"
        ></router-view>
      </main>
    </div>

    <Footer :activeView="activeView" />
  </div>
</template>

<style>
/* Global styles are in style.css, but we can add specific overrides here if needed */
</style>
