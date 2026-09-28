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
          <NuxtLink :to="localePath('/') + '#creations'" class="glass-panel text-primary border border-primary/20 px-8 py-4 font-serif text-lg hover:bg-white/80 transition shadow-xl inline-block rounded-sm tracking-widest uppercase text-sm font-bold mb-6">
            {{ $t('hero.cta') }}
          </NuxtLink>
          <div class="flex justify-center md:justify-start gap-4">
            <span class="text-xs uppercase tracking-wider font-bold text-primary/70 flex items-center"><i class="fa-solid fa-check text-secondary mr-2"></i> {{ locale === 'en' ? 'Handmade in Quebec' : 'Fait main au Québec' }}</span>
            <span class="text-xs uppercase tracking-wider font-bold text-primary/70 flex items-center"><i class="fa-solid fa-leaf text-secondary mr-2"></i> {{ locale === 'en' ? 'Local Ingredients' : 'Ingrédients locaux' }}</span>
          </div>
        </div>
        
        <!-- Elegant Imagery -->
        <div class="flex-1 w-full max-w-md mx-auto relative">
          <div class="absolute inset-0 bg-secondary/20 rounded-full blur-3xl transform scale-110"></div>
          <NuxtImg 
            src="https://images.unsplash.com/photo-1612201142855-7873bc1661b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Tartes artisanales" 
            format="webp"
            preload
            class="relative z-10 w-full h-auto rounded-t-full shadow-2xl border-4 border-white/50 object-cover aspect-[3/4]" />
        </div>
      </div>
    </header>

    <!-- The Story / About Us (#apropos) -->
    <section id="apropos" class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="flex flex-col md:flex-row items-center gap-16 glass-panel p-8 md:p-12 rounded-2xl border border-white/40 shadow-2xl">
          <div class="flex-1">
            <NuxtImg 
              src="https://images.unsplash.com/photo-1555507036-ab1e4006a0a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Notre Atelier" 
              format="webp"
              class="w-full h-auto rounded-xl shadow-lg border-2 border-white/30 object-cover aspect-square" />
          </div>
          <div class="flex-1 text-center md:text-left">
            <h2 class="text-4xl font-bold font-serif text-primary mb-4">{{ locale === 'en' ? 'Our Story' : 'Notre Histoire' }}</h2>
            <div class="w-16 h-1 bg-secondary mx-auto md:mx-0 mb-8"></div>
            <p class="text-lg text-primary/80 mb-6 font-light leading-relaxed">
              {{ locale === 'en' ? 'Born from a passion for authentic French pastry, our atelier creates artisanal crusts that elevate your baking.' : 'Nés d\'une passion pour la pâtisserie française authentique, notre atelier crée des croûtes artisanales qui subliment vos créations.' }}
            </p>
            <p class="text-lg text-primary/80 font-light leading-relaxed mb-8">
              {{ locale === 'en' ? 'Every piece is crafted by hand in small batches, using only the finest local ingredients and pure butter to ensure a perfect, flaky texture.' : 'Chaque pièce est confectionnée à la main en petites quantités, en utilisant uniquement les meilleurs ingrédients locaux et du pur beurre pour garantir une texture feuilletée parfaite.' }}
            </p>
            <div class="font-serif text-2xl text-primary italic">
              — {{ locale === 'en' ? 'The Artisans' : 'Les Artisans' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Nos Créations Section (#creations) -->
    <section id="creations" class="py-24 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-serif text-primary mb-4">{{ $t('creations.title') }}</h2>
          <div class="w-24 h-1 bg-secondary mx-auto mb-6"></div>
          <p class="text-lg text-primary/70 max-w-2xl mx-auto">{{ $t('creations.subtitle') }}</p>
        </div>

        <div v-if="loading" class="text-center text-primary/60 py-10">
          {{ locale === 'en' ? 'Loading catalogue...' : 'Chargement du catalogue...' }}
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div v-for="(product, index) in products" :key="product.id" class="group flex flex-col glass-panel rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-500 hover:-translate-y-1 relative">
            
            <!-- Scarcity / Best Seller Badges -->
            <div class="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <div v-if="index === 0" class="bg-secondary/90 backdrop-blur text-white px-3 py-1 text-xs font-bold rounded shadow uppercase tracking-wider">
                {{ locale === 'en' ? 'Bestseller' : 'Meilleur Vendeur' }}
              </div>
              <div class="bg-primary/90 backdrop-blur text-white px-3 py-1 text-xs font-bold rounded shadow uppercase tracking-wider flex items-center">
                <i class="fa-solid fa-fire mr-1"></i> {{ locale === 'en' ? 'Small Batch' : 'Fait Main' }}
              </div>
            </div>

            <div class="relative h-80 overflow-hidden mb-0">
              <NuxtImg 
                :src="product.image_url || 'https://via.placeholder.com/800'" 
                :alt="locale === 'en' ? product.name_en : product.name_fr" 
                loading="lazy"
                format="webp"
                sizes="sm:100vw md:50vw lg:33vw"
                class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
              <div class="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition"></div>
              <div v-if="product.stock <= 0" class="absolute top-4 right-4 bg-red-600/90 backdrop-blur text-white px-3 py-1 text-sm font-bold rounded shadow">
                {{ locale === 'en' ? 'Sold Out' : 'Épuisé' }}
              </div>
            </div>
            
            <div class="px-6 py-6 flex flex-col flex-grow relative z-10 bg-white/40 backdrop-blur-md">
              <div class="flex gap-2 mb-3">
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/60 text-primary rounded-full border border-primary/10">100% Beurre</span>
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/60 text-primary rounded-full border border-primary/10">Sans Gluten</span>
              </div>
              <h3 class="text-2xl font-bold font-serif text-primary mb-2">{{ locale === 'en' ? product.name_en : product.name_fr }}</h3>
              <p class="text-primary/70 mb-6 flex-grow text-sm">{{ locale === 'en' ? product.description_en : product.description_fr }}</p>
              
              <div class="flex justify-between items-center mt-auto border-t border-primary/10 pt-4">
                <span class="text-xl font-bold text-primary">${{ (product.price_cents / 100).toFixed(2) }}</span>
                <button @click="addToCart(product)" :disabled="availableStock(product) <= 0" class="bg-secondary/90 backdrop-blur text-white px-5 py-2.5 rounded-sm font-bold hover:bg-secondary transition disabled:opacity-50 shadow-md text-sm uppercase tracking-wider">
                  <i class="fa-solid fa-cart-plus mr-2"></i> {{ availableStock(product) <= 0 ? (locale === 'en' ? 'Max in cart' : 'Max atteint') : (locale === 'en' ? 'Add' : 'Ajouter') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof & Testimonials (#temoignages) -->
    <section id="temoignages" class="py-24 relative bg-primary/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-serif text-primary mb-4">{{ locale === 'en' ? 'What Our Customers Say' : 'Ce que disent nos clients' }}</h2>
          <div class="w-24 h-1 bg-secondary mx-auto mb-6"></div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="testimonial in testimonials" :key="testimonial.name" class="glass-panel p-8 rounded-xl shadow-lg border border-white/50 relative">
            <div class="text-secondary text-4xl absolute top-4 left-4 opacity-20"><i class="fa-solid fa-quote-left"></i></div>
            <div class="flex items-center gap-2 mb-4 text-yellow-500 text-sm">
              <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
            </div>
            <p class="text-primary/80 italic mb-6 relative z-10">
              {{ locale === 'en' ? testimonial.text_en : testimonial.text_fr }}
            </p>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {{ testimonial.initial }}
              </div>
              <div>
                <div class="font-bold text-primary">{{ testimonial.name }}</div>
                <div class="text-xs text-primary/50">{{ locale === 'en' ? 'Verified Buyer' : 'Acheteur Vérifié' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Events & Catering (#evenements) -->
    <section id="evenements" class="py-24 relative">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div class="md:w-1/2 relative h-64 md:h-auto">
            <NuxtImg 
              src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Catering Events" 
              format="webp"
              class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
          </div>
          <div class="md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white/60 backdrop-blur-md">
            <h2 class="text-3xl font-bold font-serif text-primary mb-4">{{ locale === 'en' ? 'Events & Catering' : 'Événements & Traiteur' }}</h2>
            <div class="w-16 h-1 bg-secondary mb-6"></div>
            <p class="text-primary/80 mb-8 leading-relaxed">
              {{ locale === 'en' ? 'Planning a wedding, corporate event, or large gathering? We offer special bulk pricing and custom orders for your special occasions. Let us provide the perfect artisanal touch.' : 'Vous planifiez un mariage, un événement corporatif ou une grande réception ? Nous offrons des prix de gros et des commandes sur mesure pour vos occasions spéciales. Laissez-nous apporter la touche artisanale parfaite.' }}
            </p>
            <NuxtLink :to="localePath('/') + '#contact'" class="bg-primary text-white text-center px-6 py-3 rounded-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-lg text-sm w-fit">
              {{ locale === 'en' ? 'Request a Quote' : 'Demander une soumission' }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section (#faq) -->
    <section id="faq" class="py-24 relative bg-white/30">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-serif text-primary mb-4">{{ locale === 'en' ? 'Frequently Asked Questions' : 'Foire aux questions' }}</h2>
          <div class="w-24 h-1 bg-secondary mx-auto"></div>
        </div>
        
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="glass-panel border border-white/60 rounded-lg overflow-hidden shadow-sm">
            <details class="group">
              <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-lg text-primary font-serif">
                <span>
                  {{ locale === 'en' 
                    ? (i === 1 ? 'How long do the crusts last?' : i === 2 ? 'Do you offer gluten-free options?' : 'How should I reheat my tart?') 
                    : (i === 1 ? 'Combien de temps se conservent les croûtes ?' : i === 2 ? 'Offrez-vous des options sans gluten ?' : 'Comment dois-je réchauffer ma tarte ?') 
                  }}
                </span>
                <span class="transition group-open:rotate-180">
                  <i class="fa-solid fa-chevron-down text-secondary"></i>
                </span>
              </summary>
              <div class="text-primary/70 px-6 pb-6 pt-0 font-light text-sm">
                {{ locale === 'en' 
                  ? (i === 1 ? 'Our crusts can be stored in the refrigerator for up to 5 days, or frozen for up to 3 months.' : i === 2 ? 'Yes, we have a dedicated gluten-free line made with premium alternative flours.' : 'For best results, bake in a preheated oven at 350°F (175°C) for 10-15 minutes.') 
                  : (i === 1 ? 'Nos croûtes peuvent être conservées au réfrigérateur jusqu\'à 5 jours, ou congelées jusqu\'à 3 mois.' : i === 2 ? 'Oui, nous avons une gamme sans gluten préparée avec des farines alternatives de première qualité.' : 'Pour de meilleurs résultats, cuire dans un four préchauffé à 350°F (175°C) pendant 10 à 15 minutes.') 
                }}
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact & Location (#contact) -->
    <section id="contact" class="py-24 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-serif text-primary mb-4">{{ locale === 'en' ? 'Contact Us' : 'Nous Contacter' }}</h2>
          <div class="w-24 h-1 bg-secondary mx-auto"></div>
        </div>

        <div class="flex flex-col lg:flex-row gap-12">
          <!-- Info Column -->
          <div class="lg:w-1/3 space-y-8">
            <div class="glass-panel p-8 rounded-xl border border-white/50 shadow-lg">
              <h3 class="text-2xl font-serif text-primary mb-6">{{ locale === 'en' ? 'Get in Touch' : 'Coordonnées' }}</h3>
              
              <div class="flex items-start gap-4 mb-6">
                <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                  <i class="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h4 class="font-bold text-primary mb-1">Atelier</h4>
                  <p class="text-primary/70 text-sm">123 Rue de la Pâtisserie<br>Montréal, QC H2X 1Y2</p>
                </div>
              </div>
              
              <div class="flex items-start gap-4 mb-6">
                <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                  <i class="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <h4 class="font-bold text-primary mb-1">Email</h4>
                  <a href="mailto:bonjour@exemple.com" class="text-primary/70 text-sm hover:text-secondary transition">bonjour@exemple.com</a>
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                  <i class="fa-solid fa-clock"></i>
                </div>
                <div>
                  <h4 class="font-bold text-primary mb-1">{{ locale === 'en' ? 'Hours' : 'Heures d\'ouverture' }}</h4>
                  <p class="text-primary/70 text-sm">{{ locale === 'en' ? 'Mon-Fri: 8am - 5pm' : 'Lun-Ven: 8h00 - 17h00' }}<br>{{ locale === 'en' ? 'Sat: 9am - 2pm' : 'Sam: 9h00 - 14h00' }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Form Column -->
          <div class="lg:w-2/3">
            <form class="glass-panel p-8 md:p-10 rounded-xl border border-white/50 shadow-lg" @submit.prevent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label class="block text-sm font-bold text-primary mb-2">{{ locale === 'en' ? 'Name' : 'Nom' }}</label>
                  <input type="text" class="w-full px-4 py-3 rounded-sm border border-primary/20 bg-white/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition" :placeholder="locale === 'en' ? 'Your name' : 'Votre nom'">
                </div>
                <div>
                  <label class="block text-sm font-bold text-primary mb-2">{{ locale === 'en' ? 'Email' : 'Courriel' }}</label>
                  <input type="email" class="w-full px-4 py-3 rounded-sm border border-primary/20 bg-white/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition" :placeholder="locale === 'en' ? 'Your email' : 'Votre courriel'">
                </div>
              </div>
              
              <div class="mb-6">
                <label class="block text-sm font-bold text-primary mb-2">{{ locale === 'en' ? 'Subject' : 'Sujet' }}</label>
                <select class="w-full px-4 py-3 rounded-sm border border-primary/20 bg-white/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition">
                  <option>{{ locale === 'en' ? 'General Inquiry' : 'Question générale' }}</option>
                  <option>{{ locale === 'en' ? 'Bulk/Catering Order' : 'Commande de gros / Traiteur' }}</option>
                  <option>{{ locale === 'en' ? 'Support' : 'Support' }}</option>
                </select>
              </div>
              
              <div class="mb-8">
                <label class="block text-sm font-bold text-primary mb-2">{{ locale === 'en' ? 'Message' : 'Message' }}</label>
                <textarea rows="5" class="w-full px-4 py-3 rounded-sm border border-primary/20 bg-white/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition resize-none" :placeholder="locale === 'en' ? 'How can we help you?' : 'Comment pouvons-nous vous aider ?'"></textarea>
              </div>
              
              <button type="submit" class="w-full bg-primary text-white font-bold uppercase tracking-widest py-4 rounded-sm shadow-lg hover:bg-primary/90 transition">
                {{ locale === 'en' ? 'Send Message' : 'Envoyer le message' }}
              </button>
            </form>
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

const testimonials = [
  {
    initial: 'M',
    name: 'Marie L.',
    text_en: 'Absolutely the best pastry crust I have ever used. It tastes incredibly fresh and homemade.',
    text_fr: 'Absolument la meilleure croûte à tarte que j\'ai jamais utilisée. Un goût incroyablement frais et fait maison.'
  },
  {
    initial: 'S',
    name: 'Sophie T.',
    text_en: 'The attention to detail and quality of ingredients is unmatched. My family loved the pies!',
    text_fr: 'L\'attention portée aux détails et la qualité des ingrédients sont inégalées. Ma famille a adoré !'
  },
  {
    initial: 'L',
    name: 'Lucie B.',
    text_en: 'Saved me so much time without compromising on quality. Highly recommend to all home bakers.',
    text_fr: 'M\'a fait gagner tellement de temps sans compromettre la qualité. Je le recommande vivement.'
  }
]

const { cart, addToCart, clearCart } = useCart()

const availableStock = (product) => {
  const inCart = cart.value.find(i => i.id === product.id)?.quantity || 0;
  return product.stock - inCart;
}

onMounted(async () => {
  if (route.query.success === 'true') {
    clearCart()
  }

  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  products.value = data || []
  loading.value = false
})
</script>
