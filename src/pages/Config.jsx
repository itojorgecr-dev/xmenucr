// XMenú CR — ⚙️ Configuración de la empresa.
// Restaurantes (según plan), categorías, proveedores, unidades abstractas,
// moneda, plan, colaboradores (empresarial) y eliminar artículos de prueba.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import { eliminarArticulosPrueba, registrarBitacora } from '../lib/empresa'
import { chequearLimite, limiteRestaurantes } from '../lib/limites'
import { PERMISOS, MONEDAS, UNIDADES_ABSTRACTAS_BASE } from '../lib/constants'
import Cargando from '../components/Cargando'

// Alta genérica de un documento con empresaId, con chequeo de límite demo.
function useAltaSimple(coleccion, recursoLimite) {
  const { empresa, plan } = useEmpresa()
  const { user } = useAuth()
  const toast = useToast()

  async function agregar(nombre, conteoActual, extra = {}) {
    if (!nombre.trim()) return false
    const chk = chequearLimite(plan.id, recursoLimite, conteoActual)
    if (!chk.permitido) { toast(chk.mensaje); return false }
    await addDoc(collection(db, coleccion), {
      empresaId: empresa.id, nombre: nombre.trim(), creadoEl: serverTimestamp(), ...extra,
    })
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: `Creó ${coleccion.slice(0, -1)}`, detalle: nombre.trim(),
    })
    return true
  }
  return agregar
}

function ListaEditable({ titulo, emoji, coleccion, recursoLimite, placeholder, extra }) {
  const { datos, cargando } = useColeccion(coleccion)
  const [nombre, setNombre] = useState('')
  const agregar = useAltaSimple(coleccion, recursoLimite)
  const toast = useToast()

  async function onAgregar(e) {
    e.preventDefault()
    const ok = await agregar(nombre, datos.length, extra)
    if (ok) { setNombre(''); toast('Agregado.') }
  }
  async function borrar(id) {
    await deleteDoc(doc(db, coleccion, id))
    toast('Eliminado.')
  }

  return (
    <div className="card">
      <h3>{emoji} {titulo}</h3>
      {cargando ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="stack">
          {datos.length === 0 && <p className="muted">Todavía no hay. Agregá el primero 👇</p>}
          {datos.map((d) => (
            <div key={d.id} className="row spread" style={{ borderBottom: '1px solid var(--borde)', paddingBottom: 8 }}>
              <span>{d.nombre} {d.dePrueba && <span className="pill pill-gris">prueba</span>}</span>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }}
                onClick={() => borrar(d.id)} title="Eliminar">🗑</button>
            </div>
          ))}
        </div>
      )}
      <form className="row mt" onSubmit={onAgregar}>
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={placeholder} />
        <button className="btn btn-dorado" type="submit">＋</button>
      </form>
    </div>
  )
}

