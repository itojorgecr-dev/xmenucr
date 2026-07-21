// XMenú CR — Pestaña Ingredientes (PR1: listado + guía direccional).
// Presentaciones con tablas de unidades exactas y notas llegan en PR2 (§5).
import { useColeccion } from '../lib/useColeccion'
import { useEmpresa } from '../context/EmpresaContext'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import { formatMoneda } from '../lib/format'

export default function Ingredientes() {
  const { empresa } = useEmpresa()
  const { datos: ingredientes, cargando } = useColeccion('ingredientes')
  const { datos: proveedores } = useColeccion('proveedores')

  if (cargando) return <Cargando />

  // Guía direccional: el proveedor es obligatorio para crear un ingrediente.
  if (proveedores.length === 0) {
    return (
      <GuiaVacio
        emoji="🚚"
        titulo="Primero necesitás un proveedor"
        mensaje="Cada ingrediente lleva un proveedor. Creá uno en ⚙️ Configuración y volvé aquí."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }}
      />
    )
  }

  if (ingredientes.length === 0) {
    return (
      <GuiaVacio
        emoji="🧺"
        titulo="Agregá tu primer ingrediente"
        mensaje="Ya tenés proveedores. El formulario con presentaciones y unidades exactas se habilita en la siguiente entrega."
      />
    )
  }

  const provPorId = Object.fromEntries(proveedores.map((p) => [p.id, p.nombre]))
  return (
    <div className="stack">
      <div className="row spread">
        <h2>🧺 Ingredientes</h2>
        <span className="pill pill-gris">{ingredientes.length}</span>
      </div>
      {ingredientes.map((ing) => (
        <div key={ing.id} className="card">
          <div className="row spread">
            <div style={{ fontWeight: 700 }}>{ing.nombre}</div>
            <div className="pill pill-dorado">
              {formatMoneda(ing.costo, empresa?.moneda)} / {ing.cantPresentacion} {ing.unidad}
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            🚚 {provPorId[ing.proveedorId] || 'Sin proveedor'}
            {ing.nota && <> · 📝 {ing.nota}</>}
          </div>
        </div>
      ))}
    </div>
  )
}
