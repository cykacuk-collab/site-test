// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  future: {
    compatibilityVersion: 4,
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
    '@nuxtjs/turnstile',
    'nuxt-security',
    '@nuxt/image'
  ],
  runtimeConfig: {
    public: {
      siteUrl: 'https://histoireetsaveurs.ca'
    }
  },
  routeRules: {
    '/api/checkout': {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 60000
        }
      }
    },
    '/api/b2b-inquiry': {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 60000
        }
      }
    }
  },

  security: {
    headers: process.env.NODE_ENV === 'production' ? {
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        'img-src': ["'self'", "data:", "https://images.unsplash.com", "https://via.placeholder.com", process.env.SUPABASE_URL || "https://*.supabase.co"],
        'script-src': ["'self'", "https://challenges.cloudflare.com"],
        'frame-src': ["'self'", "https://challenges.cloudflare.com", "https://js.stripe.com", "https://hooks.stripe.com"],
        'connect-src': ["'self'", process.env.SUPABASE_URL || "https://*.supabase.co", "https://challenges.cloudflare.com", "ws:", "wss:"]
      },
      crossOriginEmbedderPolicy: 'unsafe-none' // Required for external images/stripe
    } : false
  },
  supabase: {
    redirect: false
  },
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-CA', name: 'Français', file: 'fr.json' },
      { code: 'en', iso: 'en-CA', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    lazy: true
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      title: 'Histoire et Saveurs | Fonds de tarte artisanaux',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap' }
      ]
    }
  }
})
