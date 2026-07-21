// XMenú CR — 📋 Bitácora: quién / qué / cuándo, con filtros.
// La ven dueño y editor (las reglas de Firestore lo respaldan).
// El export a Excel llega en PR 4.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmpresa } from '../context/EmpresaContext'
import { useColeccion } from '../lib/useColeccion'
import Cargando from '../components/Cargando'
import GuiaVacio from '../components/GuiaVacio'
import { formatFecha } from '../lib/format'
import { PERMISOS } from '../lib/constants'

export default function Bitacora() {
  const { rol } = useEmpresa()
  const { datos: entradas, cargando, error } = useColeccion('bitacora', { orderByNombre: false })
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [texto, setTexto] = useState('')

  const permisos = PERMISOS[rol] || PERMISOS.lector

  const usuarios = useMemo(() => [...new Set(entradas.map((e) => e.correo).filter(Boolean))].sort(), [entradas])

  const lista = useMemo(() => {
    const t = texto.trim().toLocaleLowerCase('es')
    return [...entradas]
      .filter((e) => !filtroUsuario || e.correo === filtroUsuario)
      .filter((e) => !t || `${e.accion} ${e.detalle}`.toLocaleLowerCase('es').includes(t))
      .sort((a, b) => (b.cuando?.seconds || 0) - (a.cuando?.seconds || 0))
  }, [entradas, filtroUsuario, texto])

  if (!permisos.bitacora) {
    return (
      <div className="aviso aviso-peligro">
        <h3>Acceso restringido</h3>
        <p>La bitácora la ven el dueño y los editores.</p>
        <Link to="/app/config" className="btn btn-fantasma mt">← Volver</Link>
      </div>
    )
  }

  if (cargando) return <Cargando />
  if (error) {
    return (
      <div className="aviso aviso-peligro">
        <p>No se pudo cargar la bitácora (permisos).</p>
        <Link to="/app/config" className="btn btn-fantasma mt">← Volver</Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>📋 Bitácora</h2>
        <Link to="/app/config" className="btn btn-fantasma" style={{ padding: '8px 12px' }}>← Config</Link>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <input className="input" placeholder="Buscar acción o detalle…" value={texto}
          onChange={(e) => setTexto(e.target.value)} />
        {usuarios.length > 1 && (
          <select className="input" style={{ maxWidth: 180 }} value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>

      {lista.length === 0 && (
        <GuiaVacio emoji="📋" titulo="Sin registros todavía"
          mensaje="Aquí queda todo lo que pasa en la empresa: quién creó, editó o eliminó qué, y cuándo." />
      )}

      {lista.map((e) => (
        <div key={e.id} className="card" style={{ padding: 10 }}>
          <div className="row spread">
            <b>{e.accion}</b>
            <span className="muted" style={{ fontSize: 12 }}>{formatFecha(e.cuando)}</span>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            {e.detalle && <>{e.detalle} · </>}👤 {e.correo || e.uid}
          </div>
        </div>
      ))}
      {lista.length > 0 && (
        <p className="muted center" style={{ fontSize: 12 }}>El export a Excel llega en la siguiente entrega.</p>
      )}
    </div>
  )
}
