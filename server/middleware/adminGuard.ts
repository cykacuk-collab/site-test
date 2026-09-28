import { parseCookies, sendRedirect, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Intercept /admin* and /api/admin*, except /admin/login
  const isProtected = (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && pathname !== '/admin/login'
  if (!isProtected) {
    return
  }

  // Support development mode matching app/middleware/admin.ts
  if (process.dev) {
    return
  }

  const cookies = parseCookies(event)
  // Match cookie names matching /-auth-token(\.\d+)?$/ (standalone or chunked e.g. sb-<project>-auth-token.0)
  const authCookieKeys = Object.keys(cookies).filter(c => /-auth-token(\.\d+)?$/.test(c))

  // If unauthenticated, throw 401 for API endpoints or redirect with 302 to /admin/login for web pages
  if (authCookieKeys.length === 0) {
    if (pathname.startsWith('/api/')) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }
    return sendRedirect(event, '/admin/login', 302)
  }

  try {
    // Reassemble chunked cookies if split across multiple cookies (e.g. .0, .1)
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

    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Invalid token format' })
    }
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())

    // Token Expiration Check: verify payload.exp against current timestamp
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Session expired' })
    }

    if (payload.app_metadata?.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  } catch (e: any) {
    if (e.statusCode === 403) {
      throw e
    }
    // Invalid, expired, or unparseable token is treated as unauthenticated
    if (pathname.startsWith('/api/')) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Authentication required' })
    }
    return sendRedirect(event, '/admin/login', 302)
  }
})
