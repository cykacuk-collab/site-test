import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_prevent_crash')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Verify Turnstile
  if (!body.turnstileToken) {
    throw createError({ statusCode: 400, message: 'Captcha manquant' })
  }

  const verifyResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: {
      secret: process.env.NUXT_TURNSTILE_SECRET_KEY,
      response: body.turnstileToken
    }
  })

  if (!verifyResponse.success) {
    throw createError({ statusCode: 403, message: 'Captcha invalide' })
  }

  // 2. Validate input
  if (!body.company || !body.name || !body.email || !body.message) {
    throw createError({ statusCode: 400, message: 'Veuillez remplir tous les champs' })
  }

  // 3. Send Email via Resend
  try {
    await resend.emails.send({
      from: 'Histoire et Saveurs B2B <b2b@histoireetsaveurs.com>', // MUST BE VERIFIED DOMAIN IN RESEND
      to: ['sales@histoireetsaveurs.com'], // Replace with actual client email
      subject: `Nouvelle demande B2B - ${body.company}`,
      html: `
        <h2>Nouvelle demande d'informations (B2B/Gros)</h2>
        <p><strong>Entreprise:</strong> ${body.company}</p>
        <p><strong>Contact:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <hr />
        <h3>Message:</h3>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
      `
    })
    
    return { success: true }
  } catch (error) {
    console.error('B2B Email Error:', error)
    // We return success anyway so we don't leak server errors to the user if email just fails to send,
    // or we can throw it. In this case, we'll throw.
    throw createError({ statusCode: 500, message: "Erreur serveur lors de l'envoi." })
  }
})
