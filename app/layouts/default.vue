<template>
  <div class="glass-bg text-gray-800 antialiased font-sans flex flex-col min-h-screen">
    <Navbar />
    <Cart />
    <ToastContainer />
    <main class="flex-grow pt-20">
      <slot />
    </main>
    <Footer />
    <CookieBanner />
  </div>
</template>

<script setup>
import Navbar from '~/components/Navbar.vue'
import ToastContainer from '~/components/ToastContainer.vue'
</script>

<style>
/* Global CSS variables from Tailwind config earlier */
body {
  font-family: 'Inter', sans-serif;
}
h1, h2, h3, h4, h5, h6, .font-serif {
  font-family: 'Playfair Display', serif;
}
html {
  scroll-behavior: smooth;
}

/* Glass Theme Inspiration */
.glass-bg {
  background:
    radial-gradient(65% 75% at 80% 5%, rgba(237, 246, 237, 0.8), transparent 70%), /* accent: pale mint */
    radial-gradient(55% 65% at 10% 95%, rgba(232, 221, 204, 0.6), transparent 70%), /* secondary: warm sand */
    #faf9f6; /* beige */
  background-attachment: fixed;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px) saturate(115%);
  -webkit-backdrop-filter: blur(12px) saturate(115%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    inset 0 1px 0 0 rgba(255, 255, 255, 0.8),
    0 8px 32px 0 rgba(85, 91, 86, 0.05); /* shadow tinted with primary dark gray-green */
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
