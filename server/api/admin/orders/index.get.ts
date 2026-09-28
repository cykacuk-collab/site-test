import { serverSupabaseServiceRole } from '#supabase/server'
import { parseCookies, createError } from 'h3'

function checkAdminAuth(event: any) {
  if (process.dev) {
    return
  }

  const cookies = parseCookies(event)
  const cookieName = Object.keys(cookies).find(c => c.endsWith('-auth-token'))
  if (!cookieName) {
    throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
  }

  try {
    const cookieValue = cookies[cookieName]
    let token = cookieValue
    if (cookieValue.startsWith('[')) {
      token = JSON.parse(cookieValue)[0]
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

  // 2. Query orders with service role client to bypass RLS 42501
  const supabase = await serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      stripe_session_id,
      customer_email,
      customer_name,
      amount_total_cents,
      status,
      created_at,
      updated_at,
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        price_at_purchase_cents,
        products (
          id,
          name_fr,
          name_en,
          reference_code,
          image_url,
          price_cents
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ADMIN ORDERS GET] Supabase query error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${error.message}`
    })
  }

  // 3. Normalize joined product records and fallback placeholders
  const orders = (data || []).map((order: any) => ({
    id: order.id,
    user_id: order.user_id || null,
    stripe_session_id: order.stripe_session_id,
    customer_email: order.customer_email,
    customer_name: order.customer_name || null,
    shipping_address: order.shipping_address || null,
    amount_total_cents: order.amount_total_cents,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    order_items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase_cents: item.price_at_purchase_cents,
      product: item.products || item.product || {
        id: item.product_id,
        name_fr: 'Produit retiré',
        name_en: 'Archived Product',
        image_url: null,
        reference_code: null
      }
    }))
  }))

  return { orders }
})
