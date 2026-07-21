// XMenú CR — Pestaña Menú (PR1: listado + guía direccional).
// El constructor de ítem con costeo en vivo llega en PR2 (§5).
import { useColeccion } from '../lib/useColeccion'
import { useEmpresa } from '../context/EmpresaContext'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import { formatMoneda } from '../lib/format'

export default function Menu() {
  const { empresa } = useEmpresa()
  const { datos: items, cargando } = useColeccion('menuItems')
  const { datos: categorias } = useColeccion('categorias')

  if (cargando) return <Cargando />

  // Guía direccional: sin categorías no se puede crear un ítem.
  if (categorias.length === 0) {
    return (
      <GuiaVacio
        emoji="🍽"
        titulo="Todavía no hay menú"
        mensaje="Primero creá una categoría en ⚙️ Configuración (ej: Cócteles) y después agregá tus ítems."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }}
      />
    )
  }

  if (items.length === 0) {
    return (
      <GuiaVacio
        emoji="🍽"
        titulo="Agregá tu primer ítem"
        mensaje="Ya tenés categorías. El constructor de ítems con costeo en vivo se habilita en la siguiente entrega."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }}
      />
    )
  }

  const moneda = empresa?.moneda
  return (
    <div className="stack">
      <div className="row spread">
        <h2>🍽 Menú</h2>
        <span className="pill pill-gris">{items.length} ítems</span>
      </div>
      {items.map((it) => (
        <div key={it.id} className="card row spread">
          <div>
            <div style={{ fontWeight: 700 }}>{it.nombre}</div>
            {it.dePrueba && <span className="pill pill-gris">de prueba</span>}
          </div>
          <div className="pill pill-dorado">{formatMoneda(it.precioVenta, moneda)}</div>
        </div>
      ))}
      <p className="muted center mt">
        El desglose de costeo, utilidad y ponderados llega en la siguiente entrega (PR 2).
      </p>
    </div>
  )
}
