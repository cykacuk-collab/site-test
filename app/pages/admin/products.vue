<template>
  <div class="space-y-6">
    <!-- Top Action & Title Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="font-serif font-bold text-2xl sm:text-3xl text-primary flex items-center space-x-3">
          <span>Gestion des Produits &amp; Stocks</span>
        </h1>
        <p class="text-sm text-gray-600 mt-1">
          Gérez votre catalogue de produits, ajustez les niveaux de stock en temps réel et publiez de nouvelles créations.
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <button
          @click="fetchProducts"
          :disabled="loading"
          class="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white/80 hover:bg-white text-gray-700 text-sm font-medium transition shadow-xs disabled:opacity-50"
          title="Recharger les produits"
        >
          <i class="fa-solid fa-rotate-right text-xs" :class="loading ? 'fa-spin' : ''"></i>
          <span class="hidden sm:inline">Actualiser</span>
        </button>

        <button
          @click="openAddModal"
          class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition shadow-sm"
        >
          <i class="fa-solid fa-plus text-secondary text-xs"></i>
          <span>Nouveau Produit</span>
        </button>
      </div>
    </div>

    <!-- Summary KPI Counters -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
          <i class="fa-solid fa-boxes-stacked text-base"></i>
        </div>
        <div>
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Produits</div>
          <div class="text-xl font-bold text-primary">{{ products.length }}</div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
          <i class="fa-solid fa-check-double text-base"></i>
        </div>
        <div>
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">En Stock (> 10)</div>
          <div class="text-xl font-bold text-emerald-700">{{ inStockCount }}</div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <i class="fa-solid fa-triangle-exclamation text-base"></i>
        </div>
        <div>
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Bas (1 - 10)</div>
          <div class="text-xl font-bold text-amber-700">{{ lowStockCount }}</div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
          <i class="fa-solid fa-ban text-base"></i>
        </div>
        <div>
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Rupture (0)</div>
          <div class="text-xl font-bold text-red-700">{{ outOfStockCount }}</div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Search Query Input -->
        <div class="relative">
          <label class="block text-xs font-medium text-gray-600 mb-1">Recherche</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom (FR/EN) ou code SKU..."
              class="w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
            >
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
              title="Effacer"
            >
              <i class="fa-solid fa-circle-xmark text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
          <select
            v-model="selectedCategory"
            class="w-full py-2 px-3 rounded-xl text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
          >
            <option value="all">Toutes les catégories</option>
            <option value="sweet">Sucrée (Sweet)</option>
            <option value="savory">Salée (Savory)</option>
          </select>
        </div>

        <!-- Stock Level Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Niveau de Stock</label>
          <select
            v-model="selectedStock"
            class="w-full py-2 px-3 rounded-xl text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
          >
            <option value="all">Tous les stocks</option>
            <option value="in_stock">En stock (> 10)</option>
            <option value="low_stock">Stock bas (1 - 10)</option>
            <option value="out_of_stock">Rupture de stock (0)</option>
          </select>
        </div>

        <!-- Active Status Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Visibilité Catalogue</label>
          <select
            v-model="selectedStatus"
            class="w-full py-2 px-3 rounded-xl text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs seulement</option>
            <option value="inactive">Inactifs seulement</option>
          </select>
        </div>
      </div>

      <!-- Active Filter Pills & Reset Button -->
      <div v-if="isFiltered" class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
        <div class="flex items-center space-x-2">
          <span>Résultats : <strong>{{ filteredProducts.length }}</strong> sur {{ products.length }} produits</span>
        </div>
        <button
          @click="resetFilters"
          class="text-primary hover:text-secondary font-medium inline-flex items-center space-x-1"
        >
          <i class="fa-solid fa-arrow-rotate-left text-[10px]"></i>
          <span>Réinitialiser les filtres</span>
        </button>
      </div>
    </div>

    <!-- Products Table Card -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="loading && products.length === 0" class="p-8 space-y-4">
        <div v-for="i in 4" :key="i" class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="py-16 px-4 text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-accent text-primary flex items-center justify-center text-2xl mb-3">
          <i class="fa-solid fa-boxes-packing text-primary/60"></i>
        </div>
        <h3 class="font-serif font-bold text-lg text-primary">Aucun produit trouvé</h3>
        <p class="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          {{ isFiltered ? 'Aucun produit ne correspond à vos filtres de recherche actuels.' : 'Votre catalogue est actuellement vide. Commencez par ajouter un produit.' }}
        </p>
        <div class="mt-4 flex justify-center space-x-3">
          <button
            v-if="isFiltered"
            @click="resetFilters"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Effacer les filtres
          </button>
          <button
            @click="openAddModal"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-xs"
          >
            Ajouter un produit
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" class="px-5 py-3.5 text-left">Produit</th>
              <th scope="col" class="px-4 py-3.5 text-left">SKU / Réf</th>
              <th scope="col" class="px-4 py-3.5 text-left">Catégorie</th>
              <th scope="col" class="px-4 py-3.5 text-left">Prix (CAD)</th>
              <th scope="col" class="px-4 py-3.5 text-left">Stock &amp; Ajustement Rapide</th>
              <th scope="col" class="px-4 py-3.5 text-center">Statut</th>
              <th scope="col" class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr
              v-for="p in filteredProducts"
              :key="p.id"
              class="hover:bg-amber-50/20 transition-colors"
            >
              <!-- Thumbnail & Name -->
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <div class="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-accent border border-gray-100 flex items-center justify-center">
                    <img
                      v-if="p.image_url"
                      :src="p.image_url"
                      :alt="p.name_fr"
                      class="w-full h-full object-cover"
                      @error="handleImageError(p)"
                    >
                    <i v-else class="fa-solid fa-cookie text-primary/40 text-lg"></i>
                  </div>
                  <div class="max-w-xs">
                    <div class="text-sm font-semibold text-gray-900 truncate" :title="p.name_fr">{{ p.name_fr }}</div>
                    <div class="text-xs text-gray-500 truncate" :title="p.name_en">{{ p.name_en }}</div>
                  </div>
                </div>
              </td>

              <!-- SKU / Ref -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span v-if="p.reference_code" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700">
                  {{ p.reference_code }}
                </span>
                <span v-else class="text-xs text-gray-400 italic">—</span>
              </td>

              <!-- Category -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="p.category === 'sweet' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  <i :class="p.category === 'sweet' ? 'fa-solid fa-cake-candles mr-1' : 'fa-solid fa-seedling mr-1'" class="text-[10px]"></i>
                  {{ p.category === 'sweet' ? 'Sucrée' : 'Salée' }}
                </span>
              </td>

              <!-- Price -->
              <td class="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                ${{ (p.price_cents / 100).toFixed(2) }} <span class="text-xs font-normal text-gray-500">CAD</span>
              </td>

              <!-- Stock & Quick Controls -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <!-- Stock Badge -->
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
                    :class="getStockBadgeClass(p.stock)"
                  >
                    <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStockDotClass(p.stock)"></span>
                    {{ p.stock }} unité{{ p.stock > 1 ? 's' : '' }}
                  </span>

                  <!-- Quick Adjustment Controls -->
                  <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 space-x-0.5">
                    <button
                      @click="adjustStock(p, -5)"
                      :disabled="p.stock < 5 || updatingStockId === p.id"
                      class="px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white hover:text-primary rounded transition disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Diminuer de 5"
                    >
                      -5
                    </button>
                    <button
                      @click="adjustStock(p, -1)"
                      :disabled="p.stock <= 0 || updatingStockId === p.id"
                      class="px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white hover:text-primary rounded transition disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Diminuer de 1"
                    >
                      -1
                    </button>
                    <button
                      @click="adjustStock(p, 1)"
                      :disabled="updatingStockId === p.id"
                      class="px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white hover:text-primary rounded transition disabled:opacity-30"
                      title="Augmenter de 1"
                    >
                      +1
                    </button>
                    <button
                      @click="adjustStock(p, 5)"
                      :disabled="updatingStockId === p.id"
                      class="px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white hover:text-primary rounded transition disabled:opacity-30"
                      title="Augmenter de 5"
                    >
                      +5
                    </button>
                  </div>

                  <!-- Direct Count Input Modal Trigger -->
                  <button
                    @click="openDirectStockModal(p)"
                    class="text-gray-400 hover:text-primary p-1 text-xs transition"
                    title="Définir une valeur exacte"
                  >
                    <i class="fa-solid fa-sliders"></i>
                  </button>
                </div>
              </td>

              <!-- Active Status Badge & Quick Toggle -->
              <td class="px-4 py-4 whitespace-nowrap text-center">
                <button
                  @click="toggleActiveStatus(p)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition"
                  :class="p.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'"
                  :title="p.is_active ? 'Cliquez pour désactiver' : 'Cliquez pour activer'"
                >
                  <i :class="p.is_active ? 'fa-solid fa-eye mr-1 text-[10px]' : 'fa-solid fa-eye-slash mr-1 text-[10px]'"></i>
                  {{ p.is_active ? 'Actif' : 'Inactif' }}
                </button>
              </td>

              <!-- Action Buttons -->
              <td class="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  @click="openEditModal(p)"
                  class="p-2 text-primary hover:text-primary/70 hover:bg-accent rounded-lg transition"
                  title="Modifier le produit"
                >
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  @click="openDeleteModal(p)"
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer le produit"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- ADD PRODUCT MODAL                                              -->
    <!-- ============================================================== -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      @click.self="closeAddModal"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-accent text-primary flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-plus text-xs"></i>
            </div>
            <h3 class="font-serif font-bold text-lg text-primary">Nouveau Produit</h3>
          </div>
          <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Modal Form Body -->
        <form @submit.prevent="submitAddProduct" class="p-6 overflow-y-auto space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Code SKU -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Code SKU / Réf</label>
              <input
                v-model="addForm.reference_code"
                type="text"
                placeholder="Ex: T-SUC-01"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Catégorie <span class="text-red-500">*</span></label>
              <select
                v-model="addForm.category"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="sweet">Sucrée (Sweet)</option>
                <option value="savory">Salée (Savory)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name FR -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nom (Français) <span class="text-red-500">*</span></label>
              <input
                v-model="addForm.name_fr"
                required
                type="text"
                maxlength="150"
                placeholder="Fond de tarte vanille"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>

            <!-- Name EN -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Name (English) <span class="text-red-500">*</span></label>
              <input
                v-model="addForm.name_en"
                required
                type="text"
                maxlength="150"
                placeholder="Vanilla Tart Shell"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Price CAD -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Prix ($ CAD) <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-semibold text-xs">$</span>
                <input
                  v-model.number="addForm.price"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="6.50"
                  class="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
              </div>
            </div>

            <!-- Initial Stock -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Stock Initial <span class="text-red-500">*</span></label>
              <input
                v-model.number="addForm.stock"
                required
                type="number"
                min="0"
                placeholder="100"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>
          </div>

          <!-- Descriptions -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Description (FR)</label>
              <textarea
                v-model="addForm.description_fr"
                rows="2"
                placeholder="Description du produit..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Description (EN)</label>
              <textarea
                v-model="addForm.description_en"
                rows="2"
                placeholder="Product description in English..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              ></textarea>
            </div>
          </div>

          <!-- Image File Upload -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Image du Produit</label>
            <div class="flex items-center space-x-3">
              <input
                type="file"
                ref="addFileInput"
                @change="handleAddFileChange"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-primary hover:file:bg-secondary transition"
              >
            </div>
            <div v-if="addFilePreview" class="mt-2 flex items-center space-x-2">
              <img :src="addFilePreview" class="w-12 h-12 object-cover rounded-lg border border-gray-200">
              <span class="text-xs text-gray-500 truncate max-w-xs">{{ addForm.file?.name }}</span>
            </div>
            <p class="text-[11px] text-gray-400 mt-1">Formats acceptés : JPG, PNG, WEBP, GIF (max 5 Mo).</p>
          </div>

          <!-- Active checkbox -->
          <div class="flex items-center space-x-2 pt-1">
            <input
              id="add-is-active"
              v-model="addForm.is_active"
              type="checkbox"
              class="rounded border-gray-300 text-primary focus:ring-secondary h-4 w-4"
            >
            <label for="add-is-active" class="text-xs font-medium text-gray-700">Activer immédiatement dans la boutique publique</label>
          </div>

          <!-- Error message -->
          <div v-if="addErrorMsg" class="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
            {{ addErrorMsg }}
          </div>

          <!-- Modal Footer Actions -->
          <div class="pt-3 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              @click="closeAddModal"
              class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="savingProduct"
              class="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl transition shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
            >
              <i v-if="savingProduct" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>{{ savingProduct ? 'Création en cours...' : 'Créer le produit' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- EDIT PRODUCT MODAL                                             -->
    <!-- ============================================================== -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-accent text-primary flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-pen-to-square text-xs"></i>
            </div>
            <h3 class="font-serif font-bold text-lg text-primary">Modifier le Produit</h3>
          </div>
          <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 p-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Modal Form Body -->
        <form @submit.prevent="submitEditProduct" class="p-6 overflow-y-auto space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Code SKU -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Code SKU / Réf</label>
              <input
                v-model="editForm.reference_code"
                type="text"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Catégorie <span class="text-red-500">*</span></label>
              <select
                v-model="editForm.category"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                <option value="sweet">Sucrée (Sweet)</option>
                <option value="savory">Salée (Savory)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name FR -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nom (Français) <span class="text-red-500">*</span></label>
              <input
                v-model="editForm.name_fr"
                required
                type="text"
                maxlength="150"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>

            <!-- Name EN -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Name (English) <span class="text-red-500">*</span></label>
              <input
                v-model="editForm.name_en"
                required
                type="text"
                maxlength="150"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Price CAD -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Prix ($ CAD) <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-semibold text-xs">$</span>
                <input
                  v-model.number="editForm.price"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
              </div>
            </div>

            <!-- Stock -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Stock <span class="text-red-500">*</span></label>
              <input
                v-model.number="editForm.stock"
                required
                type="number"
                min="0"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
            </div>
          </div>

          <!-- Descriptions -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Description (FR)</label>
              <textarea
                v-model="editForm.description_fr"
                rows="2"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Description (EN)</label>
              <textarea
                v-model="editForm.description_en"
                rows="2"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
              ></textarea>
            </div>
          </div>

          <!-- Image Management -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Image du Produit</label>
            <div v-if="editForm.existing_image && !editForm.file" class="flex items-center space-x-3 mb-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
              <img :src="editForm.existing_image" class="w-12 h-12 object-cover rounded-lg border border-gray-200">
              <div class="text-xs text-gray-600">
                <span>Image actuelle</span>
                <p class="text-[11px] text-gray-400">Sélectionnez un nouveau fichier pour remplacer l'image.</p>
              </div>
            </div>

            <input
              type="file"
              ref="editFileInput"
              @change="handleEditFileChange"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-primary hover:file:bg-secondary transition"
            >

            <div v-if="editFilePreview" class="mt-2 flex items-center space-x-2">
              <img :src="editFilePreview" class="w-12 h-12 object-cover rounded-lg border border-gray-200">
              <span class="text-xs text-emerald-700 font-medium truncate max-w-xs">Nouvelle image prête : {{ editForm.file?.name }}</span>
            </div>
          </div>

          <!-- Active checkbox -->
          <div class="flex items-center space-x-2 pt-1">
            <input
              id="edit-is-active"
              v-model="editForm.is_active"
              type="checkbox"
              class="rounded border-gray-300 text-primary focus:ring-secondary h-4 w-4"
            >
            <label for="edit-is-active" class="text-xs font-medium text-gray-700">Activer le produit dans la boutique publique</label>
          </div>

          <!-- Error message -->
          <div v-if="editErrorMsg" class="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
            {{ editErrorMsg }}
          </div>

          <!-- Modal Footer Actions -->
          <div class="pt-3 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              @click="closeEditModal"
              class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="savingProduct"
              class="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl transition shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
            >
              <i v-if="savingProduct" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>{{ savingProduct ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- DIRECT EXACT STOCK MODAL                                       -->
    <!-- ============================================================== -->
    <div
      v-if="isDirectStockModalOpen"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="isDirectStockModalOpen = false"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 class="font-serif font-bold text-base text-primary">Définir le Stock</h3>
          <button @click="isDirectStockModalOpen = false" class="text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <div>
          <p class="text-xs text-gray-600 mb-2">
            Produit : <strong>{{ directStockProduct?.name_fr }}</strong>
          </p>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Nouveau stock (unités)</label>
          <input
            v-model.number="directStockValue"
            type="number"
            min="0"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
        </div>

        <div class="flex justify-end space-x-2 pt-2">
          <button
            @click="isDirectStockModalOpen = false"
            class="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            @click="applyDirectStock"
            :disabled="directStockValue < 0 || updatingStockId !== null"
            class="px-4 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
          >
            Valider
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- DELETE CONFIRMATION & FK CONFLICT MODAL                       -->
    <!-- ============================================================== -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <!-- Standard Confirmation State -->
        <template v-if="!deleteFkConflict">
          <div class="flex items-center space-x-3 text-red-600">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <i class="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <div>
              <h3 class="font-serif font-bold text-lg text-gray-900">Supprimer le produit</h3>
              <p class="text-xs text-gray-500">Cette action est irréversible.</p>
            </div>
          </div>

          <p class="text-xs text-gray-600">
            Êtes-vous certain de vouloir supprimer le produit
            <strong class="text-gray-900">« {{ productToDelete?.name_fr }} »</strong> du catalogue ?
          </p>

          <div v-if="deleteErrorMsg" class="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
            {{ deleteErrorMsg }}
          </div>

          <div class="flex justify-end space-x-3 pt-2">
            <button
              @click="closeDeleteModal"
              class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              @click="confirmDeleteProduct"
              :disabled="deletingProduct"
              class="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
            >
              <i v-if="deletingProduct" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>{{ deletingProduct ? 'Suppression...' : 'Supprimer définitivement' }}</span>
            </button>
          </div>
        </template>

        <!-- FK Conflict State (Product ordered in existing orders) -->
        <template v-else>
          <div class="flex items-center space-x-3 text-amber-600">
            <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <i class="fa-solid fa-shield-halved text-lg"></i>
            </div>
            <div>
              <h3 class="font-serif font-bold text-lg text-gray-900">Produit lié à des commandes</h3>
              <p class="text-xs text-amber-700 font-medium">Contrainte d'intégrité référentielle</p>
            </div>
          </div>

          <div class="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <p>
              Le produit <strong>« {{ productToDelete?.name_fr }} »</strong> ne peut pas être supprimé définitivement de la base de données car il figure dans des commandes clients passées.
            </p>
            <p class="font-medium text-amber-800">
              Recommandation : Désactivez le produit pour le masquer de la boutique publique tout en préservant l'intégrité de vos factures et commandes.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              @click="closeDeleteModal"
              class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition text-center"
            >
              Fermer
            </button>
            <button
              @click="deactivateConflictedProduct"
              :disabled="deletingProduct"
              class="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs disabled:opacity-50 inline-flex items-center justify-center space-x-1.5"
            >
              <i v-if="deletingProduct" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>{{ deletingProduct ? 'Désactivation...' : 'Désactiver le produit à la place' }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const { addToast } = useToast()

// Data State
const products = ref([])
const loading = ref(false)

// Filter Controls State
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStock = ref('all')
const selectedStatus = ref('all')

// Stock counters
const inStockCount = computed(() => products.value.filter(p => p.stock > 10).length)
const lowStockCount = computed(() => products.value.filter(p => p.stock > 0 && p.stock <= 10).length)
const outOfStockCount = computed(() => products.value.filter(p => p.stock === 0).length)

// Filter condition active check
const isFiltered = computed(() => {
  return searchQuery.value.trim() !== '' ||
    selectedCategory.value !== 'all' ||
    selectedStock.value !== 'all' ||
    selectedStatus.value !== 'all'
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedStock.value = 'all'
  selectedStatus.value = 'all'
}

// Filtered and searched list
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return products.value.filter(p => {
    // 1. Search Query
    if (query) {
      const matchNameFr = p.name_fr?.toLowerCase().includes(query)
      const matchNameEn = p.name_en?.toLowerCase().includes(query)
      const matchSku = p.reference_code?.toLowerCase().includes(query)
      if (!matchNameFr && !matchNameEn && !matchSku) {
        return false
      }
    }

    // 2. Category
    if (selectedCategory.value !== 'all' && p.category !== selectedCategory.value) {
      return false
    }

    // 3. Stock Level
    if (selectedStock.value === 'in_stock' && p.stock <= 10) return false
    if (selectedStock.value === 'low_stock' && (p.stock <= 0 || p.stock > 10)) return false
    if (selectedStock.value === 'out_of_stock' && p.stock !== 0) return false

    // 4. Status
    if (selectedStatus.value === 'active' && !p.is_active) return false
    if (selectedStatus.value === 'inactive' && p.is_active) return false

    return true
  })
})

// Fetch Products from Supabase
const fetchProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    products.value = data || []
  } catch (err) {
    console.error('Error fetching products:', err)
    addToast('Erreur lors du chargement des produits: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

// Badge Styling Helpers
const getStockBadgeClass = (stock) => {
  if (stock > 10) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (stock > 0) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

const getStockDotClass = (stock) => {
  if (stock > 10) return 'bg-emerald-500'
  if (stock > 0) return 'bg-amber-500'
  return 'bg-red-500'
}

const handleImageError = (p) => {
  p.image_url = null
}

// =========================================================================
// QUICK STOCK ADJUSTMENT
// =========================================================================
const updatingStockId = ref(null)

const adjustStock = async (product, delta) => {
  const currentStock = product.stock || 0
  const newStock = Math.max(0, currentStock + delta)

  if (newStock === currentStock) return

  updatingStockId.value = product.id
  try {
    const { error } = await supabase
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)

    if (error) throw error

    product.stock = newStock
    addToast(`Stock mis à jour pour « ${product.name_fr} » : ${newStock}`, 'success')
  } catch (err) {
    console.error('Stock adjustment error:', err)
    addToast('Erreur lors de la mise à jour du stock: ' + err.message, 'error')
  } finally {
    updatingStockId.value = null
  }
}

// Direct Exact Stock Modal
const isDirectStockModalOpen = ref(false)
const directStockProduct = ref(null)
const directStockValue = ref(0)

const openDirectStockModal = (product) => {
  directStockProduct.value = product
  directStockValue.value = product.stock || 0
  isDirectStockModalOpen.value = true
}

const applyDirectStock = async () => {
  if (!directStockProduct.value || directStockValue.value < 0) return
  const newStock = Math.max(0, Math.floor(directStockValue.value))

  updatingStockId.value = directStockProduct.value.id
  try {
    const { error } = await supabase
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', directStockProduct.value.id)

    if (error) throw error

    directStockProduct.value.stock = newStock
    addToast(`Stock défini à ${newStock} pour « ${directStockProduct.value.name_fr} »`, 'success')
    isDirectStockModalOpen.value = false
  } catch (err) {
    console.error('Direct stock error:', err)
    addToast('Erreur: ' + err.message, 'error')
  } finally {
    updatingStockId.value = null
  }
}

// Quick Active Toggle
const toggleActiveStatus = async (product) => {
  const newStatus = !product.is_active
  try {
    const { error } = await supabase
      .from('products')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)

    if (error) throw error

    product.is_active = newStatus
    addToast(`Produit « ${product.name_fr} » ${newStatus ? 'activé' : 'désactivé'}`, 'success')
  } catch (err) {
    console.error('Toggle status error:', err)
    addToast('Erreur lors du changement de statut: ' + err.message, 'error')
  }
}

// =========================================================================
// ADD PRODUCT
// =========================================================================
const isAddModalOpen = ref(false)
const savingProduct = ref(false)
const addErrorMsg = ref('')
const addFileInput = ref(null)
const addFilePreview = ref(null)

const addForm = ref({
  reference_code: '',
  category: 'sweet',
  name_fr: '',
  name_en: '',
  price: 6.50,
  stock: 100,
  description_fr: '',
  description_en: '',
  file: null,
  is_active: true
})

const openAddModal = () => {
  addForm.value = {
    reference_code: '',
    category: 'sweet',
    name_fr: '',
    name_en: '',
    price: 6.50,
    stock: 100,
    description_fr: '',
    description_en: '',
    file: null,
    is_active: true
  }
  addFilePreview.value = null
  addErrorMsg.value = ''
  if (addFileInput.value) addFileInput.value.value = ''
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const handleAddFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    addErrorMsg.value = 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.'
    addForm.value.file = null
    addFilePreview.value = null
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    addErrorMsg.value = 'Le fichier dépasse la taille maximale autorisée (5 Mo).'
    addForm.value.file = null
    addFilePreview.value = null
    return
  }

  addErrorMsg.value = ''
  addForm.value.file = file
  addFilePreview.value = URL.createObjectURL(file)
}

const submitAddProduct = async () => {
  if (!addForm.value.name_fr.trim() || !addForm.value.name_en.trim()) {
    addErrorMsg.value = 'Veuillez renseigner les noms français et anglais.'
    return
  }

  if (addForm.value.name_fr.trim().length > 150 || addForm.value.name_en.trim().length > 150) {
    addErrorMsg.value = 'Le nom du produit ne peut pas dépasser 150 caractères.'
    return
  }

  if (addForm.value.price < 0) {
    addErrorMsg.value = 'Le prix ne peut pas être négatif.'
    return
  }

  if (addForm.value.stock < 0) {
    addErrorMsg.value = 'Le stock ne peut pas être négatif.'
    return
  }

  savingProduct.value = true
  addErrorMsg.value = ''

  try {
    let imageUrl = null

    // 1. Upload image if provided
    if (addForm.value.file) {
      const fileExt = addForm.value.file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `tart-shells/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, addForm.value.file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath)

      imageUrl = data.publicUrl
    }

    // 2. Insert into Supabase products table
    const payload = {
      reference_code: addForm.value.reference_code?.trim() || null,
      category: addForm.value.category,
      name_fr: addForm.value.name_fr.trim(),
      name_en: addForm.value.name_en.trim(),
      price_cents: Math.round(Number(addForm.value.price) * 100),
      stock: Math.max(0, Math.floor(Number(addForm.value.stock))),
      description_fr: addForm.value.description_fr?.trim() || '',
      description_en: addForm.value.description_en?.trim() || '',
      image_url: imageUrl,
      is_active: addForm.value.is_active
    }

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (insertError) throw insertError

    if (newProduct) {
      products.value.unshift(newProduct)
    } else {
      await fetchProducts()
    }

    addToast('Produit ajouté avec succès !', 'success')
    closeAddModal()
  } catch (err) {
    console.error('Error adding product:', err)
    addErrorMsg.value = err.message || 'Une erreur est survenue lors de la création.'
  } finally {
    savingProduct.value = false
  }
}

// =========================================================================
// EDIT PRODUCT
// =========================================================================
const isEditModalOpen = ref(false)
const editErrorMsg = ref('')
const editFileInput = ref(null)
const editFilePreview = ref(null)
const editProductId = ref(null)

const editForm = ref({
  reference_code: '',
  category: 'sweet',
  name_fr: '',
  name_en: '',
  price: 0,
  stock: 0,
  description_fr: '',
  description_en: '',
  existing_image: null,
  file: null,
  is_active: true
})

const openEditModal = (product) => {
  editProductId.value = product.id
  editForm.value = {
    reference_code: product.reference_code || '',
    category: product.category,
    name_fr: product.name_fr,
    name_en: product.name_en,
    price: (product.price_cents / 100),
    stock: product.stock,
    description_fr: product.description_fr || '',
    description_en: product.description_en || '',
    existing_image: product.image_url,
    file: null,
    is_active: product.is_active
  }
  editFilePreview.value = null
  editErrorMsg.value = ''
  if (editFileInput.value) editFileInput.value.value = ''
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const handleEditFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    editErrorMsg.value = 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.'
    editForm.value.file = null
    editFilePreview.value = null
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    editErrorMsg.value = 'Le fichier dépasse la taille maximale autorisée (5 Mo).'
    editForm.value.file = null
    editFilePreview.value = null
    return
  }

  editErrorMsg.value = ''
  editForm.value.file = file
  editFilePreview.value = URL.createObjectURL(file)
}

const submitEditProduct = async () => {
  if (!editForm.value.name_fr.trim() || !editForm.value.name_en.trim()) {
    editErrorMsg.value = 'Veuillez renseigner les noms français et anglais.'
    return
  }

  if (editForm.value.name_fr.trim().length > 150 || editForm.value.name_en.trim().length > 150) {
    editErrorMsg.value = 'Le nom du produit ne peut pas dépasser 150 caractères.'
    return
  }

  if (editForm.value.price < 0) {
    editErrorMsg.value = 'Le prix ne peut pas être négatif.'
    return
  }

  if (editForm.value.stock < 0) {
    editErrorMsg.value = 'Le stock ne peut pas être négatif.'
    return
  }

  savingProduct.value = true
  editErrorMsg.value = ''

  try {
    let imageUrl = editForm.value.existing_image

    // 1. Upload new image if provided
    if (editForm.value.file) {
      const fileExt = editForm.value.file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `tart-shells/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, editForm.value.file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath)

      // Delete previous image if it was in the bucket
      if (editForm.value.existing_image) {
        try {
          const oldPathMatch = editForm.value.existing_image.split('product_images/')[1]
          if (oldPathMatch) {
            await supabase.storage.from('product_images').remove([oldPathMatch])
          }
        } catch (e) {
          console.error('Failed to remove old image:', e)
        }
      }

      imageUrl = data.publicUrl
    }

    // 2. Update Supabase record
    const payload = {
      reference_code: editForm.value.reference_code?.trim() || null,
      category: editForm.value.category,
      name_fr: editForm.value.name_fr.trim(),
      name_en: editForm.value.name_en.trim(),
      price_cents: Math.round(Number(editForm.value.price) * 100),
      stock: Math.max(0, Math.floor(Number(editForm.value.stock))),
      description_fr: editForm.value.description_fr?.trim() || '',
      description_en: editForm.value.description_en?.trim() || '',
      image_url: imageUrl,
      is_active: editForm.value.is_active,
      updated_at: new Date().toISOString()
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editProductId.value)
      .select()
      .single()

    if (updateError) throw updateError

    // Update in memory
    const index = products.value.findIndex(p => p.id === editProductId.value)
    if (index !== -1 && updatedProduct) {
      products.value[index] = updatedProduct
    } else {
      await fetchProducts()
    }

    addToast('Produit mis à jour avec succès !', 'success')
    closeEditModal()
  } catch (err) {
    console.error('Error updating product:', err)
    editErrorMsg.value = err.message || 'Une erreur est survenue lors de la mise à jour.'
  } finally {
    savingProduct.value = false
  }
}

// =========================================================================
// DELETE CONFIRMATION & FOREIGN KEY ERROR HANDLING
// =========================================================================
const isDeleteModalOpen = ref(false)
const productToDelete = ref(null)
const deletingProduct = ref(false)
const deleteErrorMsg = ref('')
const deleteFkConflict = ref(false)

const openDeleteModal = (product) => {
  productToDelete.value = product
  deleteFkConflict.value = false
  deleteErrorMsg.value = ''
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  productToDelete.value = null
  deleteFkConflict.value = false
  deleteErrorMsg.value = ''
}

const confirmDeleteProduct = async () => {
  if (!productToDelete.value) return
  deletingProduct.value = true
  deleteErrorMsg.value = ''

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productToDelete.value.id)

    if (error) {
      // Check for Foreign Key violation: Postgres error code 23503
      const isFkError = error.code === '23503' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('violates foreign key') ||
        error.details?.includes('order_items')

      if (isFkError) {
        deleteFkConflict.value = true
        return
      }

      throw error
    }

    // Clean up image from storage if deleted successfully
    if (productToDelete.value.image_url) {
      try {
        const oldPathMatch = productToDelete.value.image_url.split('product_images/')[1]
        if (oldPathMatch) {
          await supabase.storage.from('product_images').remove([oldPathMatch])
        }
      } catch (e) {
        console.error('Failed to remove image on delete:', e)
      }
    }

    // Remove from in-memory list
    products.value = products.value.filter(p => p.id !== productToDelete.value.id)
    addToast(`Produit « ${productToDelete.value.name_fr} » supprimé avec succès.`, 'success')
    closeDeleteModal()
  } catch (err) {
    console.error('Error deleting product:', err)
    deleteErrorMsg.value = err.message || 'Impossible de supprimer le produit.'
  } finally {
    deletingProduct.value = false
  }
}

// One-click deactivation fallback when FK conflict occurs
const deactivateConflictedProduct = async () => {
  if (!productToDelete.value) return
  deletingProduct.value = true

  try {
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', productToDelete.value.id)

    if (error) throw error

    productToDelete.value.is_active = false
    addToast(`Produit « ${productToDelete.value.name_fr} » désactivé avec succès. L'historique des commandes est préservé.`, 'success')
    closeDeleteModal()
  } catch (err) {
    console.error('Error deactivating product:', err)
    deleteErrorMsg.value = err.message || 'Erreur lors de la désactivation.'
  } finally {
    deletingProduct.value = false
  }
}
</script>
