<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="glass-panel px-6 py-3 rounded-sm shadow-xl border flex items-center gap-3 transform transition-all duration-300"
        :class="{
          'border-secondary/50 text-primary': toast.type === 'success',
          'border-red-500/50 text-red-600': toast.type === 'error'
        }"
      >
        <i v-if="toast.type === 'success'" class="fa-solid fa-check-circle text-secondary"></i>
        <i v-else class="fa-solid fa-exclamation-circle text-red-500"></i>
        <span class="font-medium text-sm">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
