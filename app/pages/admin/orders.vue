<template>
  <div class="space-y-6 pb-12">
    <!-- Top Header & Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">
          <i class="fa-solid fa-boxes-packing text-secondary text-sm"></i>
          <span>Opérations Logistiques</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-primary tracking-tight">
          Gestion des Commandes
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Suivi, expédition et mise à jour de l'état des commandes Stripe.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshOrdersList"
          :disabled="isRefreshing"
          class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-white/80 hover:bg-white border border-gray-200 shadow-xs transition hover:shadow-sm disabled:opacity-50"
        >
          <i class="fa-solid fa-rotate-right text-xs" :class="{ 'animate-spin': isRefreshing }"></i>
          <span>{{ isRefreshing ? 'Actualisation...' : 'Actualiser' }}</span>
        </button>

        <NuxtLink
          to="/admin"
          class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-white/80 hover:bg-white border border-gray-200 shadow-xs transition hover:shadow-sm"
        >
          <i class="fa-solid fa-chart-pie text-secondary text-xs"></i>
          <span>Vue d'ensemble</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Status Counter Pills -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        @click="selectedStatus = tab.value"
        class="p-3 rounded-xl border text-left transition relative flex flex-col justify-between"
        :class="selectedStatus === tab.value
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-white/80 hover:bg-white text-gray-700 border-gray-200/80'"
      >
        <span class="text-[11px] font-semibold tracking-wide uppercase opacity-80">
          {{ tab.label }}
        </span>
        <span class="text-xl font-bold font-serif mt-1">
          {{ getCountForStatus(tab.value) }}
        </span>
      </button>
    </div>

    <!-- Search & Filter Controls -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-100/90 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
      <!-- Search Input -->
      <div class="relative w-full sm:w-96">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <i class="fa-solid fa-magnifying-glass text-xs"></i>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par client, email, session Stripe..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <!-- Quick Summary -->
      <div class="text-xs text-gray-500 whitespace-nowrap self-end sm:self-center">
        <span>{{ filteredOrders.length }}</span> commande(s) affichée(s)
      </div>
    </div>

    <!-- DB Permission Warning Banner if Orders query failed -->
    <div v-if="ordersError" class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-3">
      <i class="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-base flex-shrink-0"></i>
      <div>
        <p class="font-semibold">Permissions base de données restreintes (Code 42501 / 500)</p>
        <p class="mt-0.5 text-amber-700">La table <code>public.orders</code> requiert les privilèges PostgreSQL pour le rôle de service. Veuillez exécuter le script <code>database/consolidated_admin_patch.sql</code> dans votre tableau de bord Supabase pour activer la gestion des commandes.</p>
      </div>
    </div>

    <!-- Orders Data Table -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100/90 shadow-xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="loadingOrders && ordersList.length === 0" class="py-16 text-center text-gray-400">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-primary mb-2"></i>
        <p class="text-xs font-medium">Chargement des commandes...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrders.length === 0" class="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
        <div class="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-3 shadow-inner">
          <i class="fa-solid fa-receipt text-2xl"></i>
        </div>
        <p class="text-base font-medium text-gray-700">Aucune commande trouvée</p>
        <p class="text-xs text-gray-400 mt-1 max-w-sm">
          {{ searchQuery || selectedStatus !== 'all' ? 'Essayez de modifier vos filtres ou termes de recherche.' : 'Les nouvelles commandes payées apparaîtront ici automatiquement.' }}
        </p>
        <button
          v-if="searchQuery || selectedStatus !== 'all'"
          @click="resetFilters"
          class="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-accent hover:bg-accent/80 border border-primary/20 transition"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Orders Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70 border-b border-gray-100">
              <th class="py-3.5 px-4">Référence Stripe</th>
              <th class="py-3.5 px-4">Date</th>
              <th class="py-3.5 px-4">Client</th>
              <th class="py-3.5 px-4">Total</th>
              <th class="py-3.5 px-4">Statut</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-gray-50/60 transition group"
            >
              <!-- Stripe Session ID -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span class="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]" :title="order.stripe_session_id">
                    {{ truncate(order.stripe_session_id, 16) }}
                  </span>
                  <button
                    @click.stop="copyToClipboard(order.stripe_session_id)"
                    class="text-gray-400 hover:text-primary transition p-1"
                    title="Copier la référence Stripe"
                  >
                    <i class="fa-regular fa-copy text-xs"></i>
                  </button>
                </div>
              </td>

              <!-- Date -->
              <td class="py-4 px-4 text-gray-600 whitespace-nowrap">
                <div class="font-medium text-gray-800">{{ formatDateOnly(order.created_at) }}</div>
                <div class="text-[10px] text-gray-400">{{ formatTimeOnly(order.created_at) }}</div>
              </td>

              <!-- Customer Info -->
              <td class="py-4 px-4">
                <div class="flex flex-col">
                  <div class="flex items-center space-x-1.5">
                    <span class="font-semibold text-gray-800" v-if="order.customer_name">
                      {{ order.customer_name }}
                    </span>
                    <span
                      v-else
                      class="inline-block bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      Client invité
                    </span>
                  </div>
                  <span class="text-[11px] text-gray-400 max-w-[200px] truncate" :title="order.customer_email">
                    {{ order.customer_email }}
                  </span>
                </div>
              </td>

              <!-- Total -->
              <td class="py-4 px-4 font-serif font-bold text-primary whitespace-nowrap">
                {{ formatCAD(order.amount_total_cents) }}
              </td>

              <!-- Status Badge & Inline Transition -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                    :class="getStatusBadgeClass(order.status)"
                  >
                    {{ formatStatusLabel(order.status) }}
                  </span>

                  <!-- Quick Inline Transition Dropdown -->
                  <select
                    :value="order.status"
                    @change="handleQuickStatusChange(order, $event.target.value)"
                    :disabled="updatingOrderIds.has(order.id)"
                    class="text-[11px] py-1 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition cursor-pointer"
                    title="Changer le statut"
                  >
                    <option value="paid">Payée</option>
                    <option value="processing">En préparation</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-4 px-4 text-right whitespace-nowrap">
                <button
                  @click="openInspectModal(order)"
                  class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-accent hover:bg-accent/80 border border-primary/20 shadow-2xs transition"
                >
                  <i class="fa-solid fa-eye text-xs"></i>
                  <span>Inspecter</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Customer & Cart Details Modal -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      @click.self="closeInspectModal"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-xl font-serif font-bold text-primary">
                Détails de la Commande
              </h2>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                :class="getStatusBadgeClass(selectedOrder.status)"
              >
                {{ formatStatusLabel(selectedOrder.status) }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Passée le {{ formatDateTime(selectedOrder.created_at) }}
            </p>
          </div>

          <button
            @click="closeInspectModal"
            class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-6 flex-grow">
          
          <!-- Customer & Session Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <span class="text-gray-400 font-semibold uppercase tracking-wider block mb-1">Client</span>
              <p class="font-bold text-gray-800 text-sm">
                {{ selectedOrder.customer_name || 'Client invité' }}
              </p>
              <p class="text-gray-600 mt-0.5 flex items-center gap-1.5">
                <i class="fa-regular fa-envelope text-gray-400"></i>
                <span>{{ selectedOrder.customer_email }}</span>
              </p>
              <span
                class="inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                :class="selectedOrder.user_id ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'"
              >
                {{ selectedOrder.user_id ? 'Compte client enregistré' : 'Commande passée en tant qu’invité' }}
              </span>
            </div>

            <div>
              <span class="text-gray-400 font-semibold uppercase tracking-wider block mb-1">Session Stripe &amp; Paiement</span>
              <div class="flex items-center space-x-1.5">
                <span class="font-mono text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded max-w-full truncate" :title="selectedOrder.stripe_session_id">
                  {{ selectedOrder.stripe_session_id }}
                </span>
                <button
                  @click="copyToClipboard(selectedOrder.stripe_session_id)"
                  class="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-white border border-transparent hover:border-gray-200 transition"
                  title="Copier la référence Stripe"
                >
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>

              <!-- Shipping Address -->
              <div class="mt-3">
                <span class="text-gray-400 font-semibold uppercase tracking-wider block mb-0.5">Livraison</span>
                <p v-if="selectedOrder.shipping_address" class="text-gray-700">
                  {{ selectedOrder.shipping_address.street }}, {{ selectedOrder.shipping_address.city }} ({{ selectedOrder.shipping_address.postal_code }}), {{ selectedOrder.shipping_address.country }}
                </p>
                <p v-else class="text-gray-400 italic">
                  Non spécifiée / Paiement direct
                </p>
              </div>
            </div>
          </div>

          <!-- Itemized Cart Line Items -->
          <div>
            <h3 class="text-sm font-serif font-bold text-primary mb-3 flex items-center justify-between">
              <span>Articles du Panier ({{ selectedOrder.order_items?.length || 0 }})</span>
              <span class="text-xs font-sans text-gray-400 font-normal">Détails des produits achetés</span>
            </h3>

            <!-- Cart Table -->
            <div class="border border-gray-100 rounded-xl overflow-hidden">
              <div v-if="!selectedOrder.order_items || selectedOrder.order_items.length === 0" class="py-8 text-center text-gray-400 text-xs">
                Aucun article associé à cette commande.
              </div>
              <table v-else class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-gray-50/80 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th class="py-2.5 px-3">Produit</th>
                    <th class="py-2.5 px-3">SKU</th>
                    <th class="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th class="py-2.5 px-3 text-center">Qté</th>
                    <th class="py-2.5 px-3 text-right">Total Ligne</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="item in selectedOrder.order_items"
                    :key="item.id"
                    class="hover:bg-gray-50/40 transition"
                  >
                    <!-- Product Info -->
                    <td class="py-3 px-3">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                          <img
                            v-if="item.product?.image_url"
                            :src="item.product.image_url"
                            :alt="item.product.name_fr"
                            class="w-full h-full object-cover"
                            @error="$event.target.style.display = 'none'"
                          />
                          <i v-else class="fa-solid fa-cookie text-sm opacity-60"></i>
                        </div>
                        <div>
                          <p class="font-semibold text-gray-800">
                            {{ item.product?.name_fr || 'Produit archivé' }}
                          </p>
                          <p class="text-[11px] text-gray-400" v-if="item.product?.name_en">
                            {{ item.product.name_en }}
                          </p>
                        </div>
                      </div>
                    </td>

                    <!-- SKU -->
                    <td class="py-3 px-3 text-gray-500 font-mono text-[11px]">
                      {{ item.product?.reference_code || '—' }}
                    </td>

                    <!-- Unit Price at purchase -->
                    <td class="py-3 px-3 text-right text-gray-700 font-serif">
                      {{ formatCAD(item.price_at_purchase_cents) }}
                    </td>

                    <!-- Quantity -->
                    <td class="py-3 px-3 text-center font-bold text-gray-800">
                      × {{ item.quantity }}
                    </td>

                    <!-- Line Total -->
                    <td class="py-3 px-3 text-right font-serif font-bold text-primary">
                      {{ formatCAD(item.quantity * item.price_at_purchase_cents) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Financial Summary Breakdown -->
          <div class="flex justify-end pt-2">
            <div class="w-full sm:w-64 space-y-1.5 text-xs">
              <div class="flex justify-between text-gray-500">
                <span>Total Lignes :</span>
                <span class="font-serif">{{ formatCAD(computeItemsTotal(selectedOrder.order_items)) }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Frais d'expédition :</span>
                <span class="font-serif">Inclus / 0.00 $ CAD</span>
              </div>
              <div class="flex justify-between text-base font-serif font-bold text-primary pt-2 border-t border-gray-200">
                <span>Total Facturé :</span>
                <span>{{ formatCAD(selectedOrder.amount_total_cents) }}</span>
              </div>
            </div>
          </div>

          <!-- Order Status Transition Control Box -->
          <div class="bg-accent/40 rounded-xl p-4 border border-primary/20 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-primary uppercase tracking-wider">
                Transition d'État Logistique
              </span>
              <span class="text-[11px] text-gray-500">
                Mise à jour sécurisée via rôle Nitro
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-3">
              <select
                v-model="modalTargetStatus"
                class="w-full sm:flex-grow text-xs py-2 px-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="paid">Payée (En attente de traitement)</option>
                <option value="processing">En préparation (Cuisine / Entrepôt)</option>
                <option value="shipped">Expédiée (En transit transporteur)</option>
                <option value="delivered">Livrée (Réception confirmée)</option>
                <option value="cancelled">Annulée (Remboursement / Refus)</option>
              </select>

              <button
                @click="updateModalOrderStatus"
                :disabled="isUpdatingModalStatus || modalTargetStatus === selectedOrder.status"
                class="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <i class="fa-solid fa-spinner fa-spin text-xs" v-if="isUpdatingModalStatus"></i>
                <i class="fa-solid fa-check text-xs" v-else></i>
                <span>{{ isUpdatingModalStatus ? 'Enregistrement...' : 'Mettre à jour le statut' }}</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            @click="closeInspectModal"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-200/80 hover:bg-gray-300 transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const { addToast } = useToast()

const searchQuery = ref('')
const selectedStatus = ref('all')
const isRefreshing = ref(false)
const selectedOrder = ref(null)
const modalTargetStatus = ref('paid')
const isUpdatingModalStatus = ref(false)
const updatingOrderIds = ref(new Set())

// Status Tab Configuration
const statusTabs = [
  { label: 'Toutes', value: 'all' },
  { label: 'Payées', value: 'paid' },
  { label: 'En préparation', value: 'processing' },
  { label: 'Expédiées', value: 'shipped' },
  { label: 'Livrées', value: 'delivered' },
  { label: 'Annulées', value: 'cancelled' }
]

// Fetch orders list via secure Nitro endpoint
const {
  data: ordersResponse,
  pending: loadingOrders,
  error: ordersError,
  refresh: refreshOrders
} = await useFetch('/api/admin/orders', {
  lazy: false,
  default: () => ({ orders: [] })
})

// Local reactive copy of orders list for instant optimistic / state updates
const ordersList = ref([])

watch(
  () => ordersResponse.value?.orders,
  (newVal) => {
    if (newVal) {
      ordersList.value = JSON.parse(JSON.stringify(newVal))
    }
  },
  { immediate: true }
)

// Status count helper
const getCountForStatus = (status) => {
  const list = ordersList.value || []
  if (status === 'all') return list.length
  return list.filter(o => o.status === status).length
}

// Filtered orders list based on status and search query
const filteredOrders = computed(() => {
  let list = ordersList.value || []

  if (selectedStatus.value !== 'all') {
    list = list.filter(o => o.status === selectedStatus.value)
  }

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(o =>
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.stripe_session_id && o.stripe_session_id.toLowerCase().includes(q))
    )
  }

  return list
})

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = 'all'
}

// Refresh handler
const refreshOrdersList = async () => {
  isRefreshing.value = true
  try {
    await refreshOrders()
    addToast('Liste des commandes actualisée', 'success')
  } catch (err) {
    console.error('Error refreshing orders:', err)
    addToast('Erreur lors du rafraîchissement des commandes', 'error')
  } finally {
    isRefreshing.value = false
  }
}

// Truncate helper
const truncate = (str, len = 20) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

// Clipboard copy helper
const copyToClipboard = async (text) => {
  if (!text) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      addToast('Référence Stripe copiée dans le presse-papier !', 'success', 2000)
    }
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

// Currency format CAD
const formatCAD = (cents) => {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return '$0.00 CAD'
  }
  return `$${(cents / 100).toFixed(2)} CAD`
}

