// XMenú CR — Formateo es-CR (moneda configurable por empresa).
import { MONEDAS, MONEDA_POR_DEFECTO } from './constants'

export function formatMoneda(valor, monedaCodigo = MONEDA_POR_DEFECTO) {
  const m = MONEDAS[monedaCodigo] || MONEDAS[MONEDA_POR_DEFECTO]
  const n = Number(valor || 0)
  try {
    return new Intl.NumberFormat(m.locale, {
      style: 'currency',
      currency: m.codigo,
      minimumFractionDigits: m.codigo === 'CRC' ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${m.simbolo}${n.toLocaleString('es-CR')}`
  }
}

export function formatPorcentaje(valor, decimales = 1) {
  const n = Number(valor || 0)
  return `${n.toFixed(decimales)}%`
}

export function formatFecha(fecha) {
  if (!fecha) return ''
  // Acepta Timestamp de Firestore, Date o número.
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
