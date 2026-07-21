// XMenú CR — Pestaña Recetas base (PR1: listado + guía direccional).
// Costeo total → servicios → costo por servicio y anidado llegan en PR2 (§5).
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'

export default function Recetas() {
  const { datos: recetas, cargando } = useColeccion('recetas')

  if (cargando) return <Cargando />

  if (recetas.length === 0) {
    return (
      <GuiaVacio
        emoji="📖"
        titulo="Todavía no hay recetas base"
        mensaje="Las recetas base te dejan calcular un costo por servicio y reutilizarlo en tus ítems de menú. El constructor llega en la siguiente entrega."
      />
    )
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>📖 Recetas base</h2>
        <span className="pill pill-gris">{recetas.length}</span>
      </div>
      {recetas.map((r) => (
        <div key={r.id} className="card row spread">
          <div>
            <div style={{ fontWeight: 700 }}>{r.nombre}</div>
            {r.nota && <div className="muted" style={{ fontSize: 13 }}>{r.nota}</div>}
          </div>
          <span className="pill pill-gris">{r.servicios || 0} servicios</span>
        </div>
      ))}
    </div>
  )
}
