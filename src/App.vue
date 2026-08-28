<template>
  <div class="min-h-screen flex flex-col relative font-sans text-slate-800 bg-[#fafcff]">
    
    <!-- No global header as per Zero-Nav overhaul -->

    <main class="flex-1 w-full relative flex flex-col">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" v-if="route.meta.keepAlive" :key="route.path" />
        </keep-alive>
        <component :is="Component" v-if="!route.meta.keepAlive" :key="route.path" />
      </router-view>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
</script>

<style scoped>
/* Simplified global styles for Zero-Nav overhaul */
:deep(.premium-nav-dropdown) {
  border-radius: 10px !important;
  padding: 8px !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1) !important;
  min-width: 200px !important;
}

:deep(.el-dropdown-menu__item) {
  border-radius: 6px !important;
  margin: 2px 0 !important;
  padding: 10px 16px !important;
  transition: all 0.2s ease !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f8fafc !important;
  color: #2563eb !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
