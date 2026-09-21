export const useCart = () => {
  // Use a cookie so the cart persists across page reloads
  const cart = useCookie('hs_cart', { default: () => [] })
  
  const isCartOpen = useState('isCartOpen', () => false)

  const addToCart = (product, quantity = 1) => {
    const existing = cart.value.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity + quantity <= product.stock) {
        existing.quantity += quantity
      }
    } else {
      cart.value.push({ ...product, quantity })
    }
    isCartOpen.value = true
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
  }

  return {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount
  }
}
