<template>
  <div class="min-h-screen bg-beige py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-primary font-serif mb-4">Espace Professionnel</h1>
        <p class="text-lg text-gray-600">Vous êtes un restaurant, un hôtel ou un distributeur ? Contactez-nous pour nos tarifs de gros.</p>
      </div>

      <div class="bg-white p-8 rounded-sm shadow-xl border border-gray-100">
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="company" class="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
              <input v-model="form.company" type="text" id="company" required class="mt-1 block w-full rounded-sm border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary">
            </div>
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Personne contact</label>
              <input v-model="form.name" type="text" id="name" required class="mt-1 block w-full rounded-sm border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary">
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Adresse courriel</label>
            <input v-model="form.email" type="email" id="email" required class="mt-1 block w-full rounded-sm border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary">
          </div>

          <div>
            <label for="message" class="block text-sm font-medium text-gray-700">Votre demande (quantités estimées, produits souhaités)</label>
            <textarea v-model="form.message" id="message" rows="4" required class="mt-1 block w-full rounded-sm border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary"></textarea>
          </div>

          <div class="pt-4 flex flex-col items-center">
            <NuxtTurnstile v-model="turnstileToken" class="mb-6" />
            <p v-if="errorMsg" class="text-red-500 mb-4 text-sm">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-green-600 mb-4 font-bold">{{ successMsg }}</p>
            
            <button type="submit" :disabled="loading || !turnstileToken" class="w-full bg-secondary text-white py-3 px-4 rounded-sm font-bold hover:bg-opacity-90 transition disabled:opacity-50">
              {{ loading ? 'Envoi en cours...' : 'Envoyer la demande' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const form = ref({
  company: '',
  name: '',
  email: '',
  message: ''
})

const turnstileToken = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const submitForm = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const response = await $fetch('/api/b2b-inquiry', {
      method: 'POST',
      body: {
        ...form.value,
        turnstileToken: turnstileToken.value
      }
    })
    
    successMsg.value = "Votre demande a été envoyée avec succès. Nous vous contacterons sous peu."
    form.value = { company: '', name: '', email: '', message: '' }
    turnstileToken.value = '' // Reset captcha
  } catch (err) {
    errorMsg.value = err.data?.message || "Une erreur est survenue lors de l'envoi."
  } finally {
    loading.value = false
  }
}
</script>
