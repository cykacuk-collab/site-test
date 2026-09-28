<template>
  <footer class="bg-beige text-primary py-12 mt-auto border-t border-accent/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Newsletter Section -->
      <div class="mb-12 glass-panel p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20 shadow-sm backdrop-blur-md">
        <div>
          <h3 class="text-2xl font-bold font-serif mb-2">Abonnez-vous à notre infolettre</h3>
          <p class="text-primary/70">Recevez nos dernières créations et offres exclusives directement dans votre boîte courriel.</p>
        </div>
        <form @submit.prevent class="flex w-full md:w-auto gap-2">
          <input type="email" placeholder="Votre adresse courriel" class="px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:border-secondary flex-grow bg-white/50 backdrop-blur-sm" required>
          <button type="submit" class="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition shadow-sm">
            S'abonner
          </button>
        </form>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Brand -->
        <div class="md:col-span-1">
          <h3 class="text-xl font-bold font-serif mb-4">Histoire et Saveurs</h3>
          <p class="text-primary/70 text-sm mb-4">Fonds de tarte artisanaux de qualité professionnelle, fabriqués avec passion au Québec.</p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="text-lg font-bold mb-4">Navigation</h3>
          <ul class="space-y-2 text-sm text-primary/70">
            <li><NuxtLink to="/#accueil" class="hover:text-secondary transition">Accueil</NuxtLink></li>
            <li><NuxtLink to="/#creations" class="hover:text-secondary transition">Produits</NuxtLink></li>
            <li><NuxtLink to="/#apropos" class="hover:text-secondary transition">À propos</NuxtLink></li>
            <li><NuxtLink to="/#evenements" class="hover:text-secondary transition">Événements</NuxtLink></li>
            <li><NuxtLink to="/#faq" class="hover:text-secondary transition">FAQ</NuxtLink></li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3 class="text-lg font-bold mb-4">Légal</h3>
          <ul class="space-y-2 text-sm text-primary/70">
            <li><NuxtLink to="/privacy" class="hover:text-secondary transition">Politique de Confidentialité</NuxtLink></li>
            <li><NuxtLink to="/terms" class="hover:text-secondary transition">Conditions d'utilisation</NuxtLink></li>
            <li><span class="text-primary/70">Permis MAPAQ: MAPAQ-2026-987654</span></li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h3 class="text-lg font-bold mb-4">Contact</h3>
          <ul class="space-y-2 text-sm text-primary/70">
            <li><a href="mailto:info@histoireetsaveurs.com" class="hover:text-secondary transition">info@histoireetsaveurs.com</a></li>
            <li class="flex gap-4 mt-4 text-xl">
              <a href="#" class="hover:text-secondary transition"><i class="fa-brands fa-facebook"></i></a>
              <a href="#" class="hover:text-secondary transition"><i class="fa-brands fa-instagram"></i></a>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-primary/10 mt-12 pt-8 text-center text-sm text-primary/60 flex flex-col items-center gap-2">
        <span>&copy; {{ new Date().getFullYear() }} Histoire et Saveurs. Tous droits réservés.</span>
      </div>
    </div>
  </footer>
</template>
