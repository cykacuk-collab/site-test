export const useCart = () => {
  // Use a cookie so the cart persists across page reloads
  const cart = useCookie('hs_cart', { default: () => [] })
  
  // Track cart session to automatically clear it if paid (even if tab closed)
  const cartId = useCookie('hs_cart_id', { 
    default: () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) 
  })

  const isCartOpen = useState('isCartOpen', () => false)

  // Check if this cart was already paid for (if user closed tab after Stripe payment)
  const verifyCartStatus = async () => {
    if (cart.value.length === 0 || !cartId.value) return
    try {
      const supabase = useSupabaseClient()
      const { data } = await supabase.from('completed_carts').select('cart_id').eq('cart_id', cartId.value).single()
      if (data) {
        clearCart() // Automatically wipe the cart because it was paid!
      }
    } catch (e) {
      // Ignore errors (e.g. network or table not ready)
    }
  }

  // Run the check once on client initialization
  if (import.meta.client) {
    setTimeout(verifyCartStatus, 500)
  }

  const addToCart = (product, quantity = 1) => {
    const existing = cart.value.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity + quantity <= product.stock) {
        existing.quantity += quantity
      } else {
        useToast().addToast(`Stock maximum atteint pour ce produit.`, 'error')
        return
      }
    } else {
      cart.value.push({ ...product, quantity })
    }
    useToast().addToast(`${product.name_fr || product.name} ajouté au panier !`, 'success')
  }

  const removeFromCart = (productId) => {
    cart.value = cart.value.filter(item => item.id !== productId)
  }

  const updateQuantity = (productId, quantity) => {
    const item = cart.value.find(item => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
      } else if (quantity <= item.stock) {
        item.quantity = quantity
      }
    }
  }

  const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => total + (item.price_cents * item.quantity), 0)
  })
  
  const cartItemCount = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0)
  })

  const clearCart = () => {
    cart.value = []
    cartId.value = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
  }

  return {
    cart,
    cartId,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount
  }
}