export default function Config() {
  const { user } = useAuth()
  const { empresa, plan, rol, recargar } = useEmpresa()
  const { esSuperadmin } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()

  const { datos: restaurantes, cargando: cargR } = useColeccion('restaurantes')
  const [nuevoRest, setNuevoRest] = useState('')
  const [borrando, setBorrando] = useState(false)

  const permisos = PERMISOS[rol] || PERMISOS.lector

  if (!empresa) return <Cargando />

  async function agregarRestaurante(e) {
    e.preventDefault()
    if (!nuevoRest.trim()) return
    const chk = limiteRestaurantes(plan.id, restaurantes.length)
    if (!chk.permitido) { toast(chk.mensaje); navegar('/app/planes'); return }
    await addDoc(collection(db, 'restaurantes'), {
      empresaId: empresa.id, nombre: nuevoRest.trim(), creadoEl: serverTimestamp(),
    })
    setNuevoRest(''); toast('Restaurante agregado.')
  }

  async function cambiarMoneda(codigo) {
    await updateDoc(doc(db, 'empresas', empresa.id), { moneda: codigo })
    await recargar()
    toast('Moneda actualizada.')
  }

  async function borrarPrueba() {
    if (!confirm('¿Eliminar todos los artículos marcados “de prueba”? Esto no se puede deshacer.')) return
    setBorrando(true)
    try {
      const n = await eliminarArticulosPrueba(empresa.id)
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: 'Eliminó artículos de prueba', detalle: `${n} documentos`,
      })
      toast(`Listo: se eliminaron ${n} artículos de prueba.`)
    } catch (err) {
      console.error(err); toast('No se pudieron eliminar. Probá de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="stack">
      <h2>⚙️ Configuración</h2>

      {/* Plan actual */}
      <div className="card">
        <div className="row spread">
          <div>
            <h3 style={{ margin: 0 }}>Plan actual</h3>
            <div className="muted">{plan.nombre} · {plan.etiquetaPrecio}</div>
          </div>
          <Link to="/app/planes" className="btn btn-dorado" style={{ padding: '8px 14px' }}>Ver planes</Link>
        </div>
      </div>

      {/* Moneda */}
      <div className="card">
        <h3>💱 Moneda</h3>
        <div className="row row-wrap">
          {Object.values(MONEDAS).map((m) => (
            <button key={m.codigo}
              className={`btn ${empresa.moneda === m.codigo ? 'btn-dorado' : 'btn-fantasma'}`}
              onClick={() => cambiarMoneda(m.codigo)}>
              {m.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurantes (según plan) */}
      <div className="card">
        <h3>🏠 Restaurantes <span className="muted" style={{ fontSize: 13 }}>({restaurantes.length}/{plan.restaurantes})</span></h3>
        {cargR ? <p className="muted">Cargando…</p> : (
          <div className="stack">
            {restaurantes.map((r) => (
              <div key={r.id} className="row spread" style={{ borderBottom: '1px solid var(--borde)', paddingBottom: 8 }}>
                <span>{r.nombre}</span>
              </div>
            ))}
          </div>
        )}
        <form className="row mt" onSubmit={agregarRestaurante}>
          <input className="input" value={nuevoRest} onChange={(e) => setNuevoRest(e.target.value)}
            placeholder="Nombre del nuevo restaurante" />
          <button className="btn btn-dorado" type="submit">＋</button>
        </form>
      </div>

      {/* Categorías, proveedores, unidades — bloques reutilizables */}
      <ListaEditable titulo="Categorías" emoji="🏷" coleccion="categorias" recursoLimite="categorias" placeholder="Ej: Cócteles" />
      <ListaEditable titulo="Proveedores" emoji="🚚" coleccion="proveedores" recursoLimite="proveedores" placeholder="Ej: Verdulería La Fresca" />
      <ListaEditable titulo="Unidades abstractas" emoji="📏" coleccion="unidadesAbs" recursoLimite={null} placeholder={`Ej: bandeja (base: ${UNIDADES_ABSTRACTAS_BASE.join(', ')})`} />

      {/* Colaboradores (solo Empresarial) */}
      {plan.roles ? (
        <div className="card">
          <h3>👥 Colaboradores</h3>
          <p className="muted">
            Invitá colaboradores por correo y asignales un rol (editor, operador, lector).
            La gestión completa se habilita en la siguiente entrega (PR 3).
          </p>
        </div>
      ) : (
        <div className="card">
          <h3>👥 Colaboradores</h3>
          <p className="muted">Los colaboradores están disponibles en el plan Empresarial.</p>
          <Link to="/app/planes" className="btn btn-fantasma mt">Ver planes</Link>
        </div>
      )}

      {/* Eliminar artículos de prueba */}
      <div className="card">
        <h3>🗑 Artículos de prueba</h3>
        <p className="muted">Borrá solo lo que sembramos al inicio (marcado “de prueba”).</p>
        <button className="btn btn-peligro mt" onClick={borrarPrueba} disabled={borrando}>
          {borrando ? 'Eliminando…' : '🗑 Eliminar artículos de prueba'}
        </button>
      </div>

      {/* Superadmin (solo Jorge) */}
      {esSuperadmin && (
        <div className="card">
          <h3>🛡 Superadmin</h3>
          <Link to="/superadmin" className="btn btn-dorado mt">Abrir panel de superadmin</Link>
        </div>
      )}

      {!permisos.plan && (
        <p className="muted center" style={{ fontSize: 13 }}>
          Tu rol es <b>{rol}</b>. Algunas opciones solo las ve el dueño.
        </p>
      )}
    </div>
  )
}
