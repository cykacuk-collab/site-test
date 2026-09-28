/**
 * Tier 4: Real-World Scenarios
 * 
 * Verifies end-to-end admin operational workflows corresponding to
 * the 5 realistic scenarios defined in TEST_INFRA.md:
 * 1. Scenario 1: Daily Inventory Restock & Product Launch
 * 2. Scenario 2: Complete Order Fulfillment Lifecycle
 * 3. Scenario 3: Financial Analytics Audit
 * 4. Scenario 4: Product Deletion Safety on Ordered Item
 * 5. Scenario 5: Unauthorized Intrusion Attempt & Hard Refresh
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

describe('Tier 4: Real-World Scenarios', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  // =========================================================================
  // Scenario 1: Daily Inventory Restock & Product Launch
  // =========================================================================
  it('Scenario 1: Daily Inventory Restock & Product Launch', () => {
    // Context: Morning warehouse operations at Histoire et Saveurs.
    // Admin logs in to add a newly developed seasonal product and restock inventory.

    // 1. Authenticate admin user
    const adminToken = createMockJwt({ email: 'sirfoidoo@gmail.com', role: 'admin' });
    const authCheck = evaluateRouteGuard('/admin/products', { 'sb-test-auth-token': adminToken });
    assert.equal(authCheck.allowed, true);

    // 2. Validate and upload product photography
    const photo = { name: 'framboise_pistache.webp', type: 'image/webp', size: 450 * 1024 };
    const photoValidation = harness.productService.validateImageFile(photo);
    assert.equal(photoValidation.valid, true);
    assert.ok(photoValidation.storagePath);

    const publicImageUrl = harness.productService.uploadImage(
      photoValidation.storagePath!,
      'mock_binary_image_data'
    );
    assert.ok(publicImageUrl.includes('tart-shells/'));

    // 3. Create the seasonal product in the catalog
    const newProduct = harness.productService.createProduct({
      reference_code: 'T-SEA-2026',
      name_fr: 'Tartelette Framboise Pistache de Sicile',
      name_en: 'Sicilian Pistachio Raspberry Tartlet',
      description_fr: 'Crémeux pistache de Bronte et framboises fraîches locales',
      description_en: 'Bronte pistachio cream and fresh local raspberries',
      category: 'sweet',
      price: 8.50,
      stock: 25,
      image_url: publicImageUrl
    });

    assert.equal(newProduct.price_cents, 850);
    assert.equal(newProduct.stock, 25);
    assert.equal(newProduct.is_active, true);

    // 4. Warehouse receives an afternoon restock delivery: quick adjust stock by +30
    const restockedProduct = harness.productService.quickAdjustStock(newProduct.id, 30);
    assert.equal(restockedProduct.stock, 55);

    // 5. Customer support searches for the product by partial name in French
    const searchResults = harness.productService.listProducts({ search: 'Framboise' });
    assert.equal(searchResults.length, 1);
    assert.equal(searchResults[0].id, newProduct.id);
    assert.equal(searchResults[0].stock, 55);

    // 6. Verify category filtering displays product under 'sweet' and hides it under 'savory'
    const sweetCategory = harness.productService.listProducts({ category: 'sweet' });
    const savoryCategory = harness.productService.listProducts({ category: 'savory' });
    assert.ok(sweetCategory.some(p => p.id === newProduct.id));
    assert.ok(!savoryCategory.some(p => p.id === newProduct.id));
  });

  // =========================================================================
  // Scenario 2: Complete Order Fulfillment Lifecycle
  // =========================================================================
  it('Scenario 2: Complete Order Fulfillment Lifecycle', () => {
    // Context: An online customer places a catering order via Stripe.
    // Admin receives the order, validates cart items, transitions fulfillment status,
    // avoiding RLS 42501 permission errors.

    // 1. Setup products in store
    const sweetTart = harness.productService.createProduct({
      reference_code: 'T-CIT-01',
      name_fr: 'Tartelette Citron',
      name_en: 'Lemon Tartlet',
      category: 'sweet',
      price: 6.00,
      stock: 50
    });

    const savoryTart = harness.productService.createProduct({
      reference_code: 'T-LOR-01',
      name_fr: 'Tarte Salée Lorraine',
      name_en: 'Savory Lorraine Tart',
      category: 'savory',
      price: 7.50,
      stock: 40
    });

    // 2. Order arrives from Stripe webhook with status 'paid'
    const order = harness.orderService.createOrder({
      user_id: 'cust-st-louis',
      stripe_session_id: 'cs_live_51UGQcIRuA5qq8mnJ_order_catering_77',
      customer_email: 'jean.stlouis@traiteur.ca',
      customer_name: 'Jean St-Louis (Traiteur)',
      shipping_address: {
        street: '450 Rue Saint-Paul Ouest',
        city: 'Montreal',
        postal_code: 'H2Y 2A6',
        country: 'Canada'
      },
      amount_total_cents: 3900, // 4 * 600 + 2 * 750 = 2400 + 1500 = 3900 cents ($39.00 CAD)
      status: 'paid'
    }, [
      { product_id: sweetTart.id, quantity: 4, price_at_purchase_cents: 600, product: sweetTart },
      { product_id: savoryTart.id, quantity: 2, price_at_purchase_cents: 750, product: savoryTart }
    ]);

    // 3. Admin opens the Order Fulfillment page and inspects order drawer
    const details = harness.orderService.getOrderWithDetails(order.id, harness.productService);
    assert.equal(details.order.customer_name, 'Jean St-Louis (Traiteur)');
    assert.equal(details.order.customer_email, 'jean.stlouis@traiteur.ca');
    assert.equal(details.order.shipping_address?.city, 'Montreal');
    assert.equal(details.items.length, 2);
    assert.equal(details.items[0].line_total_cents, 2400);
    assert.equal(details.items[1].line_total_cents, 1500);
    assert.equal(details.formattedTotal, '$39.00 CAD');

    // 4. Kitchen staff begins baking -> status transition to 'processing'
    const processingUpdate = harness.orderService.updateOrderStatus(order.id, 'processing', { role: 'admin' });
    assert.equal(processingUpdate.order.status, 'processing');

    // 5. Courier takes the delivery -> status transition to 'shipped'
    const shippedUpdate = harness.orderService.updateOrderStatus(order.id, 'shipped', { role: 'admin' });
    assert.equal(shippedUpdate.order.status, 'shipped');

    // 6. Delivery confirmed at destination -> status transition to 'delivered'
    const deliveredUpdate = harness.orderService.updateOrderStatus(order.id, 'delivered', { isServiceRole: true });
    assert.equal(deliveredUpdate.order.status, 'delivered');

    // 7. Verify order reflects final status in orders list
    const finalOrders = harness.orderService.listOrders({ status: 'delivered' });
    assert.equal(finalOrders.length, 1);
    assert.equal(finalOrders[0].id, order.id);
  });

  // =========================================================================
  // Scenario 3: Financial Analytics Audit
  // =========================================================================
  it('Scenario 3: Financial Analytics Audit', () => {
    // Context: Weekly business performance audit by store manager.
    // Validates that all order totals roll up accurately into KPI cards, AOV,
    // and top-selling products leaderboard.

    // 1. Initial zero state validation
    let analytics = harness.analyticsService.computeAnalytics([], [], []);
    assert.equal(analytics.totalRevenueCents, 0);
    assert.equal(analytics.totalOrders, 0);
    assert.equal(analytics.averageOrderValueCents, 0);
    assert.equal(harness.analyticsService.formatCurrencyCAD(analytics.totalRevenueCents), '$0.00 CAD');
    assert.equal(harness.analyticsService.formatCurrencyCAD(analytics.averageOrderValueCents), '$0.00 CAD');

    // 2. Setup products
    const pVanilla = harness.productService.createProduct({ name_fr: 'Tarte Vanille', name_en: 'Vanilla Tart', category: 'sweet', price: 5.00, stock: 100 });
    const pChoco = harness.productService.createProduct({ name_fr: 'Tarte Chocolat', name_en: 'Choco Tart', category: 'sweet', price: 6.00, stock: 100 });

    // 3. Simulate business transactions:
    // Order 1: $50.00 CAD (paid) -> 10 Vanille
    harness.orderService.createOrder({
      user_id: 'u1',
      stripe_session_id: 'cs_audit_1',
      customer_email: 'audit1@test.ca',
      customer_name: 'Client 1',
      amount_total_cents: 5000,
      status: 'paid'
    }, [
      { product_id: pVanilla.id, quantity: 10, price_at_purchase_cents: 500 }
    ]);

    // Order 2: $70.00 CAD (delivered) -> 5 Vanille ($25), 5 Choco ($30) + $15 shipping/extras = 7000 cents
    harness.orderService.createOrder({
      user_id: 'u2',
      stripe_session_id: 'cs_audit_2',
      customer_email: 'audit2@test.ca',
      customer_name: 'Client 2',
      amount_total_cents: 7000,
      status: 'delivered'
    }, [
      { product_id: pVanilla.id, quantity: 5, price_at_purchase_cents: 500 },
      { product_id: pChoco.id, quantity: 5, price_at_purchase_cents: 600 }
    ]);

    // Order 3: $30.00 CAD (cancelled by customer) -> 5 Choco ($30)
    harness.orderService.createOrder({
      user_id: 'u3',
      stripe_session_id: 'cs_audit_3',
      customer_email: 'audit3@test.ca',
      customer_name: 'Client 3 (Cancelled)',
      amount_total_cents: 3000,
      status: 'cancelled'
    }, [
      { product_id: pChoco.id, quantity: 5, price_at_purchase_cents: 600 }
    ]);

    // 4. Run Financial Analytics Audit
    analytics = harness.analyticsService.computeAnalytics(
      harness.orderService.listOrders(),
      harness.orderService.getAllOrderItems(),
      harness.productService.listProducts()
    );

    // Total Revenue must include Order 1 ($50) + Order 2 ($70) = $120.00 CAD (Order 3 excluded)
    assert.equal(analytics.totalRevenueCents, 12000);
    assert.equal(harness.analyticsService.formatCurrencyCAD(analytics.totalRevenueCents), '$120.00 CAD');

    // Total Orders count = 2
    assert.equal(analytics.totalOrders, 2);

    // AOV = $120.00 / 2 = $60.00 CAD (6000 cents)
    assert.equal(analytics.averageOrderValueCents, 6000);
    assert.equal(harness.analyticsService.formatCurrencyCAD(analytics.averageOrderValueCents), '$60.00 CAD');

    // Top-selling items:
    // Vanille: 10 (order 1) + 5 (order 2) = 15 units sold
    // Choco: 5 (order 2) = 5 units sold (order 3 was cancelled, so excluded)
    assert.equal(analytics.topProducts[0].id, pVanilla.id);
    assert.equal(analytics.topProducts[0].unitsSold, 15);
    assert.equal(analytics.topProducts[1].id, pChoco.id);
    assert.equal(analytics.topProducts[1].unitsSold, 5);
  });

  // =========================================================================
  // Scenario 4: Product Deletion Safety on Ordered Item
  // =========================================================================
  it('Scenario 4: Product Deletion Safety on Ordered Item', () => {
    // Context: An admin attempts to delete a discontinued product ("Tartelette Prune Ancienne")
    // which has existing customer purchase history.
    // The system intercepts PostgreSQL foreign key violation 23503,
    // prompts the admin, and safely performs soft-deactivation (is_active = false).

    // 1. Create product
    const discontinuedProduct = harness.productService.createProduct({
      reference_code: 'T-PRU-01',
      name_fr: 'Tartelette Prune Ancienne',
      name_en: 'Heirloom Plum Tartlet',
      category: 'sweet',
      price: 5.50,
      stock: 12
    });

    // 2. An order is linked to this product
    const order = harness.orderService.createOrder({
      user_id: 'cust-123',
      stripe_session_id: 'cs_plum_order_88',
      customer_email: 'plum.lover@test.ca',
      customer_name: 'Plum Lover',
      amount_total_cents: 1100,
      status: 'paid'
    }, [
      {
        product_id: discontinuedProduct.id,
        quantity: 2,
        price_at_purchase_cents: 550,
        product: discontinuedProduct
      }
    ]);

    // 3. Admin clicks "Delete Product" in UI table
    const deleteResult = harness.productService.deleteProduct(
      discontinuedProduct.id,
      harness.orderService.getAllOrderItems()
    );

    // 4. Verify FK constraint caught: hard-delete aborted, soft-deactivation applied
    assert.equal(deleteResult.deleted, false);
    assert.equal(deleteResult.deactivated, true);
    assert.ok(deleteResult.reason?.includes('FK_VIOLATION_23503'));

    // 5. Verify product state in database: is_active is now false
    const productRecord = harness.productService.getProduct(discontinuedProduct.id);
    assert.ok(productRecord);
    assert.equal(productRecord?.is_active, false);

    // 6. Verify public store catalog excludes the deactivated item
    const publicActiveCatalog = harness.productService.listProducts({ activeStatus: 'active' });
    assert.ok(!publicActiveCatalog.some(p => p.id === discontinuedProduct.id));

    // 7. Verify past order cart items still render historical item details without breaking
    const pastOrderDetails = harness.orderService.getOrderWithDetails(order.id, harness.productService);
    assert.equal(pastOrderDetails.items[0].product?.name_fr, 'Tartelette Prune Ancienne');
    assert.equal(pastOrderDetails.items[0].price_at_purchase_cents, 550);
  });

  // =========================================================================
  // Scenario 5: Unauthorized Intrusion Attempt & Hard Refresh
  // =========================================================================
  it('Scenario 5: Unauthorized Intrusion Attempt & Hard Refresh', () => {
    // Context: Security intrusion probe and SSR hydration validation.
    // 1. Public visitor attempts direct URL access to /admin/products.
    // 2. Customer attempts unauthorized elevation.
    // 3. Admin successfully logs in, views analytics, and performs hard refresh (Ctrl+F5)
    //    confirming 0 SSR hydration errors.

    // Step 1: Unauthenticated request to /admin/products
    const unauthenticatedAttempt = evaluateRouteGuard('/admin/products', {});
    assert.equal(unauthenticatedAttempt.allowed, false);
    assert.equal(unauthenticatedAttempt.redirectUrl, '/admin/login');
    assert.equal(unauthenticatedAttempt.statusCode, 302);

    // Step 2: Customer user token attempts /admin/orders
    const customerToken = createMockJwt({ email: 'hacker@malicious.com', role: 'customer' });
    const customerAttempt = evaluateRouteGuard('/admin/orders', { 'sb-test-auth-token': customerToken }, false);
    assert.equal(customerAttempt.allowed, false);
    assert.equal(customerAttempt.redirectUrl, '/');

    // Step 3: Admin authenticates
    const adminToken = createMockJwt({ email: 'sirfoidoo@gmail.com', role: 'admin' });
    const adminSession = { 'sb-test-auth-token': adminToken };
    const adminAccess = evaluateRouteGuard('/admin', adminSession);
    assert.equal(adminAccess.allowed, true);

    // Step 4: Hard browser refresh (Ctrl+F5) on Sales Analytics page
    // Validate SSR component safety: <ClientOnly> wrapper and skeleton loader present
    const chartSSRCheck = SSRHydrationSafetyChecker.verifyChartSSRConfig({
      isClientOnlyWrapperUsed: true,
      hasFallbackSkeleton: true,
      directWindowAccessInSetup: false
    });

    assert.equal(chartSSRCheck.ssrSafe, true);
    assert.equal(chartSSRCheck.violations.length, 0);

    // Step 5: Admin performs logout
    delete adminSession['sb-test-auth-token'];
    const postLogoutAccess = evaluateRouteGuard('/admin', adminSession);
    assert.equal(postLogoutAccess.allowed, false);
    assert.equal(postLogoutAccess.redirectUrl, '/admin/login');
  });
});
