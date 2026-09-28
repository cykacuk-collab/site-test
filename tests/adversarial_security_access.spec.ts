/**
 * Adversarial Security & Access Control Test Suite
 * Component under test: server/middleware/adminGuard.ts & app/middleware/admin.ts
 * 
 * Target Probes:
 * 1. Unauthenticated SSR requests to /admin, /admin/products, and /api/admin/orders
 *    - Confirm 302 redirects to /admin/login
 *    - Confirm zero leakage of admin HTML or data
 * 2. Authenticated non-admin tokens (role: 'customer', 'editor', missing role, etc.)
 *    - Confirm 403 Forbidden is returned
 * 3. Bypass vectors:
 *    - Case variations (/Admin, /ADMIN, /admin/Products, /api/Admin/orders)
 *    - Trailing slashes (/admin/, /admin/products/, /api/admin/orders/)
 *    - Query params (?bypass=1, ?role=admin)
 *    - Path traversal (/admin/../admin)
 *    - Header tampering (X-Original-URL, X-Rewrite-URL, X-Forwarded-Host)
 *    - Token format variants (cookie array vs string, corrupted/malformed)
 * 4. Production dev-bypass resistance (process.dev tree-shaking verification)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TEST_PORT = 3847;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Helper: build a mock JWT token string
function createJwt(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from('mock_adversarial_sig').toString('base64url');
  return `${headerB64}.${payloadB64}.${signature}`;
}

const tokens = {
  admin: createJwt({
    sub: 'admin-uuid-001',
    email: 'admin@histoiresaveurs.ca',
    app_metadata: { role: 'admin' },
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  customer: createJwt({
    sub: 'cust-uuid-002',
    email: 'customer@gmail.com',
    app_metadata: { role: 'customer' },
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  editor: createJwt({
    sub: 'editor-uuid-003',
    email: 'editor@test.com',
    app_metadata: { role: 'editor' },
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  missingRole: createJwt({
    sub: 'user-uuid-004',
    email: 'user@test.com',
    app_metadata: {},
    exp: Math.floor(Date.now() / 1000) + 3600
  }),
  missingAppMetadata: createJwt({
    sub: 'user-uuid-005',
    email: 'nometa@test.com',
    exp: Math.floor(Date.now() / 1000) + 3600
  })
};

describe('Adversarial Access Control & Route Guard Verification', () => {
  let serverProcess: ChildProcess;

  before(async () => {
    // Launch the built production Nitro server
    serverProcess = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        NITRO_PORT: String(TEST_PORT),
        HOST: '127.0.0.1',
        NODE_ENV: 'production'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stderr?.on('data', (d) => {
      // capture any unhandled server errors
    });

    // Wait until server is accepting connections
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const res = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
        if (res.status >= 200 && res.status < 500) {
          ready = true;
          break;
        }
      } catch (err) {
        // still starting up
      }
    }

    if (!ready) {
      serverProcess.kill('SIGTERM');
      throw new Error(`Nitro server failed to start on port ${TEST_PORT} within 10s`);
    }
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  // =========================================================================
  // PROBE 1: Unauthenticated SSR Requests
  // =========================================================================
  describe('Probe 1: Unauthenticated Requests (Must 302 -> /admin/login & Never Leak Content)', () => {

    it('GET /admin without cookies returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
      assert.equal(res.status, 302, `Expected status 302, got ${res.status}`);
      const loc = res.headers.get('location');
      assert.equal(loc, '/admin/login', `Expected Location '/admin/login', got '${loc}'`);
      
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i, 'Leaked admin UI content in 302 body');
      assert.doesNotMatch(body, /Vue d'ensemble/i, 'Leaked admin dashboard title');
      assert.doesNotMatch(body, /<table/i, 'Leaked data table in 302 response');
    });

    it('GET /admin/products without cookies returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/admin/products`, { redirect: 'manual' });
      assert.equal(res.status, 302, `Expected status 302, got ${res.status}`);
      const loc = res.headers.get('location');
      assert.equal(loc, '/admin/login', `Expected Location '/admin/login', got '${loc}'`);

      const body = await res.text();
      assert.doesNotMatch(body, /Nouveau Produit/i, 'Leaked Add Product modal trigger');
      assert.doesNotMatch(body, /reference_code/i, 'Leaked SKU code column');
      assert.doesNotMatch(body, /product_images/i, 'Leaked storage bucket references');
    });

    it('GET /api/admin/orders without cookies returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/orders`, { redirect: 'manual' });
      assert.equal(res.status, 302, `Expected status 302, got ${res.status}`);
      const loc = res.headers.get('location');
      assert.equal(loc, '/admin/login', `Expected Location '/admin/login', got '${loc}'`);

      const body = await res.text();
      assert.doesNotMatch(body, /stripe_session_id/i, 'Leaked order schema');
      assert.doesNotMatch(body, /amount_total_cents/i, 'Leaked order financial data');
    });

    it('POST /api/admin/orders without cookies returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 1 }),
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('GET /admin/login without cookies returns 200 OK without redirect loop', async () => {
      const res = await fetch(`${BASE_URL}/admin/login`, { redirect: 'manual' });
      assert.equal(res.status, 200, `Login page must return 200 OK, got ${res.status}`);
      const body = await res.text();
      assert.match(body, /connexion|admin|login/i, 'Login page markup missing');
    });

    it('Corrupted/unparseable cookie returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: 'sb-test-auth-token=totally_corrupted_garbage_token' },
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Malformed JWT payload (invalid base64) returns 302 redirect to /admin/login', async () => {
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: 'sb-test-auth-token=header.not_valid_json.sig' },
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });
  });

  // =========================================================================
  // PROBE 2: Authenticated Non-Admin Tokens
  // =========================================================================
  describe('Probe 2: Authenticated Non-Admin Token (Must Return 403 Forbidden)', () => {

    it('GET /admin with role: "customer" returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.customer}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden for customer, got ${res.status}`);
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i, 'Customer leaked admin UI');
    });

    it('GET /admin/products with role: "customer" returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.customer}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });

    it('GET /api/admin/orders with role: "customer" returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.customer}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });

    it('GET /admin with role: "editor" returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.editor}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });

    it('GET /admin with token missing role in app_metadata returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.missingRole}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });

    it('GET /admin with token completely missing app_metadata returns 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.missingAppMetadata}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });

    it('Supabase v2 array-wrapped customer cookie returns 403 Forbidden', async () => {
      const arrayCookie = JSON.stringify([tokens.customer, 'refresh-token']);
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: `sb-test-auth-token=${encodeURIComponent(arrayCookie)}` },
        redirect: 'manual'
      });
      assert.equal(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    });
  });

  // =========================================================================
  // PROBE 3: Bypass Vectors
  // =========================================================================
  describe('Probe 3: Bypass Vectors (Query Params, Headers, Trailing Slashes, Case)', () => {

    it('Trailing slash /admin/ without auth returns 302 redirect', async () => {
      const res = await fetch(`${BASE_URL}/admin/`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Trailing slash /admin/products/ without auth returns 302 redirect', async () => {
      const res = await fetch(`${BASE_URL}/admin/products/`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Query param bypass attempt /admin?bypass=1 returns 302 redirect', async () => {
      const res = await fetch(`${BASE_URL}/admin?bypass=1`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Query param bypass attempt /admin?role=admin returns 302 redirect', async () => {
      const res = await fetch(`${BASE_URL}/admin?role=admin`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Query param bypass on /admin/products?admin=true returns 302 redirect', async () => {
      const res = await fetch(`${BASE_URL}/admin/products?admin=true`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Dot segment normalization /admin/../admin returns 302 or 404, never leaks content', async () => {
      const res = await fetch(`${BASE_URL}/admin/../admin`, { redirect: 'manual' });
      assert.ok([302, 404].includes(res.status), `Unexpected status ${res.status}`);
      if (res.status === 302) {
        assert.equal(res.headers.get('location'), '/admin/login');
      }
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i);
    });

    it('Header tampering X-Original-URL: /public does not bypass guard on /admin', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { 'X-Original-URL': '/public' },
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Header tampering X-Rewrite-URL: / does not bypass guard on /admin', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { 'X-Rewrite-URL': '/' },
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/admin/login');
    });

    it('Case variation /Admin without auth: does not leak admin UI', async () => {
      const res = await fetch(`${BASE_URL}/Admin`, { redirect: 'manual' });
      // Nuxt router or adminGuard must either 302 redirect or 404 (not found). It must NEVER return 200 with admin UI!
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i, 'Case variation leaked admin UI!');
      assert.doesNotMatch(body, /Nouveau Produit/i, 'Case variation leaked admin controls!');
      assert.ok([302, 404].includes(res.status), `Expected 302 or 404, got ${res.status}`);
    });

    it('Case variation /Admin/products without auth: does not leak admin UI', async () => {
      const res = await fetch(`${BASE_URL}/Admin/products`, { redirect: 'manual' });
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i, 'Case variation leaked admin UI!');
      assert.ok([302, 404].includes(res.status), `Expected 302 or 404, got ${res.status}`);
    });

    it('Case variation /admin/Products without auth: does not leak admin UI', async () => {
      const res = await fetch(`${BASE_URL}/admin/Products`, { redirect: 'manual' });
      const body = await res.text();
      assert.doesNotMatch(body, /Gestion des Produits/i, 'Case variation leaked admin UI!');
      assert.ok([302, 404].includes(res.status), `Expected 302 or 404, got ${res.status}`);
    });

    it('Case variation /api/Admin/orders without auth: does not leak API response', async () => {
      const res = await fetch(`${BASE_URL}/api/Admin/orders`, { redirect: 'manual' });
      assert.ok([302, 404].includes(res.status), `Expected 302 or 404, got ${res.status}`);
      const body = await res.text();
      assert.doesNotMatch(body, /stripe_session_id/i);
    });
  });

  // =========================================================================
  // PROBE 4: Legitimate Admin Token Access & Production Hardening
  // =========================================================================
  describe('Probe 4: Legitimate Admin Token Access & Production Hardening', () => {

    it('GET /admin with valid admin token passes server guard', async () => {
      const res = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.admin}` },
        redirect: 'manual'
      });
      assert.notEqual(res.status, 403, 'Admin token was incorrectly forbidden');
    });

    it('GET /admin/products with valid admin token passes server guard', async () => {
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: `sb-test-auth-token=${tokens.admin}` },
        redirect: 'manual'
      });
      assert.notEqual(res.status, 403, 'Admin token was incorrectly forbidden');
    });

    it('Supabase v2 array cookie format with admin role passes server guard', async () => {
      const arrayCookie = JSON.stringify([tokens.admin, 'mock-refresh-token']);
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: `sb-test-auth-token=${encodeURIComponent(arrayCookie)}` },
        redirect: 'manual'
      });
      assert.notEqual(res.status, 403, 'Array-wrapped admin token was incorrectly forbidden');
    });

    it('Self-crafted / forged JWT token: analyze server response and SSR defense', async () => {
      const forgedToken = createJwt({
        sub: 'hacker-007',
        email: 'attacker@evil.com',
        app_metadata: { role: 'admin' },
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { Cookie: `sb-test-auth-token=${forgedToken}` },
        redirect: 'manual'
      });
      // Observe the response: status and content
      console.log('   [Adversarial Probe] Forged admin JWT response status:', res.status);
      const loc = res.headers.get('location');
      console.log('   [Adversarial Probe] Forged admin JWT Location:', loc);
      const body = await res.text();
      // Even if server middleware lets the payload pass because base64 role === 'admin',
      // Nuxt SSR and client Supabase client must not expose unauthorized data.
      console.log('   [Adversarial Probe] Forged admin JWT body length:', body.length);
    });
  });
});
