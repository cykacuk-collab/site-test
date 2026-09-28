/**
 * Tier 5 White-Box Adversarial Gap Analysis Test Suite
 * 
 * Empirically challenges and tests the 9 core admin dashboard components:
 * 1. app/layouts/admin.vue
 * 2. app/pages/admin/index.vue
 * 3. app/pages/admin/products.vue
 * 4. app/pages/admin/orders.vue
 * 5. app/components/admin/SalesChart.client.vue
 * 6. server/api/admin/orders/index.get.ts
 * 7. server/api/admin/orders/[id].patch.ts
 * 8. server/api/admin/analytics.get.ts
 * 9. server/middleware/adminGuard.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to read file content
function getFile(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

describe('Tier 5 Adversarial Gap Analysis & White-Box Verification', () => {

  // =========================================================================
  // 1. server/middleware/adminGuard.ts Analysis
  // =========================================================================
  describe('1. server/middleware/adminGuard.ts Vulnerabilities & Edge Cases', () => {
    const adminGuardCode = getFile('server/middleware/adminGuard.ts');

    it('GAP-01: adminGuard fails to verify cryptographic JWT signature (Forged Token Vulnerability)', () => {
      // The guard extracts token and decodes payload without secret verification
      assert.ok(
        adminGuardCode.includes("token.split('.')[1]"),
        'Guard splits token by dot'
      );
      assert.ok(
        adminGuardCode.includes("Buffer.from(payloadBase64, 'base64')"),
        'Guard parses base64 payload directly'
      );
      assert.ok(
        !adminGuardCode.includes('verify') && !adminGuardCode.includes('jwtSecret') && !adminGuardCode.includes('serverSupabaseUser'),
        'CRITICAL: adminGuard does NOT cryptographically verify token signature'
      );

      // Empirical proof: create a forged JWT with fake signature
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ app_metadata: { role: 'admin' } })).toString('base64url');
      const forgedJwt = `${header}.${payload}.fake_signature_attacker`;

      // Simulate the exact parsing logic in adminGuard.ts:
      const payloadBase64 = forgedJwt.split('.')[1];
      const parsed = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

      assert.equal(parsed.app_metadata?.role, 'admin');
      // Proof that an attacker can forge any payload and pass role === 'admin'
    });

    it('GAP-02: adminGuard fails to check expiration (exp claim) on admin tokens', () => {
      assert.ok(
        !adminGuardCode.includes('payload.exp') && !adminGuardCode.includes('Date.now()'),
        'adminGuard lacks token expiration check (expired tokens can access SSR admin routes)'
      );

      // Comparison: orders/index.get.ts does check exp:
      const ordersGetCode = getFile('server/api/admin/orders/index.get.ts');
      assert.ok(ordersGetCode.includes('payload.exp < Math.floor(Date.now() / 1000)'));
    });

    it('GAP-03: adminGuard fails on Supabase SSR chunked cookies (-auth-token.0, -auth-token.1)', () => {
      // Line 19: Object.keys(cookies).find(c => c.endsWith('-auth-token'))
      const chunkedCookies = {
        'sb-project-auth-token.0': 'part1...',
        'sb-project-auth-token.1': 'part2...'
      };
      const found = Object.keys(chunkedCookies).find(c => c.endsWith('-auth-token'));
      assert.equal(found, undefined, 'Cookie lookup fails when tokens are chunked by @supabase/ssr');
    });

    it('GAP-04: adminGuard returns 401 for /api/ routes, but 302 for page routes (Discrepancy with opaque harness)', () => {
      assert.ok(
        adminGuardCode.includes("if (pathname.startsWith('/api/'))"),
        'Guard has separate branch for /api/ endpoints'
      );
      assert.ok(
        adminGuardCode.includes("throw createError({ statusCode: 401"),
        'Guard throws 401 for API endpoints'
      );
      assert.ok(
        adminGuardCode.includes("return sendRedirect(event, '/admin/login', 302)"),
        'Guard returns 302 for non-API page routes'
      );
    });
  });

  // =========================================================================
  // 2. server/api/admin/orders/[id].patch.ts Analysis
  // =========================================================================
  describe('2. server/api/admin/orders/[id].patch.ts Boundary & Schema Gaps', () => {
    const patchCode = getFile('server/api/admin/orders/[id].patch.ts');
    const schemaCode = getFile('supabase_schema.sql');

    it('GAP-05: Status Mismatch between PATCH endpoint and supabase_schema.sql check constraint', () => {
      const allowedPatchStatuses = [
        'paid',
        'processing',
        'shipped',
        'delivered',
        'fulfilled',
        'cancelled'
      ];

      for (const st of allowedPatchStatuses) {
        assert.ok(patchCode.includes(`'${st}'`), `PATCH code must allow ${st}`);
      }

      // Check what supabase_schema.sql permits:
      // status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'fulfilled', 'cancelled'))
      const schemaMatch = schemaCode.match(/status IN \(([^)]+)\)/);
      assert.ok(schemaMatch, 'Found status check constraint in supabase_schema.sql');
      const schemaStatuses = schemaMatch[1];

      const disallowedBySchema = ['processing', 'shipped', 'delivered'];
      for (const st of disallowedBySchema) {
        assert.ok(
          !schemaStatuses.includes(`'${st}'`),
          `CRITICAL: Status '${st}' allowed in PATCH API is REJECTED by supabase_schema.sql check constraint!`
        );
      }
    });

    it('GAP-06: Non-UUID router param results in 500 DB error instead of 400 Bad Request', () => {
      // In [id].patch.ts:
      // const id = getRouterParam(event, 'id')
      // If id is 'abc' or 'not-a-uuid', it is passed directly to Supabase .eq('id', id)
      // Postgres error code 22P02 is NOT handled as 400, but falls through to 500:
      assert.ok(!patchCode.includes('22P02'), 'Missing handling for Postgres error 22P02 (invalid UUID)');
      assert.ok(patchCode.includes("statusMessage: `Database update error: ${error.message}`"));
    });
  });

  // =========================================================================
  // 3. server/api/admin/orders/index.get.ts Analysis
  // =========================================================================
  describe('3. server/api/admin/orders/index.get.ts Missing Columns & Fallbacks', () => {
    const indexGetCode = getFile('server/api/admin/orders/index.get.ts');

    it('GAP-07: shipping_address is mapped in response object but omitted from Supabase SELECT query', () => {
      // In index.get.ts:
      // Line 92: shipping_address: order.shipping_address || null
      assert.ok(
        indexGetCode.includes('shipping_address: order.shipping_address || null'),
        'Response normalizer includes shipping_address'
      );

      // In line 49-74 select query:
      const selectQuery = indexGetCode.substring(
        indexGetCode.indexOf('.select(`'),
        indexGetCode.indexOf('.order(')
      );
      assert.ok(
        !selectQuery.includes('shipping_address'),
        'SELECT query omits shipping_address; order.shipping_address is always null/undefined'
      );
    });

    it('Correctly falls back to archived product placeholder when joined product is null', () => {
      assert.ok(indexGetCode.includes("name_fr: 'Produit retiré'"));
      assert.ok(indexGetCode.includes("name_en: 'Archived Product'"));
    });
  });

  // =========================================================================
  // 4. server/api/admin/analytics.get.ts Analysis
  // =========================================================================
  describe('4. server/api/admin/analytics.get.ts Mathematical & Data Edge Cases', () => {
    const analyticsCode = getFile('server/api/admin/analytics.get.ts');

    it('Guards against zero-division for AOV when totalOrders is 0', () => {
      assert.ok(
        analyticsCode.includes('totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0'),
        'AOV computation contains zero-division guard'
      );
    });

    it('Strictly isolates revenue by whitelisting paid/completed statuses', () => {
      assert.ok(
        analyticsCode.includes("new Set(['paid', 'processing', 'shipped', 'delivered', 'fulfilled'])"),
        'Revenue calculation whitelists valid statuses'
      );
      // Cancelled, expired, pending are excluded
    });

    it('GAP-08: Order items with null product_id produce null keys in leaderboard map', () => {
      const items = [{ order_id: 'o1', product_id: null, quantity: 2, price_at_purchase_cents: 500 }];
      const validOrders = new Set(['o1']);
      const validItems = items.filter(item => validOrders.has(item.order_id));

      const productStats = new Map<any, any>();
      for (const item of validItems) {
        const current = productStats.get(item.product_id) || { unitsSold: 0, revenueCents: 0 };
        current.unitsSold += item.quantity || 0;
        current.revenueCents += (item.quantity || 0) * (item.price_at_purchase_cents || 0);
        productStats.set(item.product_id, current);
      }

      assert.ok(productStats.has(null), 'Null product_id enters the leaderboard without sanitization');
    });
  });

  // =========================================================================
  // 5. app/pages/admin/products.vue Analysis
  // =========================================================================
  describe('5. app/pages/admin/products.vue Stock & Form Validation Gaps', () => {
    const productsVueCode = getFile('app/pages/admin/products.vue');

    it('GAP-09: products.vue performs direct client-side mutations bypassing server role', () => {
      assert.ok(
        productsVueCode.includes(".from('products')") && productsVueCode.includes(".insert(payload)"),
        'products.vue inserts directly via client supabase'
      );
      assert.ok(
        productsVueCode.includes(".from('products')") && productsVueCode.includes(".update("),
        'products.vue updates directly via client supabase'
      );
      assert.ok(
        productsVueCode.includes(".from('products')") && productsVueCode.includes(".delete()"),
        'products.vue deletes directly via client supabase'
      );
    });

    it('GAP-10: Quick stock adjust has race condition (client-calculated newStock vs atomic increment)', () => {
      // Line 985: const newStock = Math.max(0, currentStock + delta)
      // Line 994: stock: newStock
      assert.ok(
        productsVueCode.includes('Math.max(0, currentStock + delta)'),
        'Stock adjustment calculates new value on client rather than using DB atomic RPC'
      );
    });

    it('GAP-11: Form validation lacks string length constraint (> 150 chars) expected by domain contract', () => {
      // harness.ts checks input.name_fr.trim().length > 150
      assert.ok(
        !productsVueCode.includes('length > 150') && !productsVueCode.includes('.length > 150'),
        'products.vue form submission lacks max length check for product names'
      );
    });

    it('Handles Foreign Key 23503 and switches to soft deactivation', () => {
      assert.ok(
        productsVueCode.includes("error.code === '23503'"),
        'Catches Postgres error 23503'
      );
      assert.ok(
        productsVueCode.includes('deleteFkConflict'),
        'Sets deleteFkConflict state flag'
      );
      assert.ok(
        productsVueCode.includes('deactivateConflictedProduct'),
        'Provides soft deactivation fallback'
      );
    });
  });

  // =========================================================================
  // 6. app/pages/admin/orders.vue Analysis
  // =========================================================================
  describe('6. app/pages/admin/orders.vue Resilience & Edge Cases', () => {
    const ordersVueCode = getFile('app/pages/admin/orders.vue');

    it('Uses secure server PATCH endpoint avoiding client RLS 42501', () => {
      assert.ok(
        ordersVueCode.includes("$fetch(`/api/admin/orders/${orderId}`, {"),
        'Orders updates route through /api/admin/orders/[id] Nitro endpoint'
      );
      assert.ok(
        !ordersVueCode.includes("supabase.from('orders').update"),
        'Does not mutate orders directly from client'
      );
    });

    it('Implements optimistic update with rollback on server failure', () => {
      assert.ok(
        ordersVueCode.includes('const prevStatus = order.status'),
        'Saves prevStatus before update'
      );
      assert.ok(
        ordersVueCode.includes('order.status = prevStatus'),
        'Rolls back status on catch'
      );
    });

    it('Handles null customer_name with "Client invité" fallback', () => {
      assert.ok(
        ordersVueCode.includes('Client invité'),
        'Customer name has fallback to guest label'
      );
    });
  });

  // =========================================================================
  // 7. app/components/admin/SalesChart.client.vue & SSR Safety
  // =========================================================================
  describe('7. SalesChart.client.vue & SSR Safety', () => {
    const chartCode = getFile('app/components/admin/SalesChart.client.vue');
    const indexVueCode = getFile('app/pages/admin/index.vue');

    it('SalesChart.client.vue has .client suffix and is wrapped in <ClientOnly>', () => {
      assert.ok(
        indexVueCode.includes('<ClientOnly>'),
        'Chart is encapsulated in <ClientOnly>'
      );
      assert.ok(
        indexVueCode.includes('<template #fallback>'),
        '<ClientOnly> provides skeleton loader fallback'
      );
    });

    it('Zero-state check avoids rendering ChartJS when revenueByDay is empty', () => {
      assert.ok(
        chartCode.includes('v-if="!hasData"'),
        'Checks !hasData before mounting chart'
      );
      assert.ok(
        chartCode.includes('<Line :data="chartData" :options="chartOptions" />'),
        'Mounts Line chart in v-else branch'
      );
    });
  });

  // =========================================================================
  // 8. app/layouts/admin.vue Navigation Boundary Analysis
  // =========================================================================
  describe('8. app/layouts/admin.vue Tab Matching Boundary Cases', () => {
    const layoutCode = getFile('app/layouts/admin.vue');

    it('GAP-12: Tab active checks use startsWith which can overmatch subroutes', () => {
      assert.ok(
        layoutCode.includes("route.path.startsWith('/admin/products')"),
        'Products tab uses startsWith'
      );
      assert.ok(
        layoutCode.includes("route.path.startsWith('/admin/orders')"),
        'Orders tab uses startsWith'
      );
      // Example: a hypothetical route /admin/products-archive matches /admin/products
    });

    it('Provides desktop and mobile navigation links and logout handling', () => {
      assert.ok(layoutCode.includes('handleLogout'));
      assert.ok(layoutCode.includes('isMobileMenuOpen'));
      assert.ok(layoutCode.includes('useSupabaseUser'));
    });
  });
});
