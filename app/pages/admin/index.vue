<template>
  <div class="space-y-8 pb-12">
    <!-- Top Executive Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">
          <i class="fa-solid fa-chart-line text-secondary text-sm"></i>
          <span>Tableau de Bord Exécutif</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-primary tracking-tight">
          Vue d'ensemble des Ventes
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Performance commerciale, indicateurs clés et statut des commandes en temps réel.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshDashboard"
          :disabled="isRefreshing"
          class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-primary bg-white/80 hover:bg-white border border-gray-200 shadow-xs transition hover:shadow-sm disabled:opacity-50"
        >
          <i class="fa-solid fa-rotate-right text-xs" :class="{ 'animate-spin': isRefreshing }"></i>
          <span>{{ isRefreshing ? 'Actualisation...' : 'Actualiser' }}</span>
        </button>

        <NuxtLink
          to="/admin/orders"
          class="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm transition hover:shadow-md"
        >
          <i class="fa-solid fa-receipt text-secondary text-xs"></i>
          <span>Gérer les Commandes</span>
          <i class="fa-solid fa-arrow-right text-[10px] ml-1 opacity-70"></i>
        </NuxtLink>
      </div>
    </div>

    <!-- 4 Executive KPI Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Card 1: Total Revenue -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-gray-100/90 shadow-xs hover:shadow-sm transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Chiffre d'Affaires
          </span>
          <div class="w-10 h-10 rounded-xl bg-[#EDF6ED] text-primary flex items-center justify-center">
            <i class="fa-solid fa-sack-dollar text-base"></i>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold font-serif text-primary">
            {{ formatCAD(analyticsData?.totalRevenueCents) }}
          </div>
          <div class="flex items-center space-x-1.5 mt-1.5 text-xs text-gray-500">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Commandes payées &amp; expédiées</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Total Orders -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-gray-100/90 shadow-xs hover:shadow-sm transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Commandes Réalisées
          </span>
          <div class="w-10 h-10 rounded-xl bg-[#E8DDCC]/40 text-primary flex items-center justify-center">
            <i class="fa-solid fa-receipt text-base"></i>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold font-serif text-primary">
            {{ analyticsData?.totalOrders || 0 }}
          </div>
          <div class="flex items-center space-x-1.5 mt-1.5 text-xs text-gray-500">
            <span class="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Exclut les annulations</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Average Order Value (AOV) -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-gray-100/90 shadow-xs hover:shadow-sm transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Panier Moyen (AOV)
          </span>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <i class="fa-solid fa-basket-shopping text-base"></i>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold font-serif text-primary">
            {{ formatCAD(analyticsData?.averageOrderValueCents) }}
          </div>
          <div class="flex items-center space-x-1.5 mt-1.5 text-xs text-gray-500">
            <i class="fa-solid fa-calculator text-[10px] text-amber-600"></i>
            <span>Moyenne par panier client</span>
          </div>
        </div>
      </div>

      <!-- Card 4: Active Catalog Products -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-gray-100/90 shadow-xs hover:shadow-sm transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Produits au Catalogue
          </span>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <i class="fa-solid fa-boxes-stacked text-base"></i>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold font-serif text-primary">
            {{ analyticsData?.activeProductsCount || 0 }}
          </div>
          <div class="flex items-center space-x-1.5 mt-1.5 text-xs text-gray-500">
            <i class="fa-solid fa-tag text-[10px] text-indigo-600"></i>
            <span>Articles actifs en boutique</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Sales Chart Section (SSR-Safe ClientOnly) -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-100/90 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-2">
        <div>
          <h2 class="text-lg font-serif font-bold text-primary flex items-center gap-2">
            <i class="fa-solid fa-chart-area text-secondary text-sm"></i>
            <span>Évolution Quotidienne des Ventes</span>
          </h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Historique chronologique des revenus générés par les commandes payées ($ CAD).
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60 self-start sm:self-auto">
          <span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
          <span>Revenus ($ CAD)</span>
        </div>
      </div>

      <!-- Strictly Encapsulated in ClientOnly with Fallback Skeleton -->
      <div class="pt-6 h-72 sm:h-80 w-full">
        <ClientOnly>
          <SalesChart :revenue-by-day="analyticsData?.revenueByDay || []" />
          <template #fallback>
            <div class="h-full w-full animate-pulse bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-400">
              <i class="fa-solid fa-chart-line text-3xl mb-2 text-gray-300 animate-bounce"></i>
              <p class="text-xs font-medium">Chargement du graphique interactif des ventes...</p>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <!-- Two-Column Section: Top Products & Recent Orders -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Top-Selling Products Leaderboard -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-100/90 shadow-xs flex flex-col">
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-serif font-bold text-primary flex items-center gap-2">
              <i class="fa-solid fa-trophy text-[#C2A676] text-sm"></i>
              <span>Palmarès des Ventes</span>
            </h2>
            <p class="text-xs text-gray-500 mt-0.5">Produits les plus vendus en volume et chiffre d'affaires.</p>
          </div>
          <NuxtLink
            to="/admin/products"
            class="text-xs font-semibold text-primary hover:text-primary/80 transition flex items-center gap-1"
          >
            <span>Catalogue</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </NuxtLink>
        </div>

        <div class="mt-4 flex-grow">
          <!-- Empty State -->
          <div
            v-if="!analyticsData?.topProducts || analyticsData.topProducts.length === 0"
            class="py-12 text-center text-gray-400 flex flex-col items-center justify-center"
          >
            <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
              <i class="fa-solid fa-cookie-bite text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-600">Aucune donnée de vente enregistrée</p>
            <p class="text-xs text-gray-400 mt-0.5">Le palmarès se calculera automatiquement avec les commandes.</p>
          </div>

          <!-- Products Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th class="py-2.5 px-2">Rang</th>
                  <th class="py-2.5 px-3">Produit</th>
                  <th class="py-2.5 px-3 text-right">Unités</th>
                  <th class="py-2.5 px-3 text-right">Revenu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 text-xs">
                <tr
                  v-for="(product, idx) in analyticsData.topProducts"
                  :key="product.id"
                  class="hover:bg-gray-50/60 transition group"
                >
                  <!-- Rank Badge -->
                  <td class="py-3 px-2 whitespace-nowrap">
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      :class="getRankClass(idx)"
                    >
                      {{ idx + 1 }}
                    </span>
                  </td>

                  <!-- Product details -->
                  <td class="py-3 px-3">
                    <div class="flex items-center space-x-3">
                      <div class="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                        <img
                          v-if="product.image_url"
                          :src="product.image_url"
                          :alt="product.name_fr"
                          class="w-full h-full object-cover"
                          @error="$event.target.style.display = 'none'"
                        />
                        <i v-else class="fa-solid fa-cookie text-sm opacity-60"></i>
                      </div>
                      <div class="min-w-0 max-w-[180px] sm:max-w-[220px]">
                        <p class="font-medium text-gray-800 truncate" :title="product.name_fr">
                          {{ product.name_fr }}
                        </p>
                        <p class="text-[11px] text-gray-400 truncate" v-if="product.name_en">
                          {{ product.name_en }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Units Sold -->
                  <td class="py-3 px-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                    {{ product.unitsSold }}
                  </td>

                  <!-- Total Revenue -->
                  <td class="py-3 px-3 text-right font-bold text-primary whitespace-nowrap font-serif">
                    {{ formatCAD(product.revenueCents) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Orders Snapshot -->
      <div class="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-100/90 shadow-xs flex flex-col">
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-serif font-bold text-primary flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-primary/70 text-sm"></i>
              <span>Dernières Commandes</span>
            </h2>
            <p class="text-xs text-gray-500 mt-0.5">Aperçu rapide des 5 transactions les plus récentes.</p>
          </div>
          <NuxtLink
            to="/admin/orders"
            class="text-xs font-semibold text-primary hover:text-primary/80 transition flex items-center gap-1"
          >
            <span>Toutes les commandes</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </NuxtLink>
        </div>

        <div class="mt-4 flex-grow">
          <!-- Empty State -->
          <div
            v-if="!recentOrders || recentOrders.length === 0"
            class="py-12 text-center text-gray-400 flex flex-col items-center justify-center"
          >
            <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
              <i class="fa-solid fa-receipt text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-600">Aucune commande enregistrée</p>
            <p class="text-xs text-gray-400 mt-0.5">Les nouvelles commandes payées s'afficheront ici en direct.</p>
          </div>

          <!-- Orders Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th class="py-2.5 px-3">Client</th>
                  <th class="py-2.5 px-3">Date</th>
                  <th class="py-2.5 px-3">Total</th>
                  <th class="py-2.5 px-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 text-xs">
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="hover:bg-gray-50/60 transition group cursor-pointer"
                  @click="navigateTo('/admin/orders')"
                >
                  <!-- Customer -->
                  <td class="py-3 px-3">
                    <div class="font-medium text-gray-800 truncate max-w-[130px] sm:max-w-[160px]">
                      {{ order.customer_name || 'Client invité' }}
                    </div>
                    <div class="text-[11px] text-gray-400 truncate max-w-[130px] sm:max-w-[160px]">
                      {{ order.customer_email }}
                    </div>
                  </td>

                  <!-- Date -->
                  <td class="py-3 px-3 text-gray-500 whitespace-nowrap">
                    {{ formatDate(order.created_at) }}
                  </td>

                  <!-- Total -->
                  <td class="py-3 px-3 font-serif font-bold text-primary whitespace-nowrap">
                    {{ formatCAD(order.amount_total_cents) }}
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3 px-3 text-right whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide capitalize"
                      :class="getStatusBadgeClass(order.status)"
                    >
                      {{ formatStatusLabel(order.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import SalesChart from '~/components/admin/SalesChart.client.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const isRefreshing = ref(false)

// Fetch analytics aggregated data from secure Nitro server endpoint
const {
  data: analyticsData,
  refresh: refreshAnalytics
} = await useFetch('/api/admin/analytics', {
  lazy: false,
  default: () => ({
    totalRevenueCents: 0,
    totalOrders: 0,
    averageOrderValueCents: 0,
    activeProductsCount: 0,
    topProducts: [],
    revenueByDay: []
  })
})

// Fetch orders list to populate recent orders snapshot
const {
  data: ordersResponse,
  refresh: refreshOrders
} = await useFetch('/api/admin/orders', {
  lazy: false,
  default: () => ({ orders: [] })
})

// Take top 5 recent orders
const recentOrders = computed(() => {
  const list = ordersResponse.value?.orders || []
  return list.slice(0, 5)
})

// Currency Formatter with 0-resilience
const formatCAD = (cents) => {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return '$0.00 CAD'
  }
  return `$${(cents / 100).toFixed(2)} CAD`
}

// Date Formatter
const formatDate = (isoString) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}

// Refresh Handler
const refreshDashboard = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([refreshAnalytics(), refreshOrders()])
  } catch (err) {
    console.error('Error refreshing dashboard:', err)
  } finally {
    isRefreshing.value = false
  }
}

// Rank Badge Styles
const getRankClass = (idx) => {
  if (idx === 0) return 'bg-[#C2A676] text-white shadow-xs'
  if (idx === 1) return 'bg-gray-300 text-gray-800'
  if (idx === 2) return 'bg-amber-700/60 text-white'
  return 'bg-gray-100 text-gray-500'
}

// Order Status Badge Styles
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

// Order Status French Label
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
</script>
