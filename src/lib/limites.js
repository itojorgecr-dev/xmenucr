// XMenú CR — Chequeo de límites por plan (demo).
import { PLANES } from './constants'

// Devuelve { permitido, limite, mensaje } para un recurso dado el conteo actual.
export function chequearLimite(planId, recurso, conteoActual) {
  const plan = PLANES[planId] || PLANES.demo
  if (!plan.limites) return { permitido: true, limite: null }
  const limite = plan.limites[recurso]
  if (limite == null) return { permitido: true, limite: null }
  const permitido = conteoActual < limite
  return {
    permitido,
    limite,
    mensaje: permitido
      ? null
      : `Llegaste al límite del plan Demo (${limite}). Pasate a un plan de pago para seguir agregando.`,
  }
}

export function limiteRestaurantes(planId, conteoActual) {
  const plan = PLANES[planId] || PLANES.demo
  const permitido = conteoActual < plan.restaurantes
  return {
    permitido,
    limite: plan.restaurantes,
    mensaje: permitido
      ? null
      : `Tu plan permite ${plan.restaurantes} restaurante${plan.restaurantes > 1 ? 's' : ''}. Cambiá de plan para agregar más.`,
  }
}
