// XMenú CR — Motor de costeo.
// Convierte unidades EXACTAS (volumen→mL, masa→g, abstractas sin conversión)
// y calcula costos en cadena: ingrediente → receta (anidable) → ítem de menú.
import { UNIDADES_VOLUMEN, UNIDADES_MASA } from './constants'

// Dimensión de una unidad: 'volumen' | 'masa' | 'abstracta'
export function dimensionDe(unidad) {
  if (unidad in UNIDADES_VOLUMEN) return 'volumen'
  if (unidad in UNIDADES_MASA) return 'masa'
  return 'abstracta'
}

// Factor a la unidad base de su dimensión (mL o g). Abstractas → 1.
export function factorABase(unidad) {
  if (unidad in UNIDADES_VOLUMEN) return UNIDADES_VOLUMEN[unidad]
  if (unidad in UNIDADES_MASA) return UNIDADES_MASA[unidad]
  return 1
}

// Unidades compatibles para un ingrediente: misma dimensión; una abstracta
// solo es compatible consigo misma.
export function unidadesCompatibles(unidadIngrediente) {
  const dim = dimensionDe(unidadIngrediente)
  if (dim === 'volumen') return Object.keys(UNIDADES_VOLUMEN)
  if (dim === 'masa') return Object.keys(UNIDADES_MASA)
  return [unidadIngrediente]
}

// Costo del ingrediente por unidad base (mL, g, o unidad abstracta).
export function costoPorBase(ingrediente) {
  const cant = Number(ingrediente.cantPresentacion) || 0
  const costo = Number(ingrediente.costo) || 0
  const totalBase = cant * factorABase(ingrediente.unidad)
  return totalBase > 0 ? costo / totalBase : 0
}

// Costo de un componente {tipo:'ingrediente'|'receta', refId, cantidad, unidad}.
// `mapas` = { ingredientes: Map/obj por id, recetas: obj por id }.
function costoComponente(comp, mapas, visitadas) {
  const cantidad = Number(comp.cantidad) || 0
  if (comp.tipo === 'receta') {
    const receta = mapas.recetas[comp.refId]
    if (!receta) return { costo: 0, error: 'Receta eliminada' }
    const r = costoReceta(receta, mapas, visitadas)
    return { costo: cantidad * r.costoPorServicio, error: r.error }
  }
  const ing = mapas.ingredientes[comp.refId]
  if (!ing) return { costo: 0, error: 'Ingrediente eliminado' }
  if (dimensionDe(comp.unidad) !== dimensionDe(ing.unidad)) {
    return { costo: 0, error: `Unidad incompatible (${comp.unidad} vs ${ing.unidad})` }
  }
  return { costo: cantidad * factorABase(comp.unidad) * costoPorBase(ing), error: null }
}

// Costeo de una receta: total, servicios y costo por servicio. Anidable con
// guarda de ciclos (una receta que se contiene a sí misma no revienta).
export function costoReceta(receta, mapas, visitadas = new Set()) {
  if (visitadas.has(receta.id)) {
    return { costoTotal: 0, costoPorServicio: 0, error: 'Ciclo de recetas' }
  }
  const propias = new Set(visitadas).add(receta.id)
  let total = 0
  let error = null
  for (const comp of receta.componentes || []) {
    const r = costoComponente(comp, mapas, propias)
    total += r.costo
    if (r.error && !error) error = r.error
  }
  const servicios = Number(receta.servicios) || 1
  return { costoTotal: total, costoPorServicio: total / servicios, error }
}

// Costeo de un ítem de menú: componentes + mano de obra opcional.
export function costoItem(item, mapas) {
  let costoComponentes = 0
  let error = null
  const detalle = []
  for (const comp of item.componentes || []) {
    const r = costoComponente(comp, mapas, new Set())
    costoComponentes += r.costo
    if (r.error && !error) error = r.error
    detalle.push({ ...comp, costo: r.costo, error: r.error })
  }
  const manoObra = Number(item.manoObra) || 0
  const costo = costoComponentes + manoObra
  const venta = Number(item.precioVenta) || 0
  const utilidad = venta - costo
  const pctCosto = venta > 0 ? (costo / venta) * 100 : 0
  return { costo, costoComponentes, manoObra, venta, utilidad, pctCosto, detalle, error }
}

// Ponderado de un grupo de ítems (con costeo ya calculado):
// % de costo del grupo = Σcostos / Σventas.
export function ponderadoGrupo(itemsConCosteo) {
  const totVenta = itemsConCosteo.reduce((s, it) => s + it.costeo.venta, 0)
  const totCosto = itemsConCosteo.reduce((s, it) => s + it.costeo.costo, 0)
  return {
    totVenta,
    totCosto,
    totUtilidad: totVenta - totCosto,
    pctCosto: totVenta > 0 ? (totCosto / totVenta) * 100 : 0,
  }
}

// "Usada en": dónde se usa una receta o un ingrediente.
export function usosDe(refId, { recetas = [], menuItems = [] }) {
  const enRecetas = recetas.filter((r) =>
    (r.componentes || []).some((c) => c.refId === refId))
  const enItems = menuItems.filter((it) =>
    (it.componentes || []).some((c) => c.refId === refId))
  return { enRecetas, enItems, total: enRecetas.length + enItems.length }
}

// Índice por id a partir de un arreglo.
export function porId(arr) {
  return Object.fromEntries(arr.map((x) => [x.id, x]))
}
