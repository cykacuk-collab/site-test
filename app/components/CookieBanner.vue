<template>
  <div v-if="!cookieDecisionMade" class="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
    <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <div class="p-4 rounded-sm bg-primary shadow-2xl sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t-4 border-secondary">
        <div class="flex-1">
          <p class="text-beige text-sm font-light">
            <strong class="font-bold">Confidentialité (Loi 25)</strong> : Nous utilisons des témoins (cookies) essentiels pour assurer le bon fonctionnement du site (panier, sécurité). Les témoins non essentiels sont désactivés par défaut.
            <NuxtLink to="/privacy" class="underline text-accent hover:text-white transition">En savoir plus</NuxtLink>.
          </p>
        </div>
        <div class="flex gap-3">
          <button @click="acceptAll" class="bg-secondary text-white px-5 py-2 rounded-sm text-sm font-bold hover:bg-opacity-90 transition shadow">
            Tout accepter
          </button>
          <button @click="rejectOptional" class="bg-transparent text-beige px-4 py-2 rounded-sm text-sm font-medium hover:bg-white/10 transition border border-beige/30">
            Essentiels uniquement
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const cookieConsent = useCookie('hs_cookie_consent', { maxAge: 60 * 60 * 24 * 365 }) // 1 year
const cookieDecisionMade = ref(true) // Default to true to prevent hydration mismatch

onMounted(() => {
  if (!cookieConsent.value) {
    cookieDecisionMade.value = false
  }
})

const acceptAll = () => {
  cookieConsent.value = 'all'
  cookieDecisionMade.value = true
  // In the future: Enable Google Analytics/Pixel scripts here
}

const rejectOptional = () => {
  cookieConsent.value = 'essential'
  cookieDecisionMade.value = true
}
</script>
