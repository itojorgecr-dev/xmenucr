// XMenú CR — Editor de componentes con costeo EN VIVO.
// Compartido por el constructor de ítems y el de recetas base.
// componentes = [{tipo, refId, cantidad, unidad}]
import { useState } from 'react'
import Hoja from './Hoja'
import BuscadorComponentes from './BuscadorComponentes'
import { useEmpresa } from '../context/EmpresaContext'
import { formatMoneda } from '../lib/format'
import { unidadesCompatibles, dimensionDe, factorABase, costoPorBase, costoReceta } from '../lib/costeo'
import { UNIDADES_VOLUMEN, UNIDADES_MASA } from '../lib/constants'

// Etiqueta con equivalencia visible en el selector (ej: "cup (240 mL)").
function etiquetaUnidad(u) {
  if (u in UNIDADES_VOLUMEN) return u === 'mL' ? 'mL' : `${u} (${UNIDADES_VOLUMEN[u]} mL)`
  if (u in UNIDADES_MASA) return u === 'g' ? 'g' : `${u} (${UNIDADES_MASA[u]} g)`
  return u
}

export default function EditorComponentes({ componentes, onCambiar, ingredientes, recetas, mapas, excluirRecetaId }) {
  const { empresa } = useEmpresa()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const moneda = empresa?.moneda

  function agregar(tipo, obj) {
    const nuevo = tipo === 'ingrediente'
      ? { tipo, refId: obj.id, cantidad: 1, unidad: obj.unidad }
      : { tipo, refId: obj.id, cantidad: 1, unidad: 'servicio' }
    onCambiar([...componentes, nuevo])
    setHojaAbierta(false)
  }

  function actualizar(i, campos) {
    const copia = componentes.slice()
    copia[i] = { ...copia[i], ...campos }
    onCambiar(copia)
  }

  function quitar(i) {
    onCambiar(componentes.filter((_, j) => j !== i))
  }

  function costoDe(comp) {
    if (comp.tipo === 'receta') {
      const r = mapas.recetas[comp.refId]
      return r ? (Number(comp.cantidad) || 0) * costoReceta(r, mapas).costoPorServicio : 0
    }
    const ing = mapas.ingredientes[comp.refId]
    if (!ing || dimensionDe(comp.unidad) !== dimensionDe(ing.unidad)) return 0
    return (Number(comp.cantidad) || 0) * factorABase(comp.unidad) * costoPorBase(ing)
  }

  return (
    <div className="stack">
      {componentes.map((comp, i) => {
        const obj = comp.tipo === 'receta' ? mapas.recetas[comp.refId] : mapas.ingredientes[comp.refId]
        const nombre = obj?.nombre || '⚠️ eliminado'
        const unidades = comp.tipo === 'receta'
          ? ['servicio']
          : obj ? unidadesCompatibles(obj.unidad) : [comp.unidad]
        return (
          <div key={i} className="card" style={{ padding: 12 }}>
            <div className="row spread">
              <div style={{ fontWeight: 700 }}>
                {comp.tipo === 'receta' ? '📖' : '🧺'} {nombre}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="pill pill-dorado">{formatMoneda(costoDe(comp), moneda)}</span>
                <button className="btn btn-fantasma" style={{ padding: '4px 10px' }}
                  onClick={() => quitar(i)} title="Quitar">🗑</button>
              </div>
            </div>
            <div className="row mt" style={{ gap: 8 }}>
              <input className="input" type="number" inputMode="decimal" min="0" step="any"
                style={{ maxWidth: 110 }} value={comp.cantidad}
                onChange={(e) => actualizar(i, { cantidad: e.target.value })} />
              <select className="input" value={comp.unidad}
                onChange={(e) => actualizar(i, { unidad: e.target.value })}>
                {unidades.map((u) => (
                  <option key={u} value={u}>{etiquetaUnidad(u)}</option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      <button className="btn btn-fantasma btn-bloque" onClick={() => setHojaAbierta(true)}>
        ＋ Agregar componente
      </button>

      <Hoja titulo="Agregar componente" abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)}>
        <BuscadorComponentes
          ingredientes={ingredientes} recetas={recetas} mapas={mapas}
          excluirRecetaId={excluirRecetaId} onElegir={agregar} />
      </Hoja>
    </div>
  )
}
