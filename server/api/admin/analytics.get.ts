import { serverSupabaseServiceRole } from '#supabase/server'
import { parseCookies, createError } from 'h3'

function checkAdminAuth(event: any) {
  if (process.dev) {
    return
  }

  const cookies = parseCookies(event)
  const authCookieKeys = Object.keys(cookies).filter(c => /-auth-token(\.\d+)?$/.test(c))
  if (authCookieKeys.length === 0) {
    throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
  }

  try {
    const baseName = authCookieKeys[0].replace(/\.\d+$/, '')
    const chunkKeys = Object.keys(cookies)
      .filter(k => k === baseName || (k.startsWith(`${baseName}.`) && /^\.\d+$/.test(k.slice(baseName.length))))
      .sort((a, b) => {
        const idxA = a === baseName ? 0 : parseInt(a.slice(baseName.length + 1), 10)
        const idxB = b === baseName ? 0 : parseInt(b.slice(baseName.length + 1), 10)
        return idxA - idxB
      })

    const rawCookieValue = chunkKeys.map(k => cookies[k]).join('')
    let token = rawCookieValue
    if (rawCookieValue.startsWith('[')) {
      token = JSON.parse(rawCookieValue)[0]
    }
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Invalid token format' })
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Session expired' })
    }

    if (payload.app_metadata?.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Forbidden: Admin privilege required' })
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  // 1. Verify admin authentication or development mode
  checkAdminAuth(event)

  // 2. Access database using service role client to bypass RLS 42501
  const supabase = await serverSupabaseServiceRole(event)

  // 3. Fetch orders, products, and order items concurrently
  const [ordersRes, productsRes, orderItemsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, amount_total_cents, status, created_at'),
    supabase
      .from('products')
      .select('id, name_fr, name_en, image_url, is_active'),
    supabase
      .from('order_items')
      .select('id, order_id, product_id, quantity, price_at_purchase_cents')
  ])

  if (ordersRes.error) {
    console.error('[ADMIN ANALYTICS] Orders query error:', ordersRes.error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${ordersRes.error.message}`
    })
  }

  if (productsRes.error) {
    console.error('[ADMIN ANALYTICS] Products query error:', productsRes.error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${productsRes.error.message}`
    })
  }

  if (orderItemsRes.error) {
    console.error('[ADMIN ANALYTICS] Order items query error:', orderItemsRes.error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${orderItemsRes.error.message}`
    })
  }

  const allOrders = ordersRes.data || []
  const allProducts = productsRes.data || []
  const allOrderItems = orderItemsRes.data || []

  // Valid order statuses for completed/earned revenue:
  // Strictly exclude 'cancelled', 'expired', 'pending'
  const validStatuses = new Set(['paid', 'processing', 'shipped', 'delivered', 'fulfilled'])
  const validOrders = allOrders.filter(o => validStatuses.has(o.status))

  // 4. Compute KPI Metrics
  const totalRevenueCents = validOrders.reduce((sum, o) => sum + (o.amount_total_cents || 0), 0)
  const totalOrders = validOrders.length
  // 0-order resilience guard to avoid NaN or Infinity
  const averageOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0
  const activeProductsCount = allProducts.filter(p => p.is_active).length

  // 5. Aggregate Top-Selling Products Leaderboard
  const validOrderIds = new Set(validOrders.map(o => o.id))
  const validItems = allOrderItems.filter(item => validOrderIds.has(item.order_id))

  const productStats = new Map<string, { unitsSold: number; revenueCents: number }>()
  for (const item of validItems) {
    if (!item.product_id) continue
    const current = productStats.get(item.product_id) || { unitsSold: 0, revenueCents: 0 }
    const qty = item.quantity || 0
    const price = item.price_at_purchase_cents || 0
    current.unitsSold += qty
    current.revenueCents += qty * price
    productStats.set(item.product_id, current)
  }

  const productsMap = new Map(allProducts.map(p => [p.id, p]))

  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => {
      const product = productsMap.get(productId)
      return {
        id: productId,
        name_fr: product?.name_fr || 'Produit archivé',
        name_en: product?.name_en || 'Archived Product',
        image_url: product?.image_url || null,
        unitsSold: stats.unitsSold,
        revenueCents: stats.revenueCents
      }
    })
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueCents - a.revenueCents)
    .slice(0, 5)

  // 6. Aggregate Daily Revenue Trend
  const dayStats = new Map<string, number>()
  for (const o of validOrders) {
    if (o.created_at) {
      const dateKey = o.created_at.slice(0, 10)
      dayStats.set(dateKey, (dayStats.get(dateKey) || 0) + (o.amount_total_cents || 0))
    }
  }

  const revenueByDay = Array.from(dayStats.entries())
    .map(([date, revenueCents]) => ({ date, revenueCents }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalRevenueCents,
    totalOrders,
    averageOrderValueCents,
    activeProductsCount,
    topProducts,
    revenueByDay
  }
})
