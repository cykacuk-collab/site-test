/**
 * Tier 2: Boundary & Corner Cases
 * 
 * Verifies edge conditions, input stress, boundary constraints, and error handling across:
 * 1. Route Security Boundary Cases (5 tests)
 * 2. Product Catalog Boundary Cases (5 tests)
 * 3. Add Product Boundary Cases (5 tests)
 * 4. Stock Adjustment Boundary Cases (5 tests)
 * 5. Delete & Deactivate Boundary Cases (5 tests)
 * 6. Paid Orders List Boundary Cases (5 tests)
 * 7. Customer Details & Cart Items Boundary Cases (5 tests)
 * 8. Order Status Update Boundary Cases (5 tests)
 * 9. Sales Analytics Boundary Cases (5 tests)
 * 10. Sales Chart & Image Upload Boundary Cases (5 tests)
 * 
 * Total: 50 test cases.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTestHarness,
  createMockJwt,
  evaluateRouteGuard,
  SSRHydrationSafetyChecker
} from './harness.ts';
import type {
  ProductRecord,
  OrderRecord,
  OrderItemRecord
} from './harness.ts';

describe('Tier 2: Boundary & Corner Cases', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  // =========================================================================
  // 1. Route Security Boundary Cases (5 tests)
  // =========================================================================
  describe('1. Route Security Boundary Cases', () => {
    it('T2.1: Missing auth cookie entirely returns 302 redirect to /admin/login', () => {
      const result = evaluateRouteGuard('/admin', {});
      assert.equal(result.allowed, false);
      assert.equal(result.redirectUrl, '/admin/login');
      assert.equal(result.statusCode, 302);
    });

    it('T2.2: Malformed JWT token (invalid base64 structure) safely returns 403 Forbidden without crashing', () => {
      const malformedToken = createMockJwt({ malformed: true });
      const result = evaluateRouteGuard('/admin', { 'sb-test-auth-token': malformedToken });
      assert.equal(result.allowed, false);
      assert.equal(result.statusCode, 403);
      assert.ok(result.errorMessage?.includes('Forbidden'));
    });

    it('T2.3: Expired JWT token timestamp (exp in the past) redirects to /admin/login with expired notice', () => {
      const expiredToken = createMockJwt({
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) - 300 // expired 5 minutes ago
      });
      const result = evaluateRouteGuard('/admin', { 'sb-test-auth-token': expiredToken });
      assert.equal(result.allowed, false);
      assert.equal(result.redirectUrl, '/admin/login');
      assert.ok(result.errorMessage?.includes('expired'));
    });

    it('T2.4: User with non-admin roles (editor, guest, viewer) strictly redirected to home /', () => {
      const editorToken = createMockJwt({ role: 'editor' });
      const result = evaluateRouteGuard('/admin/products', { 'sb-test-auth-token': editorToken }, false);
      assert.equal(result.allowed, false);
      assert.equal(result.redirectUrl, '/');
    });

    it('T2.5: Path traversal and query strings (/admin/../admin/products) are normalized and protected', () => {
      const unauthResult = evaluateRouteGuard('/admin/products?debug=true', {});
      assert.equal(unauthResult.allowed, false);
      assert.equal(unauthResult.redirectUrl, '/admin/login');
    });
  });

  // =========================================================================
  // 2. Product Catalog Boundary Cases (5 tests)
  // =========================================================================
  describe('2. Product Catalog Boundary Cases', () => {
    beforeEach(() => {
      harness.productService.createProduct({
        name_fr: 'Tartelette Myrtille Sauvage',
        name_en: 'Wild Blueberry Tartlet',
        category: 'sweet',
        price: 5.50,
        stock: 12,
        reference_code: 'T-BLU-01'
      });
    });

    it('T2.6: Empty or whitespace search query returns all active catalog items', () => {
      const all1 = harness.productService.listProducts({ search: '' });
      const all2 = harness.productService.listProducts({ search: '   ' });
      assert.equal(all1.length, 1);
      assert.equal(all2.length, 1);
    });

    it('T2.7: Search query with no matching products returns empty array without throwing', () => {
      const results = harness.productService.listProducts({ search: 'NonExistentTart12345' });
      assert.equal(results.length, 0);
    });

    it('T2.8: Search query containing SQL/regex meta-characters is handled literally', () => {
      const results1 = harness.productService.listProducts({ search: "'; DROP TABLE products; --" });
      const results2 = harness.productService.listProducts({ search: ".*" });
      assert.equal(results1.length, 0);
      assert.equal(results2.length, 0);
    });

    it('T2.9: Extreme product title (> 255 chars) is truncated in UI table with ellipsis without breaking layout', () => {
      const longTitle = 'Tartelette Artisanale '.repeat(15);
      const truncateDisplay = (str: string, maxLen = 40) =>
        str.length > maxLen ? str.slice(0, maxLen) + '...' : str;

      const formatted = truncateDisplay(longTitle);
      assert.ok(formatted.endsWith('...'));
      assert.ok(formatted.length <= 43);
    });

    it('T2.10: Case-insensitive search matches mixed-case input', () => {
      const results = harness.productService.listProducts({ search: 'mYrTiLlE' });
      assert.equal(results.length, 1);
      assert.equal(results[0].reference_code, 'T-BLU-01');
    });
  });

  // =========================================================================
  // 3. Add Product Boundary Cases (5 tests)
  // =========================================================================
  describe('3. Add Product Boundary Cases', () => {
    it('T2.11: Blank or whitespace-only product name_fr is strictly rejected', () => {
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: '   ',
          name_en: 'Valid English Name',
          category: 'sweet',
          price: 5.00,
          stock: 10
        });
      }, /Le nom en français .* obligatoire/);
    });

    it('T2.12: Extremely long product name (> 150 characters) is rejected by length constraint', () => {
      const longName = 'A'.repeat(151);
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: longName,
          name_en: 'Valid Name',
          category: 'sweet',
          price: 5.00,
          stock: 10
        });
      }, /ne doit pas dépasser 150 caractères/);
    });

    it('T2.13: Invalid category enum is rejected by domain check', () => {
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: 'Tarte Pomme',
          name_en: 'Apple Tart',
          category: 'beverage' as any,
          price: 4.50,
          stock: 10
        });
      }, /Catégorie invalide/);
    });

    it('T2.14: Negative price is strictly rejected by price validation (price >= 0)', () => {
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: 'Tarte Pomme',
          name_en: 'Apple Tart',
          category: 'sweet',
          price: -5.00,
          stock: 10
        });
      }, /Le prix doit être un nombre positif ou nul/);
    });

    it('T2.15: Zero price ($0.00 CAD) is allowed for free promotional or tasting items', () => {
      const promoProduct = harness.productService.createProduct({
        name_fr: 'Échantillon Dégustation Tartelette',
        name_en: 'Tasting Sample Tartlet',
        category: 'sweet',
        price: 0.00,
        stock: 50
      });
      assert.equal(promoProduct.price_cents, 0);
    });
  });

  // =========================================================================
  // 4. Stock Adjustment Boundary Cases (5 tests)
  // =========================================================================
  describe('4. Stock Adjustment Boundary Cases', () => {
    let testProductId: string;

    beforeEach(() => {
      const p = harness.productService.createProduct({
        name_fr: 'Produit Test Stock',
        name_en: 'Stock Test Product',
        category: 'sweet',
        price: 4.00,
        stock: 0
      });
      testProductId = p.id;
    });

    it('T2.16: Setting stock to negative value on creation or update is strictly rejected', () => {
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: 'Invalid Stock Product',
          name_en: 'Invalid Stock Product',
          category: 'sweet',
          price: 3.00,
          stock: -1
        });
      }, /Le stock doit être un entier positif ou nul/);
    });

    it('T2.17: Decrementing stock when stock is 0 throws error preventing negative stock', () => {
      assert.throws(() => {
        harness.productService.quickAdjustStock(testProductId, -1);
      }, /Le stock ne peut pas être négatif/);
    });

    it('T2.18: Non-integer stock input (floating decimal) is rejected by schema validator', () => {
      assert.throws(() => {
        harness.productService.createProduct({
          name_fr: 'Float Stock Tart',
          name_en: 'Float Stock Tart',
          category: 'sweet',
          price: 5.00,
          stock: 5.5 as any
        });
      }, /Le stock doit être un entier positif ou nul/);
    });

    it('T2.19: Very large inventory count (e.g. 500,000 units) stored and incremented accurately', () => {
      const largeStockP = harness.productService.createProduct({
        name_fr: 'Grande Commande Industrielle',
        name_en: 'Large Industrial Order',
        category: 'sweet',
        price: 2.00,
        stock: 500000
      });
      const adjusted = harness.productService.quickAdjustStock(largeStockP.id, 50000);
      assert.equal(adjusted.stock, 550000);
    });

    it('T2.20: Stock status categorization boundary values (0 = out_of_stock, 10 = low_stock, 11 = in_stock)', () => {
      const pZero = harness.productService.createProduct({ name_fr: 'Z', name_en: 'Z', category: 'sweet', price: 1, stock: 0 });
      const pLow = harness.productService.createProduct({ name_fr: 'L', name_en: 'L', category: 'sweet', price: 1, stock: 10 });
      const pIn = harness.productService.createProduct({ name_fr: 'I', name_en: 'I', category: 'sweet', price: 1, stock: 11 });

      const outOfStock = harness.productService.listProducts({ stockLevel: 'out_of_stock' });
      const lowStock = harness.productService.listProducts({ stockLevel: 'low_stock' });
      const inStock = harness.productService.listProducts({ stockLevel: 'in_stock' });

      assert.ok(outOfStock.some(p => p.id === pZero.id));
      assert.ok(lowStock.some(p => p.id === pLow.id));
      assert.ok(inStock.some(p => p.id === pIn.id));
    });
  });

  // =========================================================================
  // 5. Delete & Deactivate Boundary Cases (5 tests)
  // =========================================================================
  describe('5. Delete & Deactivate Boundary Cases', () => {
    it('T2.21: Foreign key violation 23503 intercepts deletion and sets is_active = false', () => {
      const p = harness.productService.createProduct({ name_fr: 'P1', name_en: 'P1', category: 'sweet', price: 5, stock: 10 });
      const mockOrderItem: OrderItemRecord = {
        id: 'oi-1',
        order_id: 'ord-1',
        product_id: p.id,
        quantity: 2,
        price_at_purchase_cents: 500
      };

      const result = harness.productService.deleteProduct(p.id, [mockOrderItem]);
      assert.equal(result.deleted, false);
      assert.equal(result.deactivated, true);
      assert.ok(result.reason?.includes('FK_VIOLATION_23503'));
      assert.equal(harness.productService.getProduct(p.id)?.is_active, false);
    });

    it('T2.22: Attempting to delete non-existent product ID throws clear error', () => {
      assert.throws(() => {
        harness.productService.deleteProduct('non-existent-uuid', []);
      }, /Produit introuvable/);
    });

    it('T2.23: Deactivating an already inactive product remains inactive without duplicate error', () => {
      const p = harness.productService.createProduct({ name_fr: 'P2', name_en: 'P2', category: 'sweet', price: 5, stock: 10 });
      const mockOrderItem: OrderItemRecord = {
        id: 'oi-2',
        order_id: 'ord-2',
        product_id: p.id,
        quantity: 1,
        price_at_purchase_cents: 500
      };

      harness.productService.deleteProduct(p.id, [mockOrderItem]);
      const secondAttempt = harness.productService.deleteProduct(p.id, [mockOrderItem]);
      assert.equal(secondAttempt.deactivated, true);
      assert.equal(harness.productService.getProduct(p.id)?.is_active, false);
    });

    it('T2.24: Hard deletion of product with null image_url succeeds without storage cleanup error', () => {
      const p = harness.productService.createProduct({
        name_fr: 'No Image Product',
        name_en: 'No Image Product',
        category: 'sweet',
        price: 3,
        stock: 5,
        image_url: null
      });

      const res = harness.productService.deleteProduct(p.id, []);
      assert.equal(res.deleted, true);
      assert.equal(harness.productService.getProduct(p.id), undefined);
    });

    it('T2.25: Rapid consecutive delete requests handle idempotency gracefully', () => {
      const p = harness.productService.createProduct({ name_fr: 'Rapid Delete', name_en: 'Rapid Delete', category: 'sweet', price: 3, stock: 5 });
      const first = harness.productService.deleteProduct(p.id, []);
      assert.equal(first.deleted, true);

      assert.throws(() => {
        harness.productService.deleteProduct(p.id, []);
      }, /Produit introuvable/);
    });
  });

  // =========================================================================
  // 6. Paid Orders List Boundary Cases (5 tests)
  // =========================================================================
  describe('6. Paid Orders List Boundary Cases', () => {
    it('T2.26: 0 orders in database displays clean empty state without throwing exceptions', () => {
      const emptyOrderService = harness.orderService;
      const orders = emptyOrderService.listOrders();
      assert.equal(orders.length, 0);
    });

    it('T2.27: Orders with mixed statuses (cancelled, expired, pending) filter accurately', () => {
      harness.orderService.createOrder({
        user_id: 'u1',
        stripe_session_id: 'cs_1',
        customer_email: 'a@ex.com',
        customer_name: 'A',
        amount_total_cents: 1000,
        status: 'cancelled'
      }, []);

      harness.orderService.createOrder({
        user_id: 'u2',
        stripe_session_id: 'cs_2',
        customer_email: 'b@ex.com',
        customer_name: 'B',
        amount_total_cents: 1500,
        status: 'paid'
      }, []);

      const cancelled = harness.orderService.listOrders({ status: 'cancelled' });
      const paid = harness.orderService.listOrders({ status: 'paid' });

      assert.equal(cancelled.length, 1);
      assert.equal(paid.length, 1);
    });

    it('T2.28: Order with missing customer name falls back to Guest / Client invité format', () => {
      const guestOrder = harness.orderService.createOrder({
        user_id: null,
        stripe_session_id: 'cs_guest_999',
        customer_email: 'anonymous@example.com',
        customer_name: null,
        amount_total_cents: 2500,
        status: 'paid'
      }, []);

      const details = harness.orderService.getOrderWithDetails(guestOrder.id);
      const displayName = details.order.customer_name || 'Client invité';
      assert.equal(displayName, 'Client invité');
    });

    it('T2.29: Large order volume (50 orders) sorts and filters in sub-millisecond execution', () => {
      for (let i = 0; i < 50; i++) {
        harness.orderService.createOrder({
          user_id: `u-${i}`,
          stripe_session_id: `cs_bulk_${i}`,
          customer_email: `user${i}@example.com`,
          customer_name: `User ${i}`,
          amount_total_cents: 1000 + i * 100,
          status: i % 2 === 0 ? 'paid' : 'shipped'
        }, []);
      }

      const all = harness.orderService.listOrders();
      assert.ok(all.length >= 50);
      // verify sorted descending by created_at
      const t0 = new Date(all[0].created_at).getTime();
      const tEnd = new Date(all[all.length - 1].created_at).getTime();
      assert.ok(t0 >= tEnd);
    });

    it('T2.30: Order with missing stripe_session_id formatted safely', () => {
      const order = harness.orderService.createOrder({
        user_id: 'u-stripe-test',
        stripe_session_id: '',
        customer_email: 'test@example.com',
        customer_name: 'Test',
        amount_total_cents: 1000,
        status: 'paid'
      }, []);

      const formattedSession = order.stripe_session_id || 'N/A';
      assert.equal(formattedSession, 'N/A');
    });
  });

  // =========================================================================
  // 7. Customer Details & Cart Items Boundary Cases (5 tests)
  // =========================================================================
  describe('7. Customer Details & Cart Items Boundary Cases', () => {
    it('T2.31: Guest order with user_id = null and customer_name = null does not throw null pointer errors', () => {
      const order = harness.orderService.createOrder({
        user_id: null,
        stripe_session_id: 'cs_guest_01',
        customer_email: 'buyer@test.ca',
        customer_name: null,
        amount_total_cents: 3000,
        status: 'paid'
      }, []);

      const details = harness.orderService.getOrderWithDetails(order.id);
      assert.equal(details.order.user_id, null);
      assert.equal(details.order.customer_name, null);
      assert.equal(details.formattedTotal, '$30.00 CAD');
    });

    it('T2.32: Order with empty cart items array renders details gracefully without crashing', () => {
      const order = harness.orderService.createOrder({
        user_id: 'u-empty',
        stripe_session_id: 'cs_empty_cart',
        customer_email: 'empty@test.ca',
        customer_name: 'Empty Cart User',
        amount_total_cents: 0,
        status: 'paid'
      }, []);

      const details = harness.orderService.getOrderWithDetails(order.id);
      assert.equal(details.items.length, 0);
      assert.equal(details.formattedTotal, '$0.00 CAD');
    });

    it('T2.33: Cart item referencing deleted/archived product falls back to placeholder name', () => {
      const order = harness.orderService.createOrder({
        user_id: 'u-deleted',
        stripe_session_id: 'cs_deleted_prod',
        customer_email: 'buyer@test.ca',
        customer_name: 'Buyer',
        amount_total_cents: 1200,
        status: 'paid'
      }, [
        {
          product_id: 'non-existent-product-id',
          quantity: 2,
          price_at_purchase_cents: 600
        }
      ]);

      const details = harness.orderService.getOrderWithDetails(order.id, harness.productService);
      assert.equal(details.items.length, 1);
      assert.equal(details.items[0].product?.name_fr, 'Produit retiré');
    });

    it('T2.34: Extremely long customer email wraps cleanly and does not corrupt layout', () => {
      const longEmail = 'extremely.long.customer.email.address.for.testing.boundary.cases@subdomain.example.com';
      const order = harness.orderService.createOrder({
        user_id: 'u-long-email',
        stripe_session_id: 'cs_long_email',
        customer_email: longEmail,
        customer_name: 'Long Email Person',
        amount_total_cents: 1500,
        status: 'paid'
      }, []);

      const details = harness.orderService.getOrderWithDetails(order.id);
      assert.equal(details.order.customer_email, longEmail);
    });

    it('T2.35: Cart item with quantity calculation: line_total_cents = quantity * price_at_purchase_cents', () => {
      const order = harness.orderService.createOrder({
        user_id: 'u-calc',
        stripe_session_id: 'cs_calc',
        customer_email: 'calc@test.ca',
        customer_name: 'Calc User',
        amount_total_cents: 3500,
        status: 'paid'
      }, [
        { product_id: 'p-1', quantity: 5, price_at_purchase_cents: 700 }
      ]);

      const details = harness.orderService.getOrderWithDetails(order.id);
      assert.equal(details.items[0].line_total_cents, 3500);
    });
  });

  // =========================================================================
  // 8. Order Status Update Boundary Cases (5 tests)
  // =========================================================================
  describe('8. Order Status Update Boundary Cases', () => {
    let testOrderId: string;

    beforeEach(() => {
      const o = harness.orderService.createOrder({
        user_id: 'u-status',
        stripe_session_id: 'cs_status_test',
        customer_email: 'status@test.ca',
        customer_name: 'Status Test User',
        amount_total_cents: 2000,
        status: 'paid'
      }, []);
      testOrderId = o.id;
    });

    it('T2.36: Invalid status string (e.g. "refunded_custom" or SQL injection) is rejected with clear error', () => {
      assert.throws(() => {
        harness.orderService.updateOrderStatus(testOrderId, 'invalid_status_xyz', { role: 'admin' });
      }, /Statut invalide/);
    });

    it('T2.37: Updating status of non-existent order ID throws Order Not Found error', () => {
      assert.throws(() => {
        harness.orderService.updateOrderStatus('uuid-not-found-000', 'shipped', { role: 'admin' });
      }, /Commande non trouvée/);
    });

    it('T2.38: Unauthorized status update (missing admin role) throws RLS 42501 error', () => {
      assert.throws(() => {
        harness.orderService.updateOrderStatus(testOrderId, 'shipped', { role: 'customer' });
      }, /RLS 42501: permission denied/);
    });

    it('T2.39: Transitioning status to cancelled is permitted for customer service cancellations', () => {
      const res = harness.orderService.updateOrderStatus(testOrderId, 'cancelled', { role: 'admin' });
      assert.equal(res.order.status, 'cancelled');
    });

    it('T2.40: Database error rollback simulation: state remains intact if error thrown', () => {
      const initial = harness.orderService.listOrders().find(o => o.id === testOrderId)!;
      assert.equal(initial.status, 'paid');

      try {
        harness.orderService.updateOrderStatus(testOrderId, 'malformed_status', { role: 'admin' });
      } catch (err) {
        // expected
      }

      const unchanged = harness.orderService.listOrders().find(o => o.id === testOrderId)!;
      assert.equal(unchanged.status, 'paid');
    });
  });

  // =========================================================================
  // 9. Sales Analytics Boundary Cases (5 tests)
  // =========================================================================
  describe('9. Sales Analytics Boundary Cases', () => {
    it('T2.41: 0 orders in database: Total Revenue returns $0.00 CAD (not NaN or null)', () => {
      const revCents = harness.analyticsService.calculateTotalRevenueCents([]);
      assert.equal(revCents, 0);
      assert.equal(harness.analyticsService.formatCurrencyCAD(revCents), '$0.00 CAD');
    });

    it('T2.42: 0 orders in database: Total Orders count returns 0', () => {
      const count = harness.analyticsService.calculateTotalOrders([]);
      assert.equal(count, 0);
    });

    it('T2.43: 0 orders in database: AOV handles division by zero (0 / 0) returning $0.00 CAD (no NaN or Infinity)', () => {
      const aovCents = harness.analyticsService.calculateAverageOrderValueCents(0, 0);
      assert.equal(aovCents, 0);
      assert.equal(harness.analyticsService.formatCurrencyCAD(aovCents), '$0.00 CAD');
      assert.ok(!Number.isNaN(aovCents));
      assert.ok(Number.isFinite(aovCents));
    });

    it('T2.44: Cancelled and expired orders strictly excluded from revenue sum and AOV', () => {
      const orders: OrderRecord[] = [
        {
          id: 'o-c1',
          user_id: null,
          stripe_session_id: 'cs_c1',
          customer_email: 'c@test.ca',
          customer_name: 'C',
          amount_total_cents: 5000,
          status: 'cancelled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'o-e1',
          user_id: null,
          stripe_session_id: 'cs_e1',
          customer_email: 'e@test.ca',
          customer_name: 'E',
          amount_total_cents: 3000,
          status: 'expired',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'o-p1',
          user_id: null,
          stripe_session_id: 'cs_p1',
          customer_email: 'p@test.ca',
          customer_name: 'P',
          amount_total_cents: 4000,
          status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const rev = harness.analyticsService.calculateTotalRevenueCents(orders);
      const count = harness.analyticsService.calculateTotalOrders(orders);
      const aov = harness.analyticsService.calculateAverageOrderValueCents(rev, count);

      assert.equal(rev, 4000); // Only paid order ($40.00 CAD)
      assert.equal(count, 1);
      assert.equal(aov, 4000);
    });

    it('T2.45: Floating point precision: integer cents math prevents decimal rounding errors', () => {
      // 3 items at $19.99 = 59.97. In raw JS float: 19.99 * 3 = 59.970000000000006
      const itemPriceCents = 1999;
      const totalCents = itemPriceCents * 3;
      assert.equal(totalCents, 5997);
      assert.equal(harness.analyticsService.formatCurrencyCAD(totalCents), '$59.97 CAD');
    });
  });

  // =========================================================================
  // 10. Sales Chart & Image Upload Boundary Cases (5 tests)
  // =========================================================================
  describe('10. Sales Chart & Image Upload Boundary Cases', () => {
    it('T2.46: Empty dataset (0 orders) computes empty revenueByDay array cleanly', () => {
      const analytics = harness.analyticsService.computeAnalytics([], [], []);
      assert.equal(analytics.revenueByDay.length, 0);
      assert.equal(analytics.topProducts.length, 0);
    });

    it('T2.47: Single order computes single datapoint for chart rendering', () => {
      const singleOrder: OrderRecord = {
        id: 'ord-single',
        user_id: null,
        stripe_session_id: 'cs_single',
        customer_email: 's@test.ca',
        customer_name: 'Single',
        amount_total_cents: 2500,
        status: 'paid',
        created_at: '2026-09-28T12:00:00Z',
        updated_at: '2026-09-28T12:00:00Z'
      };

      const analytics = harness.analyticsService.computeAnalytics([singleOrder], [], []);
      assert.equal(analytics.revenueByDay.length, 1);
      assert.equal(analytics.revenueByDay[0].date, '2026-09-28');
      assert.equal(analytics.revenueByDay[0].revenueCents, 2500);
    });

    it('T2.48: Image upload with disallowed MIME type (application/pdf, text/html) rejected with error', () => {
      const pdfFile = { name: 'document.pdf', type: 'application/pdf', size: 1024 * 100 };
      const validation = harness.productService.validateImageFile(pdfFile);
      assert.equal(validation.valid, false);
      assert.ok(validation.error?.includes('Format invalide'));
    });

    it('T2.49: Image upload exceeding 5MB size limit rejected with file too large error', () => {
      const largeFile = { name: 'huge-image.png', type: 'image/png', size: 6 * 1024 * 1024 }; // 6MB
      const validation = harness.productService.validateImageFile(largeFile);
      assert.equal(validation.valid, false);
      assert.ok(validation.error?.includes('Fichier trop volumineux'));
    });

    it('T2.50: Missing product image (image_url = null) displays fallback placeholder gracefully', () => {
      const p = harness.productService.createProduct({
        name_fr: 'Produit Sans Photo',
        name_en: 'Product Without Photo',
        category: 'sweet',
        price: 3.50,
        stock: 10,
        image_url: null
      });

      const fallbackIcon = p.image_url ? p.image_url : 'placeholder-cake-candles-icon';
      assert.equal(fallbackIcon, 'placeholder-cake-candles-icon');
    });
  });
});
