import { parseCookies } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const cookies = parseCookies(event)
    const cookieName = Object.keys(cookies).find(c => c.endsWith('-auth-token'))
    
    if (!cookieName) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    try {
      const cookieValue = cookies[cookieName]
      let token = cookieValue
      if (cookieValue.startsWith('[')) {
        token = JSON.parse(cookieValue)[0]
      }
      
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
      
      if (payload.app_metadata?.role !== 'admin') {
        throw createError({ statusCode: 403, message: 'Forbidden' })
      }
    } catch (e) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }
})
