<template>
  <div>
    <!-- Elegant Hero Section (Ladurée Inspired) -->
    <header id="accueil" class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <!-- Decorative Border / Frame -->
      <div class="absolute inset-4 border border-white opacity-50 pointer-events-none rounded-sm hidden md:block"></div>
      <div class="absolute inset-6 border border-white opacity-30 pointer-events-none rounded-sm hidden md:block"></div>
      
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center gap-12">
        <!-- Text Content -->
        <div class="flex-1 text-center md:text-left">
          <h1 class="text-5xl md:text-7xl font-bold font-serif text-primary mb-6 leading-tight">
            {{ $t('hero.slogan') }}
          </h1>
          <p class="text-xl text-primary/80 mb-10 max-w-lg mx-auto md:mx-0 font-light">
            {{ $t('hero.subtitle') }}
          </p>
          <NuxtLink :to="localePath('/') + '#creations'" class="glass-panel text-primary border border-primary/20 px-8 py-4 font-serif text-lg hover:bg-white/80 transition shadow-xl inline-block rounded-sm tracking-widest uppercase text-sm font-bold">
            {{ $t('hero.cta') }}
          </NuxtLink>
        </div>
        
        <!-- Elegant Imagery -->
        <div class="flex-1 w-full max-w-md mx-auto relative">
          <div class="absolute inset-0 bg-secondary/20 rounded-full blur-3xl transform scale-110"></div>
          <img src="https://images.unsplash.com/photo-1612201142855-7873bc1661b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Tartes artisanales" class="relative z-10 w-full h-auto rounded-t-full shadow-2xl border-4 border-white/50 object-cover aspect-[3/4]">
        </div>
      </div>
    </header>

    <!-- Nos Créations Section -->
    <section id="creations" class="py-20 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-primary mb-4">{{ $t('creations.title') }}</h2>
          <div class="w-24 h-1 bg-secondary mx-auto mb-6"></div>
          <p class="text-lg text-primary/70 max-w-2xl mx-auto">{{ $t('creations.subtitle') }}</p>
        </div>

        <div v-if="loading" class="text-center text-primary/60 py-10">
          Chargement du catalogue...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div v-for="product in products" :key="product.id" class="group flex flex-col glass-panel rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-500 hover:-translate-y-1">
            <div class="relative h-80 overflow-hidden mb-6">
              <img :src="product.image_url || 'https://via.placeholder.com/800'" :alt="locale === 'en' ? product.name_en : product.name_fr" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500">
              <div class="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition"></div>
              <div v-if="product.stock <= 0" class="absolute top-4 right-4 bg-red-600/90 backdrop-blur text-white px-3 py-1 text-sm font-bold rounded shadow">Épuisé</div>
            </div>
            
            <div class="px-6 pb-6 flex flex-col flex-grow">
              <h3 class="text-2xl font-bold text-primary mb-2">{{ locale === 'en' ? product.name_en : product.name_fr }}</h3>
              <p class="text-primary/70 mb-6 flex-grow">{{ locale === 'en' ? product.description_en : product.description_fr }}</p>
              
              <div class="flex justify-between items-center mt-auto border-t border-primary/10 pt-4">
                <span class="text-xl font-bold text-primary">${{ (product.price_cents / 100).toFixed(2) }}</span>
                <button @click="addToCart(product)" :disabled="product.stock <= 0" class="bg-secondary/90 backdrop-blur text-white px-5 py-2.5 rounded-sm font-bold hover:bg-secondary transition disabled:opacity-50 shadow-md">
                  <i class="fa-solid fa-cart-plus mr-2"></i> {{ locale === 'en' ? 'Add to cart' : 'Ajouter' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


  </div>
</template>

<script setup>
const localePath = useLocalePath()
const route = useRoute()
const { locale } = useI18n()
const supabase = useSupabaseClient()

const products = ref([])
const loading = ref(true)

const { addToCart, clearCart } = useCart()

onMounted(async () => {
  if (route.query.success === 'true') {
    clearCart()
  }

  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  products.value = data || []
  loading.value = false
})
</script>


