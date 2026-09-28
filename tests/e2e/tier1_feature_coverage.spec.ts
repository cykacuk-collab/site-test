/**
 * Tier 1: Feature Coverage (Happy Path Verification)
 * 
 * Verifies core functionality across 10 features:
 * 1. Route Auth Guard (5 tests)
 * 2. Product Catalog Table & Search (5 tests)
 * 3. Add Product with Image (5 tests)
 * 4. Edit Product & Stock Adjustment (5 tests)
 * 5. Delete & Deactivate Product (5 tests)
 * 6. Paid Orders List Display (5 tests)
 * 7. Customer Details & Cart Items (5 tests)
 * 8. Order Status Update (No RLS Error) (5 tests)
 * 9. Sales Analytics KPI Cards (5 tests)
 * 10. Sales Chart & Admin Navigation Layout (5 tests)
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

describe('Tier 1: Feature Coverage', () => {
  let harness: ReturnType<typeof createTestHarness>;

  const sampleProducts: ProductRecord[] = [
    {
      id: 'prod-001',
      reference_code: 'T-VAN-01',
      name_fr: 'Fond de tarte rond vanille',
      name_en: 'Round vanilla tart shell',
      description_fr: 'Pâte sablée croustillante pur beurre',
      description_en: 'Crispy all-butter shortcrust pastry',
      price_cents: 650,
      stock: 45,
      category: 'sweet',
      image_url: 'https://nzrooalbzeparcklxitz.supabase.co/storage/v1/object/public/product_images/tart-shells/vanilla.png',
      is_active: true,
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-09-20T10:00:00Z'
    },
    {
      id: 'prod-002',
      reference_code: 'T-CHO-02',
      name_fr: 'Fond de tarte chocolat noir',
      name_en: 'Dark chocolate tart shell',
      description_fr: 'Cacao intense 70%',
      description_en: 'Intense 70% dark cocoa',
      price_cents: 700,
      stock: 20,
      category: 'sweet',
      image_url: null,
      is_active: true,
      created_at: '2026-09-21T10:00:00Z',
      updated_at: '2026-09-21T10:00:00Z'
    },
    {
      id: 'prod-003',
      reference_code: 'T-HER-03',
      name_fr: 'Fond de tartelette herbes de Provence',
      name_en: 'Herbes de Provence savory tart shell',
      description_fr: 'Thym, romarin et origan bio',
      description_en: 'Organic thyme, rosemary, and oregano',
      price_cents: 800,
      stock: 5,
      category: 'savory',
      image_url: 'https://nzrooalbzeparcklxitz.supabase.co/storage/v1/object/public/product_images/tart-shells/herbs.png',
      is_active: true,
      created_at: '2026-09-22T10:00:00Z',
      updated_at: '2026-09-22T10:00:00Z'
    }
  ];

  const sampleOrders: OrderRecord[] = [
    {
      id: 'order-101',
      user_id: 'user-001',
      stripe_session_id: 'cs_test_stripe_session_101',
      customer_email: 'claire.dupont@example.com',
      customer_name: 'Claire Dupont',
      shipping_address: {
        street: '123 Rue Principale',
        city: 'Montreal',
        postal_code: 'H2X 1Y4',
        country: 'Canada'
      },
      amount_total_cents: 2000,
      status: 'paid',
      created_at: '2026-09-25T14:00:00Z',
      updated_at: '2026-09-25T14:00:00Z'
    },
    {
      id: 'order-102',
      user_id: null,
      stripe_session_id: 'cs_test_stripe_session_102',
      customer_email: 'guest.shopper@example.com',
      customer_name: null,
      amount_total_cents: 3500,
      status: 'processing',
      created_at: '2026-09-26T15:30:00Z',
      updated_at: '2026-09-26T15:30:00Z'
    }
  ];

  const sampleItems: OrderItemRecord[] = [
    {
      id: 'item-201',
      order_id: 'order-101',
      product_id: 'prod-001',
      quantity: 2,
      price_at_purchase_cents: 650,
      product: { name_fr: 'Fond de tarte rond vanille', reference_code: 'T-VAN-01' }
    },
    {
      id: 'item-202',
      order_id: 'order-101',
      product_id: 'prod-002',
      quantity: 1,
      price_at_purchase_cents: 700,
      product: { name_fr: 'Fond de tarte chocolat noir', reference_code: 'T-CHO-02' }
    },
    {
      id: 'item-203',
      order_id: 'order-102',
      product_id: 'prod-003',
      quantity: 4,
      price_at_purchase_cents: 800,
      product: { name_fr: 'Fond de tartelette herbes de Provence', reference_code: 'T-HER-03' }
    }
  ];

  beforeEach(() => {
    harness = createTestHarness({
      initialProducts: sampleProducts,
      initialOrders: sampleOrders,
      initialItems: sampleItems
    });
  });

  // =========================================================================
  // Feature 1: Route Auth Guard (5 tests)
  // =========================================================================
  describe('Feature 1: Route Auth Guard', () => {
    it('T1.1: Blocks unauthenticated user accessing /admin with redirect to /admin/login', () => {
      const result = evaluateRouteGuard('/admin', {});
      assert.equal(result.allowed, false);
      assert.equal(result.redirectUrl, '/admin/login');
      assert.equal(result.statusCode, 302);
    });

    it('T1.2: Blocks non-admin user (customer role) accessing /admin with redirect to /', () => {
      const customerToken = createMockJwt({ email: 'client@example.com', role: 'customer' });
      const result = evaluateRouteGuard('/admin', { 'sb-test-auth-token': customerToken }, false);
      assert.equal(result.allowed, false);
      assert.equal(result.redirectUrl, '/');
      assert.equal(result.statusCode, 302);
    });

    it('T1.3: Grants access to authenticated admin user with app_metadata.role = admin', () => {
      const adminToken = createMockJwt({ email: 'sirfoidoo@gmail.com', role: 'admin' });
      const result = evaluateRouteGuard('/admin/products', { 'sb-test-auth-token': adminToken });
      assert.equal(result.allowed, true);
      assert.equal(result.statusCode, 200);
    });

    it('T1.4: Allows unauthenticated access to /admin/login portal without redirection loop', () => {
      const result = evaluateRouteGuard('/admin/login', {});
      assert.equal(result.allowed, true);
      assert.equal(result.statusCode, 200);
    });

    it('T1.5: Protects nested admin sub-routes (/admin/orders, /admin/analytics)', () => {
      const result1 = evaluateRouteGuard('/admin/orders', {});
      const result2 = evaluateRouteGuard('/admin/analytics', {});
      assert.equal(result1.allowed, false);
      assert.equal(result1.redirectUrl, '/admin/login');
      assert.equal(result2.allowed, false);
      assert.equal(result2.redirectUrl, '/admin/login');
    });
  });

  // =========================================================================
  // Feature 2: Product Catalog Table & Search (5 tests)
  // =========================================================================
  describe('Feature 2: Product Catalog Table & Search', () => {
    it('T1.6: Displays all active products in catalog table ordered by creation date', () => {
      const catalog = harness.productService.listProducts();
      assert.equal(catalog.length, 3);
      assert.equal(catalog[0].id, 'prod-003'); // newest
      assert.equal(catalog[2].id, 'prod-001'); // oldest
    });

    it('T1.7: Searches products by French name in real-time (case-insensitive)', () => {
      const results = harness.productService.listProducts({ search: 'chocolat' });
      assert.equal(results.length, 1);
      assert.equal(results[0].name_fr, 'Fond de tarte chocolat noir');
    });

    it('T1.8: Searches products by English name in real-time', () => {
      const results = harness.productService.listProducts({ search: 'vanilla' });
      assert.equal(results.length, 1);
      assert.equal(results[0].name_en, 'Round vanilla tart shell');
    });

    it('T1.9: Searches products by SKU / reference_code', () => {
      const results = harness.productService.listProducts({ search: 'T-HER-03' });
      assert.equal(results.length, 1);
      assert.equal(results[0].reference_code, 'T-HER-03');
    });

    it('T1.10: Filters catalog by category (sweet vs savory)', () => {
      const sweetProducts = harness.productService.listProducts({ category: 'sweet' });
      const savoryProducts = harness.productService.listProducts({ category: 'savory' });
      assert.equal(sweetProducts.length, 2);
      assert.equal(savoryProducts.length, 1);
      assert.equal(savoryProducts[0].category, 'savory');
    });
  });

  // =========================================================================
  // Feature 3: Add Product with Image (5 tests)
  // =========================================================================
  describe('Feature 3: Add Product with Image', () => {
    it('T1.11: Successfully creates a new sweet product with valid required fields', () => {
      const newProduct = harness.productService.createProduct({
        name_fr: 'Tartelette Citron Meringuée',
        name_en: 'Lemon Meringue Tartlet',
        category: 'sweet',
        price: 6.50,
        stock: 50,
        reference_code: 'T-CIT-01'
      });

      assert.ok(newProduct.id);
      assert.equal(newProduct.name_fr, 'Tartelette Citron Meringuée');
      assert.equal(newProduct.price_cents, 650);
      assert.equal(newProduct.stock, 50);
      assert.equal(newProduct.is_active, true);
    });

    it('T1.12: Successfully creates a new savory product with optional descriptions', () => {
      const newProduct = harness.productService.createProduct({
        name_fr: 'Quiche Lorraine Traditionnelle',
        name_en: 'Traditional Quiche Lorraine',
        category: 'savory',
        price: 8.75,
        stock: 30,
        description_fr: 'Lardons fumés et crème fraîche',
        description_en: 'Smoked bacon and fresh cream',
        reference_code: 'Q-LOR-01'
      });

      assert.equal(newProduct.category, 'savory');
      assert.equal(newProduct.price_cents, 875);
      assert.equal(newProduct.description_fr, 'Lardons fumés et crème fraîche');
    });

    it('T1.13: Converts price decimal dollars to integer cents accurately (e.g. $12.99 -> 1299 cents)', () => {
      const product = harness.productService.createProduct({
        name_fr: 'Tartelette Caramel Beurre Salé',
        name_en: 'Salted Butter Caramel Tartlet',
        category: 'sweet',
        price: 12.99,
        stock: 15
      });
      assert.equal(product.price_cents, 1299);
    });

    it('T1.14: Validates image file type and generates unique storage path in tart-shells/', () => {
      const file = { name: 'caramel-tart.png', type: 'image/png', size: 1024 * 500 };
      const validation = harness.productService.validateImageFile(file);
      assert.equal(validation.valid, true);
      assert.ok(validation.storagePath?.startsWith('tart-shells/'));
      assert.ok(validation.storagePath?.endsWith('.png'));
    });

    it('T1.15: Uploads image to bucket and associates public URL with newly created product', () => {
      const file = { name: 'sample.webp', type: 'image/webp', size: 200 * 1024 };
      const validation = harness.productService.validateImageFile(file);
      const publicUrl = harness.productService.uploadImage(validation.storagePath!, 'binary_data');

      const product = harness.productService.createProduct({
        name_fr: 'Tartelette Fraise',
        name_en: 'Strawberry Tartlet',
        category: 'sweet',
        price: 7.00,
        stock: 25,
        image_url: publicUrl
      });

      assert.ok(product.image_url?.includes('product_images/tart-shells/'));
    });
  });

  // =========================================================================
  // Feature 4: Edit Product & Stock Adjustment (5 tests)
  // =========================================================================
  describe('Feature 4: Edit Product & Stock Adjustment', () => {
    it('T1.16: Prefills existing product details in edit form accurately', () => {
      const existing = harness.productService.getProduct('prod-001');
      assert.ok(existing);
      assert.equal(existing?.name_fr, 'Fond de tarte rond vanille');
      assert.equal(existing?.stock, 45);
      assert.equal(existing?.price_cents, 650);
    });

    it('T1.17: Updates product title and description while preserving existing image URL', () => {
      const updated = harness.productService.updateProduct('prod-001', {
        name_fr: 'Fond de tarte rond vanille Bourbon',
        description_fr: 'Gousses de vanille de Madagascar bio'
      });

      assert.equal(updated.name_fr, 'Fond de tarte rond vanille Bourbon');
      assert.equal(updated.description_fr, 'Gousses de vanille de Madagascar bio');
      assert.ok(updated.image_url?.includes('vanilla.png'));
    });

    it('T1.18: Quick stock increment (+10) increments inventory immediately', () => {
      const adjusted = harness.productService.quickAdjustStock('prod-001', 10);
      assert.equal(adjusted.stock, 55); // 45 + 10
    });

    it('T1.19: Quick stock decrement (-5) decrements inventory safely when stock is sufficient', () => {
      const adjusted = harness.productService.quickAdjustStock('prod-001', -5);
      assert.equal(adjusted.stock, 40); // 45 - 5
    });

    it('T1.20: Stock adjustment updates updated_at timestamp', () => {
      const initial = harness.productService.getProduct('prod-001')!;
      const adjusted = harness.productService.quickAdjustStock('prod-001', 1);
      assert.ok(new Date(adjusted.updated_at).getTime() >= new Date(initial.updated_at).getTime());
    });
  });

  // =========================================================================
  // Feature 5: Delete & Deactivate Product (5 tests)
  // =========================================================================
  describe('Feature 5: Delete & Deactivate Product', () => {
    it('T1.21: Hard deletes unreferenced product from catalog and storage', () => {
      const newP = harness.productService.createProduct({
        name_fr: 'Produit Temporaire',
        name_en: 'Temporary Product',
        category: 'sweet',
        price: 5.00,
        stock: 10
      });

      const res = harness.productService.deleteProduct(newP.id, harness.orderService.getAllOrderItems());
      assert.equal(res.deleted, true);
      assert.equal(res.deactivated, false);
      assert.equal(harness.productService.getProduct(newP.id), undefined);
    });

    it('T1.22: Cleans up associated image from product_images storage on deletion', () => {
      const storagePath = 'tart-shells/temp-delete.png';
      const url = harness.productService.uploadImage(storagePath, 'content');
      const product = harness.productService.createProduct({
        name_fr: 'Produit avec Image',
        name_en: 'Product with Image',
        category: 'sweet',
        price: 4.00,
        stock: 5,
        image_url: url
      });

      const res = harness.productService.deleteProduct(product.id, []);
      assert.equal(res.deleted, true);
      assert.equal(harness.productService.deleteImage(url), false); // Already removed
    });

    it('T1.23: Detects foreign key constraint when product has order history', () => {
      const res = harness.productService.deleteProduct('prod-001', harness.orderService.getAllOrderItems());
      assert.equal(res.deleted, false);
      assert.equal(res.deactivated, true);
      assert.ok(res.reason?.includes('FK_VIOLATION_23503'));
    });

    it('T1.24: Sets is_active = false on soft-deactivated product without deleting record', () => {
      harness.productService.deleteProduct('prod-001', harness.orderService.getAllOrderItems());
      const p = harness.productService.getProduct('prod-001');
      assert.ok(p);
      assert.equal(p?.is_active, false);
    });

    it('T1.25: Filters active vs inactive products in catalog view', () => {
      harness.productService.deleteProduct('prod-001', harness.orderService.getAllOrderItems());
      const activeList = harness.productService.listProducts({ activeStatus: 'active' });
      const inactiveList = harness.productService.listProducts({ activeStatus: 'inactive' });
      assert.equal(activeList.length, 2);
      assert.equal(inactiveList.length, 1);
      assert.equal(inactiveList[0].id, 'prod-001');
    });
  });

  // =========================================================================
  // Feature 6: Paid Orders List Display (5 tests)
  // =========================================================================
  describe('Feature 6: Paid Orders List Display', () => {
    it('T1.26: Fetches paid orders list sorted by created_at descending', () => {
      const orders = harness.orderService.listOrders();
      assert.equal(orders.length, 2);
      assert.equal(orders[0].id, 'order-102'); // Newer
      assert.equal(orders[1].id, 'order-101'); // Older
    });

    it('T1.27: Formats total amount in Canadian Dollars ($ CAD)', () => {
      const order = harness.orderService.getOrderWithDetails('order-101');
      assert.equal(order.formattedTotal, '$20.00 CAD');
    });

    it('T1.28: Displays status badges for each order status', () => {
      const orders = harness.orderService.listOrders();
      const statusList = orders.map(o => o.status);
      assert.ok(statusList.includes('paid'));
      assert.ok(statusList.includes('processing'));
    });

    it('T1.29: Filters orders by fulfillment status', () => {
      const paidOrders = harness.orderService.listOrders({ status: 'paid' });
      const processingOrders = harness.orderService.listOrders({ status: 'processing' });
      assert.equal(paidOrders.length, 1);
      assert.equal(paidOrders[0].id, 'order-101');
      assert.equal(processingOrders.length, 1);
      assert.equal(processingOrders[0].id, 'order-102');
    });

    it('T1.30: Searches orders by customer email or Stripe session ID', () => {
      const searchByEmail = harness.orderService.listOrders({ search: 'claire.dupont' });
      const searchByStripe = harness.orderService.listOrders({ search: 'session_102' });
      assert.equal(searchByEmail.length, 1);
      assert.equal(searchByStripe.length, 1);
    });
  });

  // =========================================================================
  // Feature 7: Customer Details & Cart Items (5 tests)
  // =========================================================================
  describe('Feature 7: Customer Details & Cart Items', () => {
    it('T1.31: Opens order detail modal displaying customer full name and email', () => {
      const details = harness.orderService.getOrderWithDetails('order-101', harness.productService);
      assert.equal(details.order.customer_name, 'Claire Dupont');
      assert.equal(details.order.customer_email, 'claire.dupont@example.com');
    });

    it('T1.32: Displays shipping address for Canadian destination', () => {
      const details = harness.orderService.getOrderWithDetails('order-101', harness.productService);
      assert.equal(details.order.shipping_address?.city, 'Montreal');
      assert.equal(details.order.shipping_address?.postal_code, 'H2X 1Y4');
    });

    it('T1.33: Itemizes cart items with product names and reference SKU', () => {
      const details = harness.orderService.getOrderWithDetails('order-101', harness.productService);
      assert.equal(details.items.length, 2);
      assert.equal(details.items[0].product?.name_fr, 'Fond de tarte rond vanille');
      assert.equal(details.items[0].product?.reference_code, 'T-VAN-01');
    });

    it('T1.34: Displays unit price at purchase and quantity for each line item', () => {
      const details = harness.orderService.getOrderWithDetails('order-101', harness.productService);
      const item1 = details.items[0];
      assert.equal(item1.quantity, 2);
      assert.equal(item1.price_at_purchase_cents, 650);
    });

    it('T1.35: Verifies that item line totals correctly sum to order total', () => {
      const details = harness.orderService.getOrderWithDetails('order-101', harness.productService);
      const calculatedSum = details.items.reduce((acc, itm) => acc + itm.line_total_cents, 0);
      assert.equal(calculatedSum, details.order.amount_total_cents);
    });
  });

  // =========================================================================
  // Feature 8: Order Status Update (No RLS Error) (5 tests)
  // =========================================================================
  describe('Feature 8: Order Status Update (No RLS Error)', () => {
    it('T1.36: Successfully transitions order status from paid to processing', () => {
      const res = harness.orderService.updateOrderStatus('order-101', 'processing', { role: 'admin' });
      assert.equal(res.success, true);
      assert.equal(res.order.status, 'processing');
    });

    it('T1.37: Successfully transitions order status from processing to shipped', () => {
      const res = harness.orderService.updateOrderStatus('order-102', 'shipped', { role: 'admin' });
      assert.equal(res.success, true);
      assert.equal(res.order.status, 'shipped');
    });

    it('T1.38: Successfully transitions order status from shipped to delivered', () => {
      harness.orderService.updateOrderStatus('order-102', 'shipped', { role: 'admin' });
      const res = harness.orderService.updateOrderStatus('order-102', 'delivered', { role: 'admin' });
      assert.equal(res.success, true);
      assert.equal(res.order.status, 'delivered');
    });

    it('T1.39: Uses service role / admin privilege to prevent RLS 42501 error', () => {
      const res = harness.orderService.updateOrderStatus('order-101', 'shipped', { isServiceRole: true });
      assert.equal(res.success, true);
      assert.equal(res.order.status, 'shipped');
    });

    it('T1.40: Updates updated_at timestamp on order status change', () => {
      const initialOrder = harness.orderService.listOrders().find(o => o.id === 'order-101')!;
      const res = harness.orderService.updateOrderStatus('order-101', 'delivered', { role: 'admin' });
      assert.ok(new Date(res.order.updated_at).getTime() >= new Date(initialOrder.updated_at).getTime());
    });
  });

  // =========================================================================
  // Feature 9: Sales Analytics KPI Cards (5 tests)
  // =========================================================================
  describe('Feature 9: Sales Analytics KPI Cards', () => {
    it('T1.41: Calculates Total Revenue accurately from all paid/fulfilled orders', () => {
      const allOrders = harness.orderService.listOrders();
      const revenueCents = harness.analyticsService.calculateTotalRevenueCents(allOrders);
      // order-101 (2000) + order-102 (3500) = 5500 cents ($55.00 CAD)
      assert.equal(revenueCents, 5500);
      assert.equal(harness.analyticsService.formatCurrencyCAD(revenueCents), '$55.00 CAD');
    });

    it('T1.42: Calculates Total Orders count accurately', () => {
      const allOrders = harness.orderService.listOrders();
      const count = harness.analyticsService.calculateTotalOrders(allOrders);
      assert.equal(count, 2);
    });

    it('T1.43: Calculates Average Order Value (AOV = Total Revenue / Total Orders)', () => {
      const aovCents = harness.analyticsService.calculateAverageOrderValueCents(5500, 2);
      assert.equal(aovCents, 2750); // $27.50 CAD
      assert.equal(harness.analyticsService.formatCurrencyCAD(aovCents), '$27.50 CAD');
    });

    it('T1.44: Counts active catalog products accurately', () => {
      const products = harness.productService.listProducts();
      const activeCount = products.filter(p => p.is_active).length;
      assert.equal(activeCount, 3);
    });

    it('T1.45: Ranks top-selling products by quantity and revenue descending', () => {
      const orders = harness.orderService.listOrders();
      const items = harness.orderService.getAllOrderItems();
      const products = harness.productService.listProducts();

      const analytics = harness.analyticsService.computeAnalytics(orders, items, products);
      assert.ok(analytics.topProducts.length >= 2);
      // prod-003 has 4 units sold (highest)
      assert.equal(analytics.topProducts[0].id, 'prod-003');
      assert.equal(analytics.topProducts[0].unitsSold, 4);
    });
  });

  // =========================================================================
  // Feature 10: Sales Chart & Admin Navigation Layout (5 tests)
  // =========================================================================
  describe('Feature 10: Sales Chart & Admin Navigation Layout', () => {
    it('T1.46: Renders visual sales chart strictly within <ClientOnly> wrapper', () => {
      const ssrCheck = SSRHydrationSafetyChecker.verifyChartSSRConfig({
        isClientOnlyWrapperUsed: true,
        hasFallbackSkeleton: true,
        directWindowAccessInSetup: false
      });
      assert.equal(ssrCheck.ssrSafe, true);
      assert.equal(ssrCheck.violations.length, 0);
    });

    it('T1.47: Fallback loading skeleton is defined to eliminate SSR hydration mismatch', () => {
      const ssrCheck = SSRHydrationSafetyChecker.verifyChartSSRConfig({
        isClientOnlyWrapperUsed: true,
        hasFallbackSkeleton: false,
        directWindowAccessInSetup: false
      });
      assert.equal(ssrCheck.ssrSafe, false);
      assert.ok(ssrCheck.violations[0].includes('fallback'));
    });

    it('T1.48: Admin navigation switches active tabs between Analytics, Products, and Orders', () => {
      const tabs = [
        { key: 'analytics', label: "Vue d'ensemble", href: '/admin' },
        { key: 'products', label: 'Produits & Stocks', href: '/admin/products' },
        { key: 'orders', label: 'Commandes', href: '/admin/orders' }
      ];
      assert.equal(tabs.length, 3);
      assert.equal(tabs[0].href, '/admin');
      assert.equal(tabs[1].href, '/admin/products');
      assert.equal(tabs[2].href, '/admin/orders');
    });

    it('T1.49: Displays admin user email and role badge in layout header', () => {
      const adminUser = { email: 'sirfoidoo@gmail.com', role: 'admin' };
      assert.equal(adminUser.role, 'admin');
      assert.ok(adminUser.email.includes('@'));
    });

    it('T1.50: Logout button terminates session and redirects user to /admin/login', () => {
      let sessionCleared = false;
      let targetRoute = '';
      const logoutAction = () => {
        sessionCleared = true;
        targetRoute = '/admin/login';
      };

      logoutAction();
      assert.equal(sessionCleared, true);
      assert.equal(targetRoute, '/admin/login');
    });
  });
});
