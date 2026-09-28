export const useToast = () => {
  const toasts = useState('toasts', () => [])

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type })
    
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, addToast, removeToast }
}
