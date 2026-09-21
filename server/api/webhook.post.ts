import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Provide a dummy fallback so the server doesn't crash on boot if the key is missing in local .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_prevent_crash')

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)
  if (!body) throw createError({ statusCode: 400, message: 'Missing body' })

  const stripeSignature = event.node.req.headers['stripe-signature']
  if (!stripeSignature) throw createError({ statusCode: 400, message: 'Missing stripe signature' })

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, stripeSignature, endpointSecret)
  } catch (err) {
    throw createError({ statusCode: 400, message: `Webhook signature verification failed: ${err.message}` })
  }

  const supabase = await serverSupabaseServiceRole(event)

  // 1. Database-First Idempotency Lock
  // Attempt to insert immediately. If Stripe sends duplicate concurrent events,
  // the UNIQUE constraint on stripe_event_id will throw an error, preventing race conditions.
  const { error: lockError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: stripeEvent.id,
      type: stripeEvent.type,
      status: 'processing'
    })

  if (lockError) {
    // 23505 is the Postgres error code for unique violation
    if (lockError.code === '23505') {
      console.log(`Webhook ${stripeEvent.id} is already being processed. Ignoring duplicate.`)
      return { success: true, message: 'Already processed' }
    }
    throw createError({ statusCode: 500, message: 'Database lock failed' })
  }

  // 2. Handle specific Stripe events safely
  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object

      // Fetch official line items directly from Stripe to bypass the 500-char metadata limit
      // We expand the product so we can read our injected db_id metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
        limit: 100
      })

      // Create Order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          amount_total_cents: session.amount_total,
          status: 'paid'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Process Items securely from Stripe's source of truth
      const orderItems = []
      for (const item of lineItems.data) {
        const productId = item.price.product.metadata.db_id
        if (!productId) {
          console.error(`Missing db_id metadata in Stripe product for line item ${item.id}`)
          continue // Edge case fallback
        }

        orderItems.push({
          order_id: newOrder.id,
          product_id: productId,
          quantity: item.quantity,
          price_at_purchase_cents: item.price.unit_amount
        })
      }

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
        if (itemsError) throw itemsError
      }

      // Background Email Dispatch
      if (session.customer_details?.email) {
        event.waitUntil(
          resend.emails.send({
            from: 'Histoire et Saveurs <commandes@histoireetsaveurs.com>',
            to: [session.customer_details.email],
            subject: 'Confirmation de votre commande - Histoire et Saveurs',
            html: `<h1>Merci pour votre commande!</h1><p>Votre commande de ${(session.amount_total / 100).toFixed(2)}$ a bien été reçue.</p>`
          }).catch(err => console.error('Failed to send confirmation email', err))
        )
      }

    } else if (stripeEvent.type === 'checkout.session.expired') {
      const session = stripeEvent.data.object

      // Fetch line items to know exactly what to release back into inventory
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
        limit: 100
      })

      const itemsToRelease = []
      for (const item of lineItems.data) {
        const productId = item.price.product.metadata?.db_id
        if (productId) {
          itemsToRelease.push({ id: productId, quantity: item.quantity })
        }
      }

      if (itemsToRelease.length > 0) {
        // Atomic Inventory Release
        const { error: releaseError } = await supabase.rpc('release_cart_lock', {
          cart_items: itemsToRelease
        })
        if (releaseError) throw releaseError
      }
    }

    // Mark as completed upon success
    await supabase.from('webhook_events')
      .update({ status: 'completed' })
      .eq('stripe_event_id', stripeEvent.id)

    return { success: true }

  } catch (processingError) {
    // If our logic fails, delete the idempotency lock so Stripe can safely retry it later!
    console.error('Webhook processing failed, removing lock:', processingError)
    await supabase.from('webhook_events').delete().eq('stripe_event_id', stripeEvent.id)
    
    throw createError({ statusCode: 500, message: processingError.message })
  }
})
