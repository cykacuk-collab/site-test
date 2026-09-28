import { serverSupabaseServiceRole } from '#supabase/server'
import { parseCookies, createError, readBody, getRouterParam } from 'h3'

const ALLOWED_ORDER_STATUSES = [
  'paid',
  'processing',
  'shipped',
  'delivered',
  'fulfilled',
  'cancelled'
]

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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de commande requis'
    })
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant de commande invalide (format UUID requis)'
    })
  }

  // 2. Read and validate request body
  const body = await readBody(event).catch(() => ({}))
  const newStatus = body?.status

  if (!newStatus || !ALLOWED_ORDER_STATUSES.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Statut invalide: "${newStatus}". Statuts autorisés: ${ALLOWED_ORDER_STATUSES.join(', ')}`
    })
  }

  // 3. Update order record using service role client to bypass RLS 42501
  const supabase = await serverSupabaseServiceRole(event)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: now
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[ADMIN ORDERS PATCH] Supabase update error:', error)
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: `Commande non trouvée (${id})`
      })
    }
    if (error.code === '22P02') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Identifiant de commande invalide (format UUID requis)'
      })
    }
    if (error.code === '23514') {
      throw createError({
        statusCode: 400,
        statusMessage: `Contrainte de statut violée: ${error.message}`
      })
    }
    if (error.code === '42501') {
      throw createError({
        statusCode: 500,
        statusMessage: `Database permission error: ${error.message} (Grant public.orders table permissions to service_role)`
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Database update error: ${error.message}`
    })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: `Commande non trouvée (${id})`
    })
  }

  return {
    success: true,
    order: data
  }
})
