/**
 * Opaque-Box Admin Dashboard Test Harness & Contract Engine
 * 
 * Provides an authoritative test driver and contract validator
 * based on ORIGINAL_REQUEST.md, PROJECT.md, and TEST_INFRA.md.
 */

import crypto from 'node:crypto';

export interface ProductRecord {
  id: string;
  reference_code: string | null;
  name_fr: string;
  name_en: string;
  description_fr: string | null;
  description_en: string | null;
  price_cents: number;
  stock: number;
  category: 'sweet' | 'savory';
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'fulfilled'
  | 'cancelled'
  | 'expired';

export const VALID_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'fulfilled',
  'cancelled',
  'expired'
];

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase_cents: number;
  product?: Partial<ProductRecord>;
}

export interface OrderRecord {
  id: string;
  user_id: string | null;
  stripe_session_id: string;
  customer_email: string;
  customer_name: string | null;
  shipping_address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  } | null;
  amount_total_cents: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRecord[];
}

export interface AnalyticsData {
  totalRevenueCents: number;
  totalOrders: number;
  averageOrderValueCents: number;
  activeProductsCount: number;
  topProducts: Array<{
    id: string;
    name_fr: string;
    name_en?: string;
    unitsSold: number;
    revenueCents: number;
    image_url: string | null;
  }>;
  revenueByDay: Array<{
    date: string;
    revenueCents: number;
  }>;
}

// -------------------------------------------------------------
// Auth & JWT Utilities
// -------------------------------------------------------------
export function createMockJwt(options: {
  email?: string;
  role?: string;
  exp?: number;
  sub?: string;
  malformed?: boolean;
}): string {
  if (options.malformed) {
    return 'corrupted.jwt-token.without-valid-base64!';
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: options.sub || crypto.randomUUID(),
    email: options.email || 'sirfoidoo@gmail.com',
    app_metadata: options.role ? { role: options.role } : {},
    user_metadata: {},
    iat: Math.floor(Date.now() / 1000),
    exp: options.exp ?? Math.floor(Date.now() / 1000) + 3600
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.randomBytes(32).toString('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export interface RouteGuardResult {
  allowed: boolean;
  statusCode: number;
  redirectUrl?: string;
  errorMessage?: string;
}

export function evaluateRouteGuard(
  urlPath: string,
  cookies: Record<string, string>,
  isDev = false
): RouteGuardResult {
  // Public admin route
  if (urlPath === '/admin/login' || !urlPath.startsWith('/admin')) {
    return { allowed: true, statusCode: 200 };
  }

  const authCookieName = Object.keys(cookies).find(c => c.endsWith('-auth-token'));
  if (!authCookieName) {
    return {
      allowed: false,
      statusCode: 302,
      redirectUrl: '/admin/login',
      errorMessage: 'Unauthenticated: redirected to /admin/login'
    };
  }

  const cookieVal = cookies[authCookieName];
  let token = cookieVal;
  try {
    if (cookieVal.startsWith('[')) {
      token = JSON.parse(cookieVal)[0];
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { allowed: false, statusCode: 403, errorMessage: 'Forbidden: malformed token' };
    }
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        allowed: false,
        statusCode: 302,
        redirectUrl: '/admin/login',
        errorMessage: 'Session expired: redirected to /admin/login'
      };
    }

    const isAdmin = payload.app_metadata?.role === 'admin';
    if (!isAdmin) {
      if (isDev) {
        return { allowed: true, statusCode: 200 };
      }
      return {
        allowed: false,
        statusCode: 302,
        redirectUrl: '/',
        errorMessage: 'Non-admin user: redirected to home /'
      };
    }

    return { allowed: true, statusCode: 200 };
  } catch (err: any) {
    return { allowed: false, statusCode: 403, errorMessage: `Forbidden: ${err.message}` };
  }
}

