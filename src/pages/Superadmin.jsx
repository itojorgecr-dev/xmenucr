// XMenú CR — 🛡 Panel de superadmin (solo Jorge).
// Funcional: ver TODAS las empresas y cambiarles el plan, y revisar los
// avisos de "Ya pagué" (aplicar el plan o descartarlos).
// Los catálogos maestros de proveedores llegan en PR 5.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, getDocs, doc, updateDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import Cargando from '../components/Cargando'
import { PLANES, ORDEN_PLANES } from '../lib/constants'
import { formatFecha } from '../lib/format'

export default function Superadmin() {
  const { esSuperadmin, user, salir } = useAuth()
  const toast = useToast()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [empresas, setEmpresas] = useState([])
  const [avisos, setAvisos] = useState([])
  const [filtro, setFiltro] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [snapEmp, snapAvisos] = await Promise.all([
        getDocs(collection(db, 'empresas')),
        getDocs(query(collection(db, 'invitaciones'), where('tipo', '==', 'aviso_pago'))),
      ])
      setEmpresas(
        snapEmp.docs.map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.creadaEl?.seconds || 0) - (a.creadaEl?.seconds || 0))
      )
      setAvisos(
        snapAvisos.docs.map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.creadoEl?.seconds || 0) - (a.creadoEl?.seconds || 0))
      )
    } catch (e) {
      console.error(e)
      if (e?.code === 'permission-denied') {
        setError('Tu sesión todavía no tiene el permiso de superadmin aplicado. Salí de la app, volvé a entrar con itojorgecr@gmail.com y abrí el panel de nuevo.')
      } else {
        setError('No se pudieron cargar los datos. Probá de nuevo.')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { if (esSuperadmin) cargar() }, [esSuperadmin, cargar])

  if (!esSuperadmin) {
    return (
      <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        <div className="aviso aviso-peligro">
          <h3>Acceso restringido</h3>
          <p>Este panel es solo para el superadministrador.</p>
          <Link to="/app" className="btn btn-fantasma mt">← Volver a la app</Link>
        </div>
      </div>
    )
  }

  async function cambiarPlan(empresa, planId) {
    if (planId === empresa.plan) return
    if (!confirm(`¿Cambiar "${empresa.nombre}" de ${PLANES[empresa.plan]?.nombre || empresa.plan} a ${PLANES[planId].nombre}?`)) return
    try {
      await updateDoc(doc(db, 'empresas', empresa.id), {
        plan: planId, estadoPago: 'al_dia', planCambiadoEl: serverTimestamp(),
      })
      setEmpresas((arr) => arr.map((e) => (e.id === empresa.id ? { ...e, plan: planId } : e)))
      toast(`"${empresa.nombre}" ahora es ${PLANES[planId].nombre}. ✅`)
    } catch (e) {
      console.error(e); toast('No se pudo cambiar el plan.')
    }
  }

  async function resolverAviso(aviso, aplicar) {
    try {
      if (aplicar) {
        await updateDoc(doc(db, 'empresas', aviso.empresaId), {
          plan: aviso.planDestino, estadoPago: 'al_dia', planCambiadoEl: serverTimestamp(),
        })
        setEmpresas((arr) => arr.map((e) => (e.id === aviso.empresaId ? { ...e, plan: aviso.planDestino } : e)))
      }
      await updateDoc(doc(db, 'invitaciones', aviso.id), {
        estado: aplicar ? 'aplicado' : 'descartado', resueltoEl: serverTimestamp(),
      })
      setAvisos((arr) => arr.map((a) => (a.id === aviso.id ? { ...a, estado: aplicar ? 'aplicado' : 'descartado' } : a)))
      toast(aplicar ? `Plan ${PLANES[aviso.planDestino]?.nombre} activado. ✅` : 'Aviso descartado.')
    } catch (e) {
      console.error(e); toast('No se pudo resolver el aviso.')
    }
  }

  const empresaPorId = Object.fromEntries(empresas.map((e) => [e.id, e]))
  const pendientes = avisos.filter((a) => a.estado === 'pendiente')
  const listaEmpresas = empresas.filter((e) =>
    !filtro || (e.nombre || '').toLocaleLowerCase('es').includes(filtro.toLocaleLowerCase('es')))

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }} className="stack">
      <div className="row spread">
        <h2>🛡 Panel de superadmin</h2>
        <Link to="/app" className="btn btn-fantasma" style={{ padding: '8px 12px' }}>← App</Link>
      </div>
      <p className="muted" style={{ marginTop: -6 }}>Sesión: {user?.email}</p>

      {error && (
        <div className="aviso aviso-peligro">
          <p style={{ margin: 0 }}>{error}</p>
          <div className="row mt" style={{ gap: 8 }}>
            <button className="btn btn-fantasma" onClick={cargar}>↻ Reintentar</button>
            <button className="btn btn-fantasma" onClick={salir}>Salir para renovar sesión</button>
          </div>
        </div>
      )}

      {cargando && <Cargando texto="Cargando empresas…" />}

      {!cargando && !error && (
        <>
          {/* Avisos de pago pendientes */}
          <div className="card" style={pendientes.length ? { borderColor: 'var(--dorado)' } : undefined}>
            <h3>💳 Avisos de pago {pendientes.length > 0 && <span className="pill pill-dorado">{pendientes.length} pendientes</span>}</h3>
            {pendientes.length === 0 && <p className="muted">No hay avisos de "Ya pagué" pendientes.</p>}
            {pendientes.map((a) => (
              <div key={a.id} className="row spread row-wrap" style={{ borderBottom: '1px solid var(--borde)', padding: '8px 0' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{empresaPorId[a.empresaId]?.nombre || a.empresaId}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {a.correo} · {PLANES[a.planActual]?.nombre || a.planActual} → <b>{PLANES[a.planDestino]?.nombre || a.planDestino}</b> · {formatFecha(a.creadoEl)}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-dorado" style={{ padding: '6px 12px' }} onClick={() => resolverAviso(a, true)}>
                    ✅ Aplicar plan
                  </button>
                  <button className="btn btn-fantasma" style={{ padding: '6px 12px' }} onClick={() => resolverAviso(a, false)}>
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empresas y planes */}
          <div className="card">
            <h3>🏢 Empresas ({empresas.length})</h3>
            {empresas.length > 3 && (
              <input className="input" placeholder="Buscar empresa…" value={filtro}
                onChange={(e) => setFiltro(e.target.value)} style={{ marginBottom: 10 }} />
            )}
            {listaEmpresas.map((e) => (
              <div key={e.id} className="row spread row-wrap" style={{ borderBottom: '1px solid var(--borde)', padding: '8px 0' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.nombre}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Creada {formatFecha(e.creadaEl)} · moneda {e.moneda || 'CRC'}
                  </div>
                </div>
                <select className="input" style={{ maxWidth: 170 }} value={e.plan}
                  onChange={(ev) => cambiarPlan(e, ev.target.value)}>
                  {ORDEN_PLANES.map((p) => (
                    <option key={p} value={p}>{PLANES[p].nombre} — {PLANES[p].etiquetaPrecio}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Catálogos (PR 5) */}
          <div className="card">
            <h3>🗂 Catálogos maestros de proveedores</h3>
            <p className="muted">Importar catálogos (MICA, Belca…), diff de precios y publicación a las empresas conectadas — llega en la fase de catálogos (PR 5).</p>
          </div>
        </>
      )}
    </div>
  )
}