// Date helpers
const formatDateOnly = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return isoString
  }
}

const formatTimeOnly = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}

// Compute line items sum
const computeItemsTotal = (items) => {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, itm) => sum + (itm.quantity || 0) * (itm.price_at_purchase_cents || 0), 0)
}

// Status Badges
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-blue-100 text-blue-800'
    case 'processing':
      return 'bg-yellow-100 text-yellow-800'
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800'
    case 'delivered':
    case 'fulfilled':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
    case 'expired':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatStatusLabel = (status) => {
  switch (status) {
    case 'paid':
      return 'Payée'
    case 'processing':
      return 'En préparation'
    case 'shipped':
      return 'Expédiée'
    case 'delivered':
      return 'Livrée'
    case 'fulfilled':
      return 'Traitée'
    case 'cancelled':
      return 'Annulée'
    case 'expired':
      return 'Expirée'
    case 'pending':
      return 'En attente'
    default:
      return status || 'Inconnu'
  }
}

// Inspect Modal
const openInspectModal = (order) => {
  selectedOrder.value = { ...order }
  modalTargetStatus.value = order.status
}

const closeInspectModal = () => {
  selectedOrder.value = null
}

// Core Order Status Update Logic (Calls Nitro PATCH Endpoint with Service Role)
const updateOrderStatus = async (orderId, newStatus) => {
  const res = await $fetch(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    body: { status: newStatus }
  })

  if (res?.success && res.order) {
    // Optimistically update local array
    const idx = ordersList.value.findIndex(o => o.id === orderId)
    if (idx !== -1) {
      ordersList.value[idx].status = res.order.status
      ordersList.value[idx].updated_at = res.order.updated_at
    }

    if (selectedOrder.value && selectedOrder.value.id === orderId) {
      selectedOrder.value.status = res.order.status
      selectedOrder.value.updated_at = res.order.updated_at
      modalTargetStatus.value = res.order.status
    }

    addToast(`Statut de la commande mis à jour: "${formatStatusLabel(newStatus)}"`, 'success')
    return true
  } else {
    throw new Error('Réponse inattendue du serveur')
  }
}

