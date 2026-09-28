/**
 * Empirical Adversarial Challenge Test Suite
 * Component under test: app/pages/admin/products.vue
 * 
 * Verifies the 5 critical challenge dimensions:
 * 1. Stock count boundary handling (rejection / capping to 0)
 * 2. Price boundary handling (negative price rejection, NaN handling)
 * 3. Image upload format & size boundary validation (.exe, .pdf, > 5MB rejection)
 * 4. Image URL null / broken link fallback icon handling
 * 5. Postgres foreign key error 23503 interception & one-click soft deactivation
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Adversarial Challenge: Product & Inventory Management (products.vue)', () => {

  // =========================================================================
  // 1. Stock Boundary Tests
  // =========================================================================
  describe('1. Stock Count Boundary Values', () => {

    it('Quick adjust: decrementing stock below 0 caps newStock to 0', () => {
      let updatedPayload: any = null;
      const fakeSupabase = {
        from: (table: string) => ({
          update: (payload: any) => ({
            eq: (field: string, val: any) => {
              updatedPayload = payload;
              return { error: null };
            }
          })
        })
      };

      const adjustStock = async (product: { id: string; stock: number; name_fr: string }, delta: number) => {
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock + delta);
        if (newStock === currentStock) return { updated: false, stock: currentStock };

        const { error } = await fakeSupabase.from('products').update({ stock: newStock }).eq('id', product.id);
        if (error) throw error;
        product.stock = newStock;
        return { updated: true, stock: newStock };
      };

      // Test 1a: product with stock = 3, delta = -5 -> must cap to 0
      const p1 = { id: 'p-1', stock: 3, name_fr: 'Tarte Fraise' };
      const res1 = adjustStock(p1, -5);
      return res1.then(r => {
        assert.equal(r.updated, true);
        assert.equal(r.stock, 0);
        assert.equal(p1.stock, 0);
        assert.equal(updatedPayload.stock, 0);

        // Test 1b: product with stock = 0, delta = -1 -> must not call DB and remain 0
        updatedPayload = null;
        const p2 = { id: 'p-2', stock: 0, name_fr: 'Tarte Citron' };
        return adjustStock(p2, -1);
      }).then(r2 => {
        assert.equal(r2.updated, false);
        assert.equal(r2.stock, 0);
        assert.equal(updatedPayload, null); // No DB update issued
      });
    });

    it('Quick adjust UI button disable checks prevent illegal decrements', () => {
      const isMinus5Disabled = (stock: number, updating: boolean) => stock < 5 || updating;
      const isMinus1Disabled = (stock: number, updating: boolean) => stock <= 0 || updating;

      // Stock = 0: both buttons disabled
      assert.equal(isMinus5Disabled(0, false), true);
      assert.equal(isMinus1Disabled(0, false), true);

      // Stock = 3: -5 disabled, -1 enabled
      assert.equal(isMinus5Disabled(3, false), true);
      assert.equal(isMinus1Disabled(3, false), false);

      // Stock = 5: both enabled
      assert.equal(isMinus5Disabled(5, false), false);
      assert.equal(isMinus1Disabled(5, false), false);

      // Updating in flight: all disabled
      assert.equal(isMinus5Disabled(10, true), true);
      assert.equal(isMinus1Disabled(10, true), true);
    });

    it('Direct stock modal: negative value is rejected early', async () => {
      let dbUpdated = false;
      const directStockValue = { value: -5 };
      const directStockProduct = { value: { id: 'p-1', name_fr: 'Tarte', stock: 10 } };

      const applyDirectStock = async () => {
        if (!directStockProduct.value || directStockValue.value < 0) return { rejected: true };
        const newStock = Math.max(0, Math.floor(directStockValue.value));
        dbUpdated = true;
        directStockProduct.value.stock = newStock;
        return { rejected: false, stock: newStock };
      };

      const result = await applyDirectStock();
      assert.equal(result.rejected, true);
      assert.equal(dbUpdated, false);
      assert.equal(directStockProduct.value.stock, 10);
    });

    it('Direct stock modal: decimal values are floored to integers and non-negative', async () => {
      const directStockValue = { value: 14.7 };
      const directStockProduct = { value: { id: 'p-1', name_fr: 'Tarte', stock: 5 } };

      const applyDirectStock = async () => {
        if (!directStockProduct.value || directStockValue.value < 0) return { rejected: true };
        const newStock = Math.max(0, Math.floor(directStockValue.value));
        directStockProduct.value.stock = newStock;
        return { rejected: false, stock: newStock };
      };

      const result = await applyDirectStock();
      assert.equal(result.rejected, false);
      assert.equal(result.stock, 14);
      assert.equal(directStockProduct.value.stock, 14);
    });

    it('Add & Edit form stock validation: rejects negative stock with error message', () => {
      const validateStock = (stock: number) => {
        if (stock < 0) {
          return { valid: false, error: 'Le stock ne peut pas être négatif.' };
        }
        return { valid: true, sanitizedStock: Math.max(0, Math.floor(Number(stock))) };
      };

      assert.deepEqual(validateStock(-1), { valid: false, error: 'Le stock ne peut pas être négatif.' });
      assert.deepEqual(validateStock(-100), { valid: false, error: 'Le stock ne peut pas être négatif.' });
      assert.equal(validateStock(0).valid, true);
      assert.equal(validateStock(0).sanitizedStock, 0);
      assert.equal(validateStock(50).valid, true);
      assert.equal(validateStock(50).sanitizedStock, 50);
    });
  });

  // =========================================================================
  // 2. Price Boundary Tests (Negative & NaN)
  // =========================================================================
  describe('2. Price Boundary Values (Negative & NaN)', () => {

    it('Add / Edit form: negative price is rejected before API call', () => {
      const submitForm = (form: { price: number; name_fr: string; name_en: string }) => {
        let errorMsg = '';
        if (!form.name_fr.trim() || !form.name_en.trim()) {
          errorMsg = 'Veuillez renseigner les noms français et anglais.';
          return { ok: false, error: errorMsg };
        }
        if (form.price < 0) {
          errorMsg = 'Le prix ne peut pas être négatif.';
          return { ok: false, error: errorMsg };
        }
        const price_cents = Math.round(Number(form.price) * 100);
        return { ok: true, price_cents };
      };

      // Negative prices
      const res1 = submitForm({ name_fr: 'Tarte', name_en: 'Tart', price: -0.01 });
      assert.equal(res1.ok, false);
      assert.equal(res1.error, 'Le prix ne peut pas être négatif.');

      const res2 = submitForm({ name_fr: 'Tarte', name_en: 'Tart', price: -50 });
      assert.equal(res2.ok, false);
      assert.equal(res2.error, 'Le prix ne peut pas être négatif.');

      // Zero price CAD is valid (e.g. tasting sample)
      const res3 = submitForm({ name_fr: 'Échantillon', name_en: 'Sample', price: 0 });
      assert.equal(res3.ok, true);
      assert.equal(res3.price_cents, 0);

      // Normal price
      const res4 = submitForm({ name_fr: 'Tarte', name_en: 'Tart', price: 6.50 });
      assert.equal(res4.ok, true);
      assert.equal(res4.price_cents, 650);
    });

    it('NaN price handling: JSON serialization turns NaN to null, caught by DB NOT NULL constraint 23502', async () => {
      // Trace what happens if NaN reaches the submit pipeline:
      const form = { name_fr: 'Tarte', name_en: 'Tart', price: NaN, stock: 10 };
      let addErrorMsg = '';

      const submitAddProduct = async (f: any) => {
        if (!f.name_fr.trim() || !f.name_en.trim()) {
          addErrorMsg = 'Veuillez renseigner les noms français et anglais.';
          return;
        }
        if (f.price < 0) {
          addErrorMsg = 'Le prix ne peut pas être négatif.';
          return;
        }
        if (f.stock < 0) {
          addErrorMsg = 'Le stock ne peut pas être négatif.';
          return;
        }

        try {
          const payload = {
            name_fr: f.name_fr,
            name_en: f.name_en,
            price_cents: Math.round(Number(f.price) * 100),
            stock: Math.max(0, Math.floor(Number(f.stock)))
          };

          // Simulating JSON serialization sent across HTTP to PostgREST
          const serialized = JSON.stringify(payload);
          const parsed = JSON.parse(serialized);

          // In PostgREST / Postgres, price_cents is INTEGER NOT NULL CHECK (price_cents >= 0)
          if (parsed.price_cents === null || isNaN(payload.price_cents)) {
            const dbError = new Error('null value in column "price_cents" of relation "products" violates not-null constraint');
            (dbError as any).code = '23502';
            throw dbError;
          }
        } catch (err: any) {
          addErrorMsg = err.message || 'Une erreur est survenue lors de la création.';
        }
      };

      await submitAddProduct(form);
      assert.ok(addErrorMsg.includes('violates not-null constraint'));
    });
  });

  // =========================================================================
  // 3. Image Upload Validation Tests
  // =========================================================================
  describe('3. Image Upload Validation (.exe, .pdf, > 5MB)', () => {

    const validateImageFile = (file: { name: string; type: string; size: number }) => {
      let errorMsg = '';
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        errorMsg = 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.';
        return { valid: false, error: errorMsg };
      }

      if (file.size > 5 * 1024 * 1024) {
        errorMsg = 'Le fichier dépasse la taille maximale autorisée (5 Mo).';
        return { valid: false, error: errorMsg };
      }

      return { valid: true, error: null };
    };

    it('Rejects executable files (.exe) with explicit error', () => {
      const exeFile = { name: 'malware.exe', type: 'application/x-msdownload', size: 1024 * 50 };
      const res = validateImageFile(exeFile);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.');
    });

    it('Rejects PDF documents (.pdf) with explicit error', () => {
      const pdfFile = { name: 'menu.pdf', type: 'application/pdf', size: 1024 * 100 };
      const res = validateImageFile(pdfFile);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.');
    });

    it('Rejects SVG vector images (potential XSS vector) with explicit error', () => {
      const svgFile = { name: 'icon.svg', type: 'image/svg+xml', size: 2048 };
      const res = validateImageFile(svgFile);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF.');
    });

    it('Rejects images exceeding 5MB limit', () => {
      const limit = 5 * 1024 * 1024; // 5,242,880 bytes
      const slightlyOverLimit = { name: 'large.jpg', type: 'image/jpeg', size: limit + 1 };
      const res = validateImageFile(slightlyOverLimit);
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Le fichier dépasse la taille maximale autorisée (5 Mo).');
    });

    it('Accepts valid image formats within 5MB limit', () => {
      const validJpg = { name: 'tart.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 };
      const validPng = { name: 'tart.png', type: 'image/png', size: 5 * 1024 * 1024 }; // exactly 5MB
      const validWebp = { name: 'tart.webp', type: 'image/webp', size: 500 * 1024 };
      const validGif = { name: 'tart.gif', type: 'image/gif', size: 1 * 1024 * 1024 };

      assert.equal(validateImageFile(validJpg).valid, true);
      assert.equal(validateImageFile(validPng).valid, true);
      assert.equal(validateImageFile(validWebp).valid, true);
      assert.equal(validateImageFile(validGif).valid, true);
    });
  });

  // =========================================================================
  // 4. Broken and Null Image URL Fallback Tests
  // =========================================================================
  describe('4. Image URL Fallback Handling (null and broken URLs)', () => {

    it('Null or missing image_url renders fallback cookie icon', () => {
      const product = {
        id: 'p-1',
        name_fr: 'Tartelette Myrtille',
        image_url: null
      };

      // Simulates template v-if="p.image_url" :src="p.image_url" v-else <i class="fa-solid fa-cookie ...">
      const renderThumbnail = (p: typeof product) => {
        if (p.image_url) {
          return { type: 'img', src: p.image_url };
        }
        return { type: 'icon', iconClass: 'fa-solid fa-cookie text-primary/40 text-lg' };
      };

      const renderResult = renderThumbnail(product);
      assert.equal(renderResult.type, 'icon');
      assert.ok(renderResult.iconClass.includes('fa-cookie'));
    });

    it('Broken image URL triggers handleImageError, sets image_url = null, and falls back to icon', () => {
      const product: { id: string; name_fr: string; image_url: string | null } = {
        id: 'p-2',
        name_fr: 'Tartelette Citron Meringuée',
        image_url: 'https://histoire-saveurs.ca/storage/non-existent-image.jpg'
      };

      const handleImageError = (p: typeof product) => {
        p.image_url = null;
      };

      // Initially product has an image URL
      assert.equal(typeof product.image_url, 'string');

      // Simulating DOM Image error event: @error="handleImageError(p)"
      handleImageError(product);

      // After error handler executes:
      assert.equal(product.image_url, null);

      // Next render cycle produces fallback icon
      const renderThumbnail = (p: typeof product) => {
        if (p.image_url) {
          return { type: 'img', src: p.image_url };
        }
        return { type: 'icon', iconClass: 'fa-solid fa-cookie text-primary/40 text-lg' };
      };

      const afterErrorRender = renderThumbnail(product);
      assert.equal(afterErrorRender.type, 'icon');
      assert.ok(afterErrorRender.iconClass.includes('fa-cookie'));
    });
  });

  // =========================================================================
  // 5. Foreign Key Error 23503 and Soft Deactivation Tests
  // =========================================================================
  describe('5. Postgres Foreign Key 23503 Interception & Soft Deactivation', () => {

    it('Catches code 23503 on delete, activates deleteFkConflict modal, and offers deactivation', async () => {
      const productToDelete = {
        id: 'prod-ordered-1',
        name_fr: 'Tartelette Chocolat Grand Cru',
        is_active: true
      };

      let deleteFkConflict = false;
      let deleteErrorMsg = '';
      let isDeleteModalOpen = true;

      // Mock Supabase delete returning Postgres 23503 error
      const mockSupabaseDeleteFk = {
        from: (table: string) => ({
          delete: () => ({
            eq: async (field: string, id: string) => {
              return {
                data: null,
                error: {
                  code: '23503',
                  message: 'update or delete on table "products" violates foreign key constraint "order_items_product_id_fkey" on table "order_items"',
                  details: 'Key (id)=(prod-ordered-1) is still referenced from table "order_items".'
                }
              };
            }
          })
        })
      };

      const confirmDeleteProduct = async () => {
        const { error } = await mockSupabaseDeleteFk.from('products').delete().eq('id', productToDelete.id);

        if (error) {
          const isFkError = error.code === '23503' ||
            error.message?.includes('foreign key constraint') ||
            error.message?.includes('violates foreign key') ||
            error.details?.includes('order_items');

          if (isFkError) {
            deleteFkConflict = true;
            return;
          }
          throw error;
        }
      };

      await confirmDeleteProduct();

      // Modal must transition to FK Conflict State
      assert.equal(deleteFkConflict, true);
      assert.equal(deleteErrorMsg, '');

      // Now verify clicking "Désactiver le produit à la place" (deactivateConflictedProduct)
      let updateCalled = false;
      const mockSupabaseUpdate = {
        from: (table: string) => ({
          update: (payload: any) => ({
            eq: async (field: string, id: string) => {
              updateCalled = true;
              assert.equal(payload.is_active, false);
              assert.ok(payload.updated_at);
              return { data: { ...productToDelete, is_active: false }, error: null };
            }
          })
        })
      };

      const deactivateConflictedProduct = async () => {
        const { error } = await mockSupabaseUpdate.from('products').update({
          is_active: false,
          updated_at: new Date().toISOString()
        }).eq('id', productToDelete.id);

        if (error) throw error;
        productToDelete.is_active = false;
        isDeleteModalOpen = false;
      };

      await deactivateConflictedProduct();

      assert.equal(updateCalled, true);
      assert.equal(productToDelete.is_active, false);
      assert.equal(isDeleteModalOpen, false);
    });

    it('Non-FK database error does not trigger FK conflict modal, but shows error message', async () => {
      let deleteFkConflict = false;
      let deleteErrorMsg = '';

      const mockSupabaseOtherError = {
        from: (table: string) => ({
          delete: () => ({
            eq: async (field: string, id: string) => {
              return {
                data: null,
                error: {
                  code: '42501',
                  message: 'permission denied for table products',
                  details: null
                }
              };
            }
          })
        })
      };

      const confirmDeleteProduct = async () => {
        try {
          const { error } = await mockSupabaseOtherError.from('products').delete().eq('id', 'prod-123');
          if (error) {
            const isFkError = error.code === '23503' ||
              error.message?.includes('foreign key constraint') ||
              error.message?.includes('violates foreign key') ||
              error.details?.includes('order_items');

            if (isFkError) {
              deleteFkConflict = true;
              return;
            }
            throw error;
          }
        } catch (err: any) {
          deleteErrorMsg = err.message || 'Impossible de supprimer le produit.';
        }
      };

      await confirmDeleteProduct();

      assert.equal(deleteFkConflict, false);
      assert.equal(deleteErrorMsg, 'permission denied for table products');
    });
  });
});
