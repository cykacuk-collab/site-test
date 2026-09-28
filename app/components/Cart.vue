<template>
  <div>
    <!-- Backdrop -->
    <div v-if="isCartOpen" @click="isCartOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"></div>

    <!-- Slide-over panel -->
    <div :class="isCartOpen ? 'translate-x-0' : 'translate-x-full'" class="fixed inset-y-0 right-0 max-w-md w-full glass-panel border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
      
      <!-- Header -->
      <div class="px-4 py-6 bg-primary/90 backdrop-blur text-white flex justify-between items-center">
        <h2 class="text-2xl font-serif font-bold">Votre Panier</h2>
        <button @click="isCartOpen = false" class="text-white hover:text-gray-300">
          <i class="fa-solid fa-xmark text-2xl"></i>
        </button>
      </div>

      <!-- Cart Items -->
      <ClientOnly>
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="cart.length === 0" class="text-center text-gray-500 mt-10">
            <i class="fa-solid fa-basket-shopping text-4xl mb-4 text-gray-300"></i>
            <p>Votre panier est vide.</p>
          </div>

          <ul v-else class="space-y-6">
            <li v-for="item in cart" :key="item.id" class="flex gap-4 border-b pb-4">
              <img :src="item.image_url || 'https://via.placeholder.com/150'" class="w-20 h-20 object-cover rounded shadow-sm">
              
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="font-bold text-gray-900">{{ locale === 'en' ? item.name_en : item.name_fr }}</h3>
                  <p class="text-sm text-gray-500">${{ (item.price_cents / 100).toFixed(2) }}</p>
                </div>
                
                <div class="flex justify-between items-center mt-2">
                  <div class="flex items-center border rounded">
                    <button @click="updateQuantity(item.id, item.quantity - 1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                    <span class="px-4 text-sm font-medium">{{ item.quantity }}</span>
                    <button @click="updateQuantity(item.id, item.quantity + 1)" :disabled="item.quantity >= item.stock" class="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50">+</button>
                  </div>
                  <button @click="removeFromCart(item.id)" class="text-red-500 hover:text-red-700 text-sm">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </ClientOnly>

      <!-- Footer / Checkout -->
      <div v-if="cart.length > 0" class="border-t p-4 bg-gray-50">
        <div class="flex justify-between text-lg font-bold text-gray-900 mb-4">
          <span>Total</span>
          <span>${{ (cartTotal / 100).toFixed(2) }}</span>
        </div>
        <div class="mb-4">
          <NuxtTurnstile ref="turnstile" v-model="turnstileToken" @expire="onTurnstileExpired" />
        </div>
        <button @click="checkout" :disabled="loading || !turnstileToken" class="w-full bg-secondary text-white py-3 rounded-md font-bold text-lg hover:bg-opacity-90 transition shadow disabled:opacity-50">
          {{ loading ? 'Chargement...' : 'Passer à la caisse (Stripe)' }}
        </button>
        <p v-if="errorMsg" class="text-red-500 text-sm text-center mt-2">{{ errorMsg }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
const { cart, cartId, isCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart()
const { locale } = useI18n()

const loading = ref(false)
const errorMsg = ref('')
const turnstileToken = ref('')
const turnstile = ref() // Reference to the Turnstile component

const onTurnstileExpired = () => {
  turnstileToken.value = ''
  errorMsg.value = "Votre session a expiré, veuillez valider à nouveau."
}

const checkout = async () => {
  if (!turnstileToken.value) {
    errorMsg.value = "Veuillez valider le captcha."
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    const response = await $fetch('/api/checkout', {
      method: 'POST',
      body: {
        items: cart.value.map(item => ({ id: item.id, quantity: item.quantity })),
        turnstileToken: turnstileToken.value,
        cartId: cartId.value
      }
    })
    
    if (response.url) {
      window.location.href = response.url // Redirect to Stripe
    } else {
      throw new Error("Impossible de générer le lien de paiement.")
    }
  } catch (err) {
    errorMsg.value = err.data?.message || err.message || "Une erreur est survenue."
    // Reset the token so the user is forced to solve it again
    turnstileToken.value = ''
    if (turnstile.value) {
      turnstile.value.reset()
    }
  } finally {
    loading.value = false
  }
}
</script>