// -------------------------------------------------------------
// Product Management Domain Engine
// -------------------------------------------------------------
export interface ProductInput {
  reference_code?: string | null;
  name_fr: string;
  name_en: string;
  category: 'sweet' | 'savory';
  price: number; // in dollars
  stock: number;
  description_fr?: string | null;
  description_en?: string | null;
  image_url?: string | null;
}

export class ProductManagementService {
  private products: Map<string, ProductRecord> = new Map();
  private storageBucket: Map<string, Buffer | string> = new Map();

  constructor(initialProducts: ProductRecord[] = []) {
    for (const p of initialProducts) {
      this.products.set(p.id, { ...p });
    }
  }

  public validateImageFile(file: { name: string; type: string; size: number }): {
    valid: boolean;
    error?: string;
    storagePath?: string;
  } {
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_MIME.includes(file.type)) {
      return {
        valid: false,
        error: `Format invalide (${file.type}). Formats acceptés : JPEG, PNG, WebP, GIF.`
      };
    }

    if (file.size > MAX_SIZE_BYTES) {
      return {
        valid: false,
        error: 'Fichier trop volumineux. La taille maximale permise est de 5 Mo.'
      };
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `tart-shells/${filename}`;

    return { valid: true, storagePath };
  }

  public uploadImage(storagePath: string, content: Buffer | string): string {
    this.storageBucket.set(storagePath, content);
    return `https://nzrooalbzeparcklxitz.supabase.co/storage/v1/object/public/product_images/${storagePath}`;
  }

  public deleteImage(imageUrl: string): boolean {
    const match = imageUrl.split('product_images/')[1];
    if (match && this.storageBucket.has(match)) {
      this.storageBucket.delete(match);
      return true;
    }
    return false;
  }

  public validateInput(input: ProductInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.name_fr || !input.name_fr.trim()) {
      errors.push('Le nom en français (name_fr) est obligatoire.');
    } else if (input.name_fr.trim().length > 150) {
      errors.push('Le nom en français ne doit pas dépasser 150 caractères.');
    }

    if (!input.name_en || !input.name_en.trim()) {
      errors.push('Le nom en anglais (name_en) est obligatoire.');
    } else if (input.name_en.trim().length > 150) {
      errors.push('Le nom en anglais ne doit pas dépasser 150 caractères.');
    }

    if (!['sweet', 'savory'].includes(input.category)) {
      errors.push(`Catégorie invalide: "${input.category}". Choix valides: 'sweet' ou 'savory'.`);
    }

    if (typeof input.price !== 'number' || isNaN(input.price) || input.price < 0) {
      errors.push('Le prix doit être un nombre positif ou nul.');
    }

    if (typeof input.stock !== 'number' || isNaN(input.stock) || !Number.isInteger(input.stock) || input.stock < 0) {
      errors.push('Le stock doit être un entier positif ou nul.');
    }

    if (input.reference_code && input.reference_code.length > 50) {
      errors.push('Le code SKU B2B ne doit pas dépasser 50 caractères.');
    }

