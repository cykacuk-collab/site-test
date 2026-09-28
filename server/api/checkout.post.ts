import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole(event) // Bypass RLS to lock inventory securely

  // 1. Enforce 1MB Payload Limit (Security)
  const contentLength = Number(event.node.req.headers['content-length'] || 0)
  if (contentLength > 1000000) {
    console.error('[CHECKOUT] Payload too large:', contentLength)
    throw createError({ statusCode: 413, message: 'Payload trop volumineux' })
  }

  const body = await readBody(event)
  console.log('[CHECKOUT] Initiating checkout for items:', body.items?.length)

  // 2. Verify Turnstile First (Security)
  if (!body.turnstileToken) {
    console.error('[CHECKOUT] Missing Turnstile Token')
    throw createError({ statusCode: 400, message: 'Captcha manquant' })
  }

  console.log('[CHECKOUT] Verifying Turnstile token with Cloudflare...')
  const verifyResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: {
      secret: process.env.NUXT_TURNSTILE_SECRET_KEY,
      response: body.turnstileToken
    }
  })

  if (!verifyResponse.success) {
    console.error('[CHECKOUT] Turnstile rejection:', verifyResponse)
    throw createError({ statusCode: 403, message: `Captcha invalide (Erreur Cloudflare: ${verifyResponse['error-codes']?.join(', ') || 'inconnue'})` })
  }

  // 3. Extract items and ensure it's a valid array
  let items = body.items
  if (!Array.isArray(items) || items.length === 0) {
    console.error('[CHECKOUT] Empty or invalid cart payload')
    throw createError({ statusCode: 400, message: 'Panier vide' })
  }

  // Deduplicate items and validate
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const mergedItems: Record<string, { id: string, quantity: number }> = {}
  for (const item of items) {
    if (typeof item.id !== 'string' || !uuidRegex.test(item.id)) {
      throw createError({ statusCode: 400, message: 'Invalid item id format' })
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity >= 100) {
      throw createError({ statusCode: 400, message: 'Quantité invalide' })
    }
    if (mergedItems[item.id]) {
      mergedItems[item.id].quantity += item.quantity
      if (mergedItems[item.id].quantity >= 100) {
        throw createError({ statusCode: 400, message: 'Quantité totale trop élevée pour un article' })
      }
    } else {
      mergedItems[item.id] = { id: item.id, quantity: item.quantity }
    }
  }
  items = Object.values(mergedItems)

  const itemIds = items.map(item => item.id)

  // 4. Fetch official prices from DB to prevent client spoofing
  console.log('[CHECKOUT] Fetching products from database...', itemIds)
  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id, name_fr, price_cents, stock')
    .in('id', itemIds)

  if (dbError || !dbProducts) {
    console.error('[CHECKOUT] Supabase fetch error:', dbError)
    throw createError({ statusCode: 500, message: 'Erreur base de données' })
  }

  // Map requested items to DB products to build Stripe line items safely
  const lineItems = []
  const cartForRpc = []

  for (const item of items) {
    const dbProduct = dbProducts.find(p => p.id === item.id)
    if (!dbProduct) {
      console.error('[CHECKOUT] Product missing from DB:', item.id)
      throw createError({ statusCode: 400, message: `Produit introuvable: ${item.id}` })
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw createError({ statusCode: 400, message: 'Quantité invalide' })
    cartForRpc.push({ id: item.id, quantity: item.quantity })

    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: {
          name: dbProduct.name_fr,
          metadata: { db_id: dbProduct.id }
        },
        unit_amount: dbProduct.price_cents,
      },
      quantity: item.quantity,
    })
  }

  // 5. Atomic Inventory Lock (Postgres Transaction)
  console.log('[CHECKOUT] Attempting to lock inventory via process_cart_lock RPC...')
  const { error: lockError } = await supabase.rpc('process_cart_lock', {
    cart_items: cartForRpc
  })

  if (lockError) {
    console.error('[CHECKOUT] RPC Inventory Lock failed:', lockError)
    throw createError({ statusCode: 400, message: lockError.message || 'Stock insuffisant pour cette commande.' })
  }

  // 6. Create Stripe Checkout Session
  console.log('[CHECKOUT] Inventory locked. Generating Stripe checkout session...')
  try {
    const baseUrl = useRuntimeConfig().public.siteUrl || process.env.APP_URL // e.g. https://my-site.vercel.app

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/?success=true`,
      cancel_url: `${baseUrl}/?canceled=true`,
      shipping_address_collection: {
        allowed_countries: ['CA'], // Restrict to Canada
      },
      metadata: {
        cart_id: body.cartId || ''
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // Strictly 30 mins
    })

    console.log('[CHECKOUT] Stripe session created successfully:', session.id)
    return { url: session.url }
  } catch (err: any) {
    console.error('[CHECKOUT] Stripe Session creation failed:', err)
    // If Stripe fails to create the session, atomically release the inventory back!
    try {
      await supabase.rpc('release_cart_lock', { cart_items: cartForRpc })
    } catch (releaseErr) {
      console.error('[CHECKOUT] Failed to release lock:', releaseErr)
    }
    throw createError({ statusCode: 500, message: "Erreur de traitement du paiement" })
  }
})
