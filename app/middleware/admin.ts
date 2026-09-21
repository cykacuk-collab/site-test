export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  
  if (!user.value) {
    return navigateTo('/admin/login')
  }

  // For local development, we'll bypass the strict admin check so you can test easily
  if (process.dev) {
    return
  }

  // Production check
  const isAdmin = user.value.app_metadata?.role === 'admin'
  if (!isAdmin) {
    return navigateTo('/')
  }
})
