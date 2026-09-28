<template>
  <div class="glass-bg text-gray-800 antialiased font-sans flex flex-col min-h-screen">
    <!-- Admin Header / Navbar -->
    <header class="sticky top-0 z-40 glass-panel border-b border-white/60 shadow-sm transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20 items-center">
          
          <!-- Left: Brand & Admin Tag -->
          <div class="flex items-center space-x-6">
            <NuxtLink to="/admin" class="flex items-center space-x-3 group">
              <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm group-hover:bg-primary/90 transition">
                <i class="fa-solid fa-cookie-bite text-secondary text-lg"></i>
              </div>
              <div>
                <div class="font-serif font-bold text-xl text-primary leading-tight">Histoire et Saveurs</div>
                <div class="text-[11px] font-semibold tracking-wider uppercase text-primary/70">Administration</div>
              </div>
            </NuxtLink>

            <!-- Desktop Navigation Tabs -->
            <nav class="hidden md:flex items-center space-x-1 pl-4 border-l border-gray-200">
              <NuxtLink
                to="/admin"
                class="px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2"
                :class="isOverviewActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary hover:bg-white/60'"
              >
                <i class="fa-solid fa-chart-pie text-xs" :class="isOverviewActive ? 'text-secondary' : ''"></i>
                <span>Vue d'ensemble</span>
              </NuxtLink>

              <NuxtLink
                to="/admin/products"
                class="px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2"
                :class="isProductsActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary hover:bg-white/60'"
              >
                <i class="fa-solid fa-boxes-stacked text-xs" :class="isProductsActive ? 'text-secondary' : ''"></i>
                <span>Produits &amp; Stocks</span>
              </NuxtLink>

              <NuxtLink
                to="/admin/orders"
                class="px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2"
                :class="isOrdersActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary hover:bg-white/60'"
              >
                <i class="fa-solid fa-receipt text-xs" :class="isOrdersActive ? 'text-secondary' : ''"></i>
                <span>Commandes</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- Right: Store Link, Admin Profile, Logout -->
          <div class="hidden lg:flex items-center space-x-4">
            <!-- Link to public storefront -->
            <NuxtLink
              to="/"
              target="_blank"
              class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary/80 hover:text-primary bg-white/70 hover:bg-white border border-gray-200 transition"
              title="Ouvrir la boutique dans un nouvel onglet"
            >
              <i class="fa-solid fa-store text-secondary text-sm"></i>
              <span>Voir la boutique</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-0.5 opacity-60"></i>
            </NuxtLink>

            <!-- Admin Profile Pill -->
            <div class="flex items-center space-x-2.5 bg-white/80 border border-gray-200/80 px-3 py-1.5 rounded-full shadow-xs">
              <div class="w-7 h-7 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                <i class="fa-solid fa-user-shield text-xs"></i>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-medium text-gray-700 max-w-[150px] truncate" :title="userEmail">
                  {{ userEmail }}
                </span>
                <span class="bg-[#EDF6ED] text-[#555B56] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#555B56]/20">
                  Admin
                </span>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              :disabled="isLoggingOut"
              class="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition disabled:opacity-50"
            >
              <i class="fa-solid fa-right-from-bracket text-xs"></i>
              <span>{{ isLoggingOut ? 'Déconnexion...' : 'Déconnexion' }}</span>
            </button>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <div class="flex md:hidden items-center space-x-2">
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-white/60 focus:outline-none"
              aria-label="Menu"
            >
              <i :class="isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" class="text-xl"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div v-show="isMobileMenuOpen" class="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3">
        <div class="space-y-1">
          <NuxtLink
            to="/admin"
            @click="isMobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="isOverviewActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-chart-pie mr-2 text-xs"></i>
            Vue d'ensemble
          </NuxtLink>

          <NuxtLink
            to="/admin/products"
            @click="isMobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="isProductsActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-boxes-stacked mr-2 text-xs"></i>
            Produits &amp; Stocks
          </NuxtLink>

          <NuxtLink
            to="/admin/orders"
            @click="isMobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="isOrdersActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-receipt mr-2 text-xs"></i>
            Commandes
          </NuxtLink>

          <NuxtLink
            to="/"
            target="_blank"
            @click="isMobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <i class="fa-solid fa-store mr-2 text-xs text-secondary"></i>
            Voir la boutique
          </NuxtLink>
        </div>

        <div class="pt-3 border-t border-gray-200 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-xs">
              <i class="fa-solid fa-user-shield text-xs"></i>
            </div>
            <span class="text-xs text-gray-700 font-medium truncate max-w-[160px]">{{ userEmail }}</span>
          </div>
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition"
          >
            <i class="fa-solid fa-right-from-bracket mr-1"></i>
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <!-- Main Admin Content -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Global Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from '~/components/ToastContainer.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const isMobileMenuOpen = ref(false)
const isLoggingOut = ref(false)

const userEmail = computed(() => {
  return user.value?.email || 'admin@histoiresetsaveurs.ca'
})

// Tab active helpers
const isOverviewActive = computed(() => {
  return route.path === '/admin' || route.path === '/admin/'
})

const isProductsActive = computed(() => {
  return route.path.startsWith('/admin/products')
})

const isOrdersActive = computed(() => {
  return route.path.startsWith('/admin/orders')
})

// Logout handling
const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.error('SignOut error:', err)
  } finally {
    isLoggingOut.value = false
    await navigateTo('/admin/login')
  }
}
</script>
