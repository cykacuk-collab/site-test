/**
 * Tier 3: Cross-Feature Combinations & Pairwise Interactions
 * 
 * Verifies multi-module interactions across:
 * - Product Creation -> Stock Updates -> Order Fulfillment -> Revenue Roll-up
 * - Order Status Transitions -> Analytics Recalculations
 * - Foreign Key Constraints -> Soft Deactivation -> Catalog Filtering
 * - Authentication Sessions -> Route Protection Lifecycle
 * 
 * Total: 12 test cases (threshold >= 10).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTestHarness,
  createMockJwt,
  evaluateRouteGuard
} from './harness.ts';
import type {
  ProductRecord,
  OrderRecord,
  OrderItemRecord
} from './harness.ts';

describe('Tier 3: Cross-Feature Combinations', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  it('T3.1: Product Creation -> Catalog Filter Visibility -> Quick Stock Adjustment', () => {
    // 1. Create a sweet product
    const product = harness.productService.createProduct({
      name_fr: 'Tartelette Noix de Pécan',
      name_en: 'Pecan Nut Tartlet',
      category: 'sweet',
      price: 6.90,
      stock: 15,
      reference_code: 'T-PEC-01'
    });

    // 2. Verify visibility in sweet category filter and absence in savory filter
    const sweetCatalog = harness.productService.listProducts({ category: 'sweet' });
    const savoryCatalog = harness.productService.listProducts({ category: 'savory' });
    assert.ok(sweetCatalog.some(p => p.id === product.id));
    assert.ok(!savoryCatalog.some(p => p.id === product.id));

    // 3. Perform quick stock increment (+10)
    const updated = harness.productService.quickAdjustStock(product.id, 10);
    assert.equal(updated.stock, 25);

    // 4. Verify catalog reflects updated stock immediately
    const catalogItem = harness.productService.getProduct(product.id);
    assert.equal(catalogItem?.stock, 25);
  });

  it('T3.2: Stock Depletion -> Catalog Low/Out-of-Stock Filter -> Alert Threshold', () => {
    // 1. Create product with initial stock 12 (in stock)
    const product = harness.productService.createProduct({
      name_fr: 'Tartelette Fraise des Bois',
      name_en: 'Wild Strawberry Tartlet',
      category: 'sweet',
      price: 7.20,
      stock: 12
    });

    assert.equal(harness.productService.listProducts({ stockLevel: 'in_stock' }).length, 1);
    assert.equal(harness.productService.listProducts({ stockLevel: 'low_stock' }).length, 0);

    // 2. Adjust stock down into low_stock threshold (e.g. 5)
    harness.productService.quickAdjustStock(product.id, -7);
    assert.equal(harness.productService.listProducts({ stockLevel: 'low_stock' }).length, 1);

    // 3. Adjust stock down to 0 (out_of_stock)
    harness.productService.quickAdjustStock(product.id, -5);
    assert.equal(harness.productService.listProducts({ stockLevel: 'out_of_stock' }).length, 1);
  });

  it('T3.3: Product Creation -> Customer Order Placement -> Cart Line Items Breakdown Matching', () => {
    // 1. Create product
    const product = harness.productService.createProduct({
      name_fr: 'Tarte Salée Chèvre Épinard',
      name_en: 'Goat Cheese Spinach Tart',
      category: 'savory',
      price: 8.50,
      stock: 40,
      reference_code: 'T-CHEV-01'
    });

    // 2. Place order containing 3 units of this product
    const order = harness.orderService.createOrder({
      user_id: 'cust-99',
      stripe_session_id: 'cs_test_goat_cheese',
      customer_email: 'foodie@montreal.ca',
      customer_name: 'Julien Mercier',
      amount_total_cents: 2550, // 3 * 850
      status: 'paid'
    }, [
      {
        product_id: product.id,
        quantity: 3,
        price_at_purchase_cents: 850,
        product
      }
    ]);

    // 3. Inspect order details and verify line items
    const orderDetails = harness.orderService.getOrderWithDetails(order.id, harness.productService);
    assert.equal(orderDetails.items.length, 1);
    assert.equal(orderDetails.items[0].product_id, product.id);
    assert.equal(orderDetails.items[0].quantity, 3);
    assert.equal(orderDetails.items[0].line_total_cents, 2550);
    assert.equal(orderDetails.formattedTotal, '$25.50 CAD');
  });

  it('T3.4: Order Placement -> Paid Status -> Revenue KPI Roll-up & Order Count Increment', () => {
    // 1. Check initial empty revenue state
    let analytics = harness.analyticsService.computeAnalytics([], [], []);
    assert.equal(analytics.totalRevenueCents, 0);
    assert.equal(analytics.totalOrders, 0);

    // 2. Create paid order for $45.00 CAD
    const o1 = harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_kpi_1',
      customer_email: 'kpi1@test.ca',
      customer_name: 'KPI Client 1',
      amount_total_cents: 4500,
      status: 'paid'
    }, []);

    // 3. Create second paid order for $55.00 CAD
    const o2 = harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_kpi_2',
      customer_email: 'kpi2@test.ca',
      customer_name: 'KPI Client 2',
      amount_total_cents: 5500,
      status: 'paid'
    }, []);

    // 4. Validate analytics recalculation
    analytics = harness.analyticsService.computeAnalytics(
      harness.orderService.listOrders(),
      harness.orderService.getAllOrderItems(),
      []
    );

    assert.equal(analytics.totalOrders, 2);
    assert.equal(analytics.totalRevenueCents, 10000); // $100.00 CAD
    assert.equal(analytics.averageOrderValueCents, 5000); // $50.00 CAD AOV
  });

  it('T3.5: Order Status Transition (paid -> processing -> shipped) -> Fulfillment Status Filter Refresh', () => {
    const order = harness.orderService.createOrder({
      user_id: 'u-filter',
      stripe_session_id: 'cs_filter_flow',
      customer_email: 'flow@test.ca',
      customer_name: 'Flow User',
      amount_total_cents: 3000,
      status: 'paid'
    }, []);

    // Initially in 'paid' list
    assert.equal(harness.orderService.listOrders({ status: 'paid' }).length, 1);
    assert.equal(harness.orderService.listOrders({ status: 'processing' }).length, 0);

    // Move to 'processing'
    harness.orderService.updateOrderStatus(order.id, 'processing', { role: 'admin' });
    assert.equal(harness.orderService.listOrders({ status: 'paid' }).length, 0);
    assert.equal(harness.orderService.listOrders({ status: 'processing' }).length, 1);

    // Move to 'shipped'
    harness.orderService.updateOrderStatus(order.id, 'shipped', { role: 'admin' });
    assert.equal(harness.orderService.listOrders({ status: 'processing' }).length, 0);
    assert.equal(harness.orderService.listOrders({ status: 'shipped' }).length, 1);
  });

  it('T3.6: Order Cancellation -> Instant Revenue Roll-up Recalculation (exclusion from AOV)', () => {
    const o1 = harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_cancel_1',
      customer_email: 'keep@test.ca',
      customer_name: 'Keep',
      amount_total_cents: 6000,
      status: 'paid'
    }, []);

    const o2 = harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_cancel_2',
      customer_email: 'cancel@test.ca',
      customer_name: 'Cancel',
      amount_total_cents: 4000,
      status: 'paid'
    }, []);

    // Before cancel: total = 10000, count = 2, AOV = 5000
    let analytics = harness.analyticsService.computeAnalytics(harness.orderService.listOrders(), [], []);
    assert.equal(analytics.totalRevenueCents, 10000);
    assert.equal(analytics.totalOrders, 2);

    // Cancel order 2
    harness.orderService.updateOrderStatus(o2.id, 'cancelled', { role: 'admin' });

    // After cancel: total = 6000, count = 1, AOV = 6000
    analytics = harness.analyticsService.computeAnalytics(harness.orderService.listOrders(), [], []);
    assert.equal(analytics.totalRevenueCents, 6000);
    assert.equal(analytics.totalOrders, 1);
    assert.equal(analytics.averageOrderValueCents, 6000);
  });

  it('T3.7: Product Linked to Paid Order -> Hard Deletion Attempt -> Foreign Key Intercept & Soft Deactivation', () => {
    const product = harness.productService.createProduct({
      name_fr: 'Tartelette Chocolat Grand Cru',
      name_en: 'Grand Cru Chocolate Tartlet',
      category: 'sweet',
      price: 7.50,
      stock: 30
    });

    const order = harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_fk_product',
      customer_email: 'fk@test.ca',
      customer_name: 'FK User',
      amount_total_cents: 1500,
      status: 'paid'
    }, [
      { product_id: product.id, quantity: 2, price_at_purchase_cents: 750, product }
    ]);

    // Attempt delete
    const result = harness.productService.deleteProduct(
      product.id,
      harness.orderService.getAllOrderItems()
    );

    assert.equal(result.deleted, false);
    assert.equal(result.deactivated, true);
    assert.ok(result.reason?.includes('FK_VIOLATION_23503'));

    // Product is still retrieved but is_active = false
    const dbProduct = harness.productService.getProduct(product.id);
    assert.equal(dbProduct?.is_active, false);
  });

  it('T3.8: Soft-Deactivated Product -> Public Store Exclusion -> Admin Catalog Inactifs Filter View', () => {
    const product = harness.productService.createProduct({
      name_fr: 'Produit Inactif Test',
      name_en: 'Inactive Product Test',
      category: 'sweet',
      price: 5.00,
      stock: 10
    });

    // Deactivate
    harness.productService.deleteProduct(product.id, [
      { id: '1', order_id: '2', product_id: product.id, quantity: 1, price_at_purchase_cents: 500 }
    ]);

    // Active filter hides it
    const activeProducts = harness.productService.listProducts({ activeStatus: 'active' });
    assert.ok(!activeProducts.some(p => p.id === product.id));

    // Inactive filter exposes it
    const inactiveProducts = harness.productService.listProducts({ activeStatus: 'inactive' });
    assert.ok(inactiveProducts.some(p => p.id === product.id));
  });

  it('T3.9: Multiple Products in Multiple Orders -> Top-Selling Products Leaderboard Aggregation & Ranking', () => {
    const p1 = harness.productService.createProduct({ name_fr: 'Pistache', name_en: 'Pistachio', category: 'sweet', price: 6, stock: 50 });
    const p2 = harness.productService.createProduct({ name_fr: 'Framboise', name_en: 'Raspberry', category: 'sweet', price: 7, stock: 50 });
    const p3 = harness.productService.createProduct({ name_fr: 'Chocolat', name_en: 'Chocolate', category: 'sweet', price: 6.5, stock: 50 });

    // Order 1: 5 Framboise, 2 Pistache
    harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_lb_1',
      customer_email: 'lb1@test.ca',
      customer_name: 'LB1',
      amount_total_cents: 4700,
      status: 'paid'
    }, [
      { product_id: p2.id, quantity: 5, price_at_purchase_cents: 700 },
      { product_id: p1.id, quantity: 2, price_at_purchase_cents: 600 }
    ]);

    // Order 2: 10 Framboise, 1 Chocolat
    harness.orderService.createOrder({
      user_id: null,
      stripe_session_id: 'cs_lb_2',
      customer_email: 'lb2@test.ca',
      customer_name: 'LB2',
      amount_total_cents: 7650,
      status: 'shipped'
    }, [
      { product_id: p2.id, quantity: 10, price_at_purchase_cents: 700 },
      { product_id: p3.id, quantity: 1, price_at_purchase_cents: 650 }
    ]);

    const analytics = harness.analyticsService.computeAnalytics(
      harness.orderService.listOrders(),
      harness.orderService.getAllOrderItems(),
      harness.productService.listProducts()
    );

    assert.equal(analytics.topProducts[0].id, p2.id); // Framboise: 15 units sold
    assert.equal(analytics.topProducts[0].unitsSold, 15);
    assert.equal(analytics.topProducts[0].revenueCents, 10500); // 15 * 700 = $105.00 CAD
    assert.equal(analytics.topProducts[1].id, p1.id); // Pistache: 2 units sold
    assert.equal(analytics.topProducts[2].id, p3.id); // Chocolat: 1 unit sold
  });

  it('T3.10: Admin Session Logout -> Route Guard Interception -> Login -> State Restoration', () => {
    // 1. Admin authenticated with valid JWT
    const adminToken = createMockJwt({ email: 'sirfoidoo@gmail.com', role: 'admin' });
    const authCookies: Record<string, string> = { 'sb-test-auth-token': adminToken };

    let access = evaluateRouteGuard('/admin/products', authCookies);
    assert.equal(access.allowed, true);

    // 2. Admin logs out -> token cookie is cleared
    delete authCookies['sb-test-auth-token'];

    access = evaluateRouteGuard('/admin/products', authCookies);
    assert.equal(access.allowed, false);
    assert.equal(access.redirectUrl, '/admin/login');

    // 3. Admin logs back in -> new session token set
    const freshToken = createMockJwt({ email: 'sirfoidoo@gmail.com', role: 'admin' });
    authCookies['sb-test-auth-token'] = freshToken;

    access = evaluateRouteGuard('/admin/products', authCookies);
    assert.equal(access.allowed, true);
  });

  it('T3.11: Inventory Restock via Quick Adjustment -> Real-time Catalog Stock Badge Reflection', () => {
    const product = harness.productService.createProduct({
      name_fr: 'Tartelette Abricot Romarin',
      name_en: 'Apricot Rosemary Tartlet',
      category: 'sweet',
      price: 5.50,
      stock: 0
    });

    const badgeLabel = (stock: number) => stock > 10 ? 'in_stock' : (stock > 0 ? 'low_stock' : 'out_of_stock');

    // Initially out of stock
    assert.equal(badgeLabel(product.stock), 'out_of_stock');

    // Restock +5 -> low_stock
    const restockLow = harness.productService.quickAdjustStock(product.id, 5);
    assert.equal(badgeLabel(restockLow.stock), 'low_stock');

    // Restock +10 -> in_stock
    const restockIn = harness.productService.quickAdjustStock(product.id, 10);
    assert.equal(badgeLabel(restockIn.stock), 'in_stock');
  });

  it('T3.12: Order with Custom SKU -> Cart Inspection Displays Correct Reference Code & Unit Price at Purchase', () => {
    const product = harness.productService.createProduct({
      reference_code: 'SKU-VIP-888',
      name_fr: 'Coffret Prestige 12 Tartes',
      name_en: 'Prestige Box 12 Tarts',
      category: 'sweet',
      price: 49.99,
      stock: 10
    });

    const order = harness.orderService.createOrder({
      user_id: 'vip-client',
      stripe_session_id: 'cs_prestige_888',
      customer_email: 'vip@luxury.ca',
      customer_name: 'Élise Tremblay',
      amount_total_cents: 4999,
      status: 'paid'
    }, [
      {
        product_id: product.id,
        quantity: 1,
        price_at_purchase_cents: 4999,
        product
      }
    ]);

    // Change product price in catalog later to $59.99 (historical purchase price should remain $49.99)
    harness.productService.updateProduct(product.id, { price: 59.99 });

    const orderDetails = harness.orderService.getOrderWithDetails(order.id, harness.productService);
    assert.equal(orderDetails.items[0].product?.reference_code, 'SKU-VIP-888');
    assert.equal(orderDetails.items[0].price_at_purchase_cents, 4999); // Historical price preserved
  });
});