    return { valid: errors.length === 0, errors };
  }

  public createProduct(input: ProductInput): ProductRecord {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Validation Error: ${validation.errors.join('; ')}`);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const product: ProductRecord = {
      id,
      reference_code: input.reference_code?.trim() || null,
      name_fr: input.name_fr.trim(),
      name_en: input.name_en.trim(),
      description_fr: input.description_fr?.trim() || '',
      description_en: input.description_en?.trim() || '',
      price_cents: Math.round(input.price * 100),
      stock: input.stock,
      category: input.category,
      image_url: input.image_url || null,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    this.products.set(id, product);
    return { ...product };
  }

  public updateProduct(id: string, input: Partial<ProductInput>): ProductRecord {
    const existing = this.products.get(id);
    if (!existing) {
      throw new Error(`Produit non trouvé (ID: ${id})`);
    }

    const mergedInput: ProductInput = {
      reference_code: input.reference_code !== undefined ? input.reference_code : existing.reference_code,
      name_fr: input.name_fr !== undefined ? input.name_fr : existing.name_fr,
      name_en: input.name_en !== undefined ? input.name_en : existing.name_en,
      category: input.category !== undefined ? input.category : existing.category,
      price: input.price !== undefined ? input.price : existing.price_cents / 100,
      stock: input.stock !== undefined ? input.stock : existing.stock,
      description_fr: input.description_fr !== undefined ? input.description_fr : existing.description_fr,
      description_en: input.description_en !== undefined ? input.description_en : existing.description_en,
      image_url: input.image_url !== undefined ? input.image_url : existing.image_url
    };

    const validation = this.validateInput(mergedInput);
    if (!validation.valid) {
      throw new Error(`Validation Error: ${validation.errors.join('; ')}`);
    }

    const updated: ProductRecord = {
      ...existing,
      reference_code: mergedInput.reference_code?.trim() || null,
      name_fr: mergedInput.name_fr.trim(),
      name_en: mergedInput.name_en.trim(),
      description_fr: mergedInput.description_fr?.trim() || '',
      description_en: mergedInput.description_en?.trim() || '',
      price_cents: Math.round(mergedInput.price * 100),
      stock: mergedInput.stock,
      category: mergedInput.category,
      image_url: mergedInput.image_url || null,
      updated_at: new Date().toISOString()
    };

    this.products.set(id, updated);
    return { ...updated };
  }

  public quickAdjustStock(id: string, delta: number): ProductRecord {
    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Produit introuvable (${id})`);
    }

    const newStock = product.stock + delta;
    if (newStock < 0) {
      throw new Error(`Le stock ne peut pas être négatif (actuel: ${product.stock}, delta: ${delta})`);
    }

    product.stock = newStock;
    product.updated_at = new Date().toISOString();
    this.products.set(id, product);
    return { ...product };
  }

  public deleteProduct(id: string, orderItemsList: OrderItemRecord[] = []): {
    deleted: boolean;
    deactivated: boolean;
    reason?: string;
  } {
    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Produit introuvable (${id})`);
    }

    // Check PostgreSQL Foreign Key constraint (error 23503)
    const isReferencedInOrders = orderItemsList.some(item => item.product_id === id);
    if (isReferencedInOrders) {
      // Soft-deactivate instead of throwing unhandled 23503
      product.is_active = false;
      product.updated_at = new Date().toISOString();
      this.products.set(id, product);
      return {
        deleted: false,
        deactivated: true,
        reason: 'FK_VIOLATION_23503: Produit référencé dans des commandes existantes. Désactivé au lieu d’être supprimé.'
      };
    }

    // Safe hard-delete
    if (product.image_url) {
      this.deleteImage(product.image_url);
    }
    this.products.delete(id);
    return { deleted: true, deactivated: false };
  }

  public getProduct(id: string): ProductRecord | undefined {
    const p = this.products.get(id);
    return p ? { ...p } : undefined;
  }

  public listProducts(filters?: {
    search?: string;
    category?: 'all' | 'sweet' | 'savory';
    stockLevel?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    activeStatus?: 'all' | 'active' | 'inactive';
  }): ProductRecord[] {
    let list = Array.from(this.products.values());

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(p =>
        p.name_fr.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        (p.reference_code && p.reference_code.toLowerCase().includes(q))
      );
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter(p => p.category === filters.category);
    }

    if (filters?.stockLevel && filters.stockLevel !== 'all') {
      if (filters.stockLevel === 'out_of_stock') {
        list = list.filter(p => p.stock === 0);
      } else if (filters.stockLevel === 'low_stock') {
        list = list.filter(p => p.stock > 0 && p.stock <= 10);
      } else if (filters.stockLevel === 'in_stock') {
        list = list.filter(p => p.stock > 10);
      }
    }

    if (filters?.activeStatus && filters.activeStatus !== 'all') {
      const wantActive = filters.activeStatus === 'active';
      list = list.filter(p => p.is_active === wantActive);
    }

    // Sort descending by created_at
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

// -------------------------------------------------------------
// Order Fulfillment Domain Engine
// -------------------------------------------------------------
export class OrderFulfillmentService {
  private orders: Map<string, OrderRecord> = new Map();
  private orderItems: OrderItemRecord[] = [];

  constructor(initialOrders: OrderRecord[] = [], initialItems: OrderItemRecord[] = []) {
    for (const o of initialOrders) {
      this.orders.set(o.id, { ...o });
    }
    this.orderItems = [...initialItems];
  }

  public getAllOrderItems(): OrderItemRecord[] {
    return [...this.orderItems];
  }

  public createOrder(
    orderData: Omit<OrderRecord, 'id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<OrderItemRecord, 'id' | 'order_id'>>
  ): OrderRecord {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const order: OrderRecord = {
      ...orderData,
      id,
      created_at: now,
      updated_at: now
    };

    this.orders.set(id, order);

    for (const item of items) {
      this.orderItems.push({
        id: crypto.randomUUID(),
        order_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase_cents: item.price_at_purchase_cents,
        product: item.product
      });
    }

    return { ...order };
  }

  public listOrders(filters?: {
    status?: OrderStatus | 'all';
    search?: string;
  }): OrderRecord[] {
    let list = Array.from(this.orders.values());

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(o => o.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(o =>
        o.customer_email.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        o.stripe_session_id.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrderWithDetails(orderId: string, productService?: ProductManagementService): {
    order: OrderRecord;
    items: Array<OrderItemRecord & { line_total_cents: number }>;
    formattedTotal: string;
  } {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Commande introuvable (${orderId})`);
    }

    const items = this.orderItems
      .filter(item => item.order_id === orderId)
      .map(item => {
        let productDetails = item.product;
        if (productService) {
          const liveProduct = productService.getProduct(item.product_id);
          if (liveProduct) {
            productDetails = liveProduct;
          }
        }
        return {
          ...item,
          product: productDetails || { name_fr: 'Produit retiré', name_en: 'Archived Product' },
          line_total_cents: item.quantity * item.price_at_purchase_cents
        };
      });

    return {
      order: { ...order },
      items,
      formattedTotal: `$${(order.amount_total_cents / 100).toFixed(2)} CAD`
    };
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: string,
    authContext: { role?: string; isServiceRole?: boolean }
  ): { success: boolean; order: OrderRecord } {
    // Check permission - must be admin or service role
    if (!authContext.isServiceRole && authContext.role !== 'admin') {
      throw new Error('RLS 42501: permission denied for table orders (requires admin or service role)');
    }

    if (!VALID_ORDER_STATUSES.includes(newStatus as OrderStatus)) {
      throw new Error(`Statut invalide: "${newStatus}". Choix acceptés: ${VALID_ORDER_STATUSES.join(', ')}`);
    }

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Commande non trouvée (${orderId})`);
    }

    order.status = newStatus as OrderStatus;
    order.updated_at = new Date().toISOString();
    this.orders.set(orderId, order);

    return { success: true, order: { ...order } };
  }
}

// -------------------------------------------------------------
// Sales Analytics Domain Engine
// -------------------------------------------------------------
export class SalesAnalyticsService {
  public static calculateTotalRevenueCents(orders: OrderRecord[]): number {
    // Only count completed/paid orders: 'paid', 'processing', 'shipped', 'delivered', 'fulfilled'
    // Exclude 'cancelled', 'expired', 'pending'
    const validStatuses = new Set(['paid', 'processing', 'shipped', 'delivered', 'fulfilled']);
    return orders
      .filter(o => validStatuses.has(o.status))
      .reduce((sum, o) => sum + o.amount_total_cents, 0);
  }

  public static calculateTotalOrders(orders: OrderRecord[]): number {
    const validStatuses = new Set(['paid', 'processing', 'shipped', 'delivered', 'fulfilled']);
    return orders.filter(o => validStatuses.has(o.status)).length;
  }

  public static calculateAverageOrderValueCents(totalRevenueCents: number, orderCount: number): number {
    if (orderCount <= 0 || totalRevenueCents <= 0) {
      return 0; // Guard against NaN / Infinity division by zero
    }
    return Math.round(totalRevenueCents / orderCount);
  }

  public static formatCurrencyCAD(cents: number): string {
    return `$${(cents / 100).toFixed(2)} CAD`;
  }

  public static computeAnalytics(
    orders: OrderRecord[],
    orderItems: OrderItemRecord[],
    products: ProductRecord[]
  ): AnalyticsData {
    const totalRevenueCents = this.calculateTotalRevenueCents(orders);
    const totalOrders = this.calculateTotalOrders(orders);
    const averageOrderValueCents = this.calculateAverageOrderValueCents(totalRevenueCents, totalOrders);
    const activeProductsCount = products.filter(p => p.is_active).length;

    // Filter order items belonging only to valid orders
    const validStatuses = new Set(['paid', 'processing', 'shipped', 'delivered', 'fulfilled']);
    const validOrderIds = new Set(orders.filter(o => validStatuses.has(o.status)).map(o => o.id));
    const validItems = orderItems.filter(item => validOrderIds.has(item.order_id));

    // Aggregate by product_id
    const productStats = new Map<string, { unitsSold: number; revenueCents: number }>();
    for (const item of validItems) {
      const current = productStats.get(item.product_id) || { unitsSold: 0, revenueCents: 0 };
      current.unitsSold += item.quantity;
      current.revenueCents += item.quantity * item.price_at_purchase_cents;
      productStats.set(item.product_id, current);
    }

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name_fr: product?.name_fr || 'Produit archivé',
          name_en: product?.name_en || 'Archived Product',
          image_url: product?.image_url || null,
          unitsSold: stats.unitsSold,
          revenueCents: stats.revenueCents
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueCents - a.revenueCents)
      .slice(0, 5);

    // Aggregate revenue by date
    const dayStats = new Map<string, number>();
    for (const o of orders.filter(ord => validStatuses.has(ord.status))) {
      const day = o.created_at.slice(0, 10);
      dayStats.set(day, (dayStats.get(day) || 0) + o.amount_total_cents);
    }

    const revenueByDay = Array.from(dayStats.entries())
      .map(([date, revenueCents]) => ({ date, revenueCents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenueCents,
      totalOrders,
      averageOrderValueCents,
      activeProductsCount,
      topProducts,
      revenueByDay
    };
  }
}

// -------------------------------------------------------------
// SSR Hydration & UI Layout Safety Helper
// -------------------------------------------------------------
export class SSRHydrationSafetyChecker {
  public static verifyChartSSRConfig(componentMarkupOrConfig: {
    isClientOnlyWrapperUsed: boolean;
    hasFallbackSkeleton: boolean;
    directWindowAccessInSetup: boolean;
  }): { ssrSafe: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!componentMarkupOrConfig.isClientOnlyWrapperUsed) {
      violations.push('Chart must be wrapped in <ClientOnly> or suffixed with .client.vue');
    }

    if (!componentMarkupOrConfig.hasFallbackSkeleton) {
      violations.push('Chart must define a <template #fallback> loading skeleton to avoid layout shift');
    }

    if (componentMarkupOrConfig.directWindowAccessInSetup) {
      violations.push('Component setup accesses `window` or `document` during SSR, causing Hydration Node Mismatch');
    }

    return {
      ssrSafe: violations.length === 0,
      violations
    };
  }
}

// -------------------------------------------------------------
// Integrated Test Harness Factory
// -------------------------------------------------------------
export function createTestHarness(options?: {
  initialProducts?: ProductRecord[];
  initialOrders?: OrderRecord[];
  initialItems?: OrderItemRecord[];
}) {
  const productService = new ProductManagementService(options?.initialProducts);
  const orderService = new OrderFulfillmentService(options?.initialOrders, options?.initialItems);

  return {
    productService,
    orderService,
    analyticsService: SalesAnalyticsService,
    evaluateRouteGuard,
    createMockJwt
  };
}
