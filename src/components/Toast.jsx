// XMenú CR — Toast simple (avisos efímeros).
import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [mensaje, setMensaje] = useState('')
  const timer = useRef(null)

  const toast = useCallback((texto, ms = 3200) => {
    setMensaje(texto)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMensaje(''), ms)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {mensaje && <div className="toast" role="status">{mensaje}</div>}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