const handleStatusUpdateError = (err) => {
  const statusMsg = err.data?.statusMessage || err.data?.message || err.message || ''
  const statusCode = err.statusCode || err.status || err.data?.statusCode
  const isDbPermission =
    (statusCode === 500 && (/permission/i.test(statusMsg) || /42501/.test(statusMsg) || /grant/i.test(statusMsg))) ||
    (statusCode === 403 && /permission/i.test(statusMsg)) ||
    /42501/.test(statusMsg) ||
    /permission denied/i.test(statusMsg)

  if (isDbPermission) {
    addToast(
      'Erreur de permissions base de données (42501). Veuillez exécuter database/consolidated_admin_patch.sql sur Supabase pour accorder les permissions.',
      'error',
      8000
    )
  } else {
    addToast(statusMsg || 'Échec de la mise à jour du statut', 'error')
  }
}

// Modal Status Change
const updateModalOrderStatus = async () => {
  if (!selectedOrder.value) return
  isUpdatingModalStatus.value = true
  try {
    await updateOrderStatus(selectedOrder.value.id, modalTargetStatus.value)
  } catch (err) {
    console.error('Status update failed:', err)
    handleStatusUpdateError(err)
  } finally {
    isUpdatingModalStatus.value = false
  }
}

// Quick Inline Status Change from Table Row
const handleQuickStatusChange = async (order, newStatus) => {
  if (order.status === newStatus) return
  const prevStatus = order.status
  updatingOrderIds.value.add(order.id)

  try {
    await updateOrderStatus(order.id, newStatus)
  } catch (err) {
    console.error('Quick status update failed:', err)
    // Rollback to previous status in UI
    order.status = prevStatus
    handleStatusUpdateError(err)
  } finally {
    updatingOrderIds.value.delete(order.id)
  }
}
</script>
