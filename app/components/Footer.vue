<template>
  <footer class="bg-beige text-primary py-12 mt-auto border-t border-accent/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div>
          <h3 class="text-xl font-bold font-serif mb-4">Histoire et Saveurs</h3>
          <p class="text-primary/70 text-sm">Fonds de tarte artisanaux de qualité professionnelle, fabriqués avec passion au Québec.</p>
        </div>

        <div>
          <h3 class="text-lg font-bold mb-4">Liens Rapides</h3>
          <ul class="space-y-2 text-sm text-primary/70">
            <li><NuxtLink to="/" class="hover:text-secondary transition">Accueil</NuxtLink></li>
            <li><NuxtLink to="/b2b" class="hover:text-secondary transition">Espace Professionnel (B2B)</NuxtLink></li>
            <li><NuxtLink to="/admin/login" class="hover:text-secondary transition">Administration</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-bold mb-4">Légal</h3>
          <ul class="space-y-2 text-sm text-primary/70">
            <li><NuxtLink to="/privacy" class="hover:text-secondary transition">Politique de Confidentialité</NuxtLink></li>
            <li><NuxtLink to="/terms" class="hover:text-secondary transition">Conditions d'utilisation</NuxtLink></li>
            <li><NuxtLink to="/shipping" class="hover:text-secondary transition">Expédition et Retours</NuxtLink></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-primary/10 mt-8 pt-8 text-center text-sm text-primary/60 flex flex-col items-center gap-2">
        <span>&copy; {{ new Date().getFullYear() }} Histoire et Saveurs. Tous droits réservés.</span>
        <span class="text-xs font-serif italic text-primary/50">Permis de vente au détail MAPAQ n° [À COMPLÉTER]</span>
      </div>
    </div>
  </footer>
</template>
