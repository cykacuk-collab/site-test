<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900 font-serif">
          Gestion des Produits
        </h1>
        <button @click="logout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition">
          Déconnexion
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
      
      <!-- ADD/EDIT PRODUCT FORM -->
      <div class="lg:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
        <h2 class="text-xl font-bold mb-4 text-primary">{{ editMode ? 'Modifier le Produit' : 'Nouveau Produit' }}</h2>
        <form @submit.prevent="saveProduct" class="space-y-4">
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Code (SKU) B2B</label>
              <input v-model="form.reference_code" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" placeholder="Ex: T-SUC-01">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Prix ($ CAD)</label>
              <input v-model.number="form.price" required type="number" step="0.01" min="0" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nom (FR)</label>
              <input v-model="form.name_fr" required type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Name (EN)</label>
              <input v-model="form.name_en" required type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Catégorie</label>
              <select v-model="form.category" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2">
                <option value="sweet">Sucrée (Sweet)</option>
                <option value="savory">Salée (Savory)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Stock Initial</label>
              <input v-model.number="form.stock" required type="number" min="0" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Image</label>
            <input type="file" ref="fileInput" @change="handleFile" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-yellow-600">
            <p v-if="editMode && form.existing_image" class="text-xs text-gray-500 mt-1">Laissez vide pour conserver l'image actuelle.</p>
          </div>

          <div class="flex gap-2 pt-2">
            <button type="submit" :disabled="loading" class="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition font-medium disabled:opacity-50">
              {{ loading ? 'Sauvegarde...' : (editMode ? 'Mettre à jour' : 'Ajouter le produit') }}
            </button>
            <button type="button" v-if="editMode" @click="resetForm" class="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition font-medium">
              Annuler
            </button>
          </div>
          
          <p v-if="errorMsg" class="text-red-500 text-sm mt-2">{{ errorMsg }}</p>
          <p v-if="successMsg" class="text-green-600 text-sm mt-2">{{ successMsg }}</p>
        </form>
      </div>

      <!-- PRODUCT LIST -->
      <div class="lg:w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 class="text-xl font-bold mb-4 text-primary flex justify-between items-center">
          Catalogue Actuel
          <button @click="fetchProducts" class="text-sm text-secondary hover:underline"><i class="fa-solid fa-rotate-right mr-1"></i> Actualiser</button>
        </h2>
        
        <div v-if="products.length === 0" class="text-center py-10 text-gray-500">
          Aucun produit trouvé.
        </div>

        <div class="overflow-x-auto" v-else>
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom & SKU</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="p in products" :key="p.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <img v-if="p.image_url" :src="p.image_url" class="h-10 w-10 rounded-full object-cover">
                  <div v-else class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400"><i class="fa-solid fa-image"></i></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ p.name_fr }}</div>
                  <div class="text-xs text-gray-500">{{ p.reference_code || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${{ (p.price_cents / 100).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="p.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ p.stock }} en stock
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button @click="editProduct(p)" class="text-secondary hover:text-yellow-600"><i class="fa-solid fa-pen"></i></button>
                  <button @click="deleteProduct(p.id)" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const products = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const editMode = ref(false)
const editId = ref(null)
const fileInput = ref(null)

const form = ref({
  reference_code: '',
  name_fr: '',
  name_en: '',
  category: 'sweet',
  stock: 100,
  price: 0,
  file: null,
  existing_image: null
})

const resetForm = () => {
  editMode.value = false
  editId.value = null
  form.value = { 
    reference_code: '', 
    name_fr: '', 
    name_en: '', 
    category: 'sweet', 
    stock: 100, 
    price: 0, 
    file: null, 
    existing_image: null 
  }
  if (fileInput.value) fileInput.value.value = ''
  errorMsg.value = ''
  successMsg.value = ''
}

const editProduct = (p) => {
  editMode.value = true
  editId.value = p.id
  form.value = {
    reference_code: p.reference_code || '',
    name_fr: p.name_fr,
    name_en: p.name_en,
    category: p.category,
    stock: p.stock,
    price: p.price_cents / 100,
    file: null,
    existing_image: p.image_url
  }
  if (fileInput.value) fileInput.value.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleFile = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    errorMsg.value = 'Invalid file type'
    form.value.file = null
    return
  }
  form.value.file = file
  errorMsg.value = ''
}

const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (!error) products.value = data
}

onMounted(() => {
  fetchProducts()
})

const saveProduct = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    let imageUrl = form.value.existing_image

    // 1. Upload new image if provided
    if (form.value.file) {
      const fileExt = form.value.file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `tart-shells/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, form.value.file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath)
      
      if (form.value.existing_image) {
        try {
          const oldPathMatch = form.value.existing_image.split('product_images/')[1]
          if (oldPathMatch) {
            await supabase.storage.from('product_images').remove([oldPathMatch])
          }
        } catch (e) {
          console.error('Failed to delete old image', e)
        }
      }

      imageUrl = data.publicUrl
    }

    const payload = {
      reference_code: form.value.reference_code || null,
      name_fr: form.value.name_fr,
      name_en: form.value.name_en,
      category: form.value.category,
      stock: form.value.stock,
      price_cents: Math.round(form.value.price * 100),
      image_url: imageUrl,
      description_fr: '',
      description_en: ''
    }

    // 2. Insert or Update DB
    if (editMode.value) {
      const { error: dbError } = await supabase.from('products').update(payload).eq('id', editId.value)
      if (dbError) throw dbError
      successMsg.value = 'Produit mis à jour avec succès!'
    } else {
      const { error: dbError } = await supabase.from('products').insert(payload)
      if (dbError) throw dbError
      successMsg.value = 'Produit ajouté avec succès!'
    }

    resetForm()
    fetchProducts()

  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Supprimer ce produit définitivement?')) return
  const p = products.value.find(prod => prod.id === id)
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (!error) {
    if (p && p.image_url) {
      try {
        const oldPathMatch = p.image_url.split('product_images/')[1]
        if (oldPathMatch) {
          await supabase.storage.from('product_images').remove([oldPathMatch])
        }
      } catch (e) {
        console.error('Failed to delete old image', e)
      }
    }
    fetchProducts()
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/admin/login')
}
</script>
