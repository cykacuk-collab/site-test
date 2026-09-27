<template>
  <nav class="fixed top-0 w-full z-50 transition-all duration-300 glass-panel">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-20 items-center">
        <!-- Logo -->
        <NuxtLink :to="localePath('/')" class="flex-shrink-0 flex items-center cursor-pointer">
          <span class="font-serif font-bold text-2xl text-primary">[Logo WIP]</span>
        </NuxtLink>

        <!-- Desktop Menu -->
        <div class="hidden md:flex space-x-8 items-center">
          <NuxtLink :to="localePath('/') + '#accueil'" class="text-gray-600 hover:text-secondary transition font-medium">{{ $t('nav.home') }}</NuxtLink>
          <NuxtLink :to="localePath('/') + '#creations'" class="text-gray-600 hover:text-secondary transition font-medium">{{ $t('nav.products') }}</NuxtLink>
          <NuxtLink :to="localePath('/') + '#evenements'" class="text-gray-600 hover:text-secondary transition font-medium">{{ $t('nav.events') }}</NuxtLink>
          <NuxtLink :to="localePath('/') + '#apropos'" class="text-gray-600 hover:text-secondary transition font-medium">{{ $t('nav.about') }}</NuxtLink>
          <NuxtLink :to="localePath('/') + '#contact'" class="text-gray-600 hover:text-secondary transition font-medium">{{ $t('nav.contact') }}</NuxtLink>
        </div>

        <!-- Right Side: Locale & Cart -->
        <div class="flex items-center space-x-4">
          <div class="text-sm font-semibold text-gray-500 flex space-x-2">
            <NuxtLink :to="switchLocalePath('fr')" :class="{'text-primary underline': locale === 'fr', 'hover:text-primary': true}">FR</NuxtLink>
            <span>/</span>
            <NuxtLink :to="switchLocalePath('en')" :class="{'text-primary underline': locale === 'en', 'hover:text-primary': true}">EN</NuxtLink>
          </div>
          
          <button @click="isCartOpen = true" class="text-gray-600 hover:text-secondary transition relative">
            <i class="fa-solid fa-shopping-cart text-xl"></i>
            <span v-if="cartItemCount > 0" class="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {{ cartItemCount }}
            </span>
          </button>
          
          <!-- Mobile menu button -->
          <div class="md:hidden flex items-center">
            <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="text-gray-600 hover:text-primary focus:outline-none">
              <i :class="isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" class="text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div v-show="isMobileMenuOpen" class="md:hidden bg-white/95 backdrop-blur-md border-t shadow-lg absolute w-full top-20 left-0">
      <div class="px-4 pt-2 pb-6 space-y-4 flex flex-col items-center">
        <NuxtLink @click="isMobileMenuOpen = false" :to="localePath('/') + '#accueil'" class="block text-gray-800 hover:text-secondary font-medium text-lg">{{ $t('nav.home') }}</NuxtLink>
        <NuxtLink @click="isMobileMenuOpen = false" :to="localePath('/') + '#creations'" class="block text-gray-800 hover:text-secondary font-medium text-lg">{{ $t('nav.products') }}</NuxtLink>
        <NuxtLink @click="isMobileMenuOpen = false" :to="localePath('/') + '#evenements'" class="block text-gray-800 hover:text-secondary font-medium text-lg">{{ $t('nav.events') }}</NuxtLink>
        <NuxtLink @click="isMobileMenuOpen = false" :to="localePath('/') + '#apropos'" class="block text-gray-800 hover:text-secondary font-medium text-lg">{{ $t('nav.about') }}</NuxtLink>
        <NuxtLink @click="isMobileMenuOpen = false" :to="localePath('/') + '#contact'" class="block text-gray-800 hover:text-secondary font-medium text-lg">{{ $t('nav.contact') }}</NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
const { locale, setLocale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { isCartOpen, cartItemCount } = useCart()
const isMobileMenuOpen = ref(false)
</script>
