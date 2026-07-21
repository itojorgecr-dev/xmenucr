// XMenú CR — 🚚 Proveedores: ficha completa (contacto, correo, WhatsApp,
// dirección, días/jornadas de entrega) + lista de precios (copiable;
// exportable a Excel/PDF en PR 4). Se llega desde ⚙️ Configuración.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import Cargando from '../components/Cargando'
import GuiaVacio from '../components/GuiaVacio'
import Hoja from '../components/Hoja'
import { formatMoneda } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'
import { chequearLimite } from '../lib/limites'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const VACIO = { nombre: '', contacto: '', correo: '', whatsapp: '', direccion: '', diasEntrega: [], jornada: '' }

export default function Proveedores() {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()

  const { datos: proveedores, cargando } = useColeccion('proveedores')
  const { datos: ingredientes } = useColeccion('ingredientes')

  const [editando, setEditando] = useState(null)
  const [listaDe, setListaDe] = useState(null) // proveedor para lista de precios
  const [guardando, setGuardando] = useState(false)

  const ingredientesDe = useMemo(() => {
    if (!listaDe) return []
    return ingredientes
      .filter((i) => i.proveedorId === listaDe.id)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
  }, [listaDe, ingredientes])

  if (cargando) return <Cargando />

  async function guardar(e) {
    e.preventDefault()
    if (!editando.nombre.trim()) return toast('Poné el nombre del proveedor.')
    if (!editando.id) {
      const chk = chequearLimite(plan.id, 'proveedores', proveedores.length)
      if (!chk.permitido) return toast(chk.mensaje)
    }
    setGuardando(true)
    try {
      const datos = {
        nombre: editando.nombre.trim(),
        contacto: editando.contacto?.trim() || '',
        correo: editando.correo?.trim() || '',
        whatsapp: editando.whatsapp?.trim() || '',
        direccion: editando.direccion?.trim() || '',
        diasEntrega: editando.diasEntrega || [],
        jornada: editando.jornada?.trim() || '',
      }
      if (editando.id) {
        await updateDoc(doc(db, 'proveedores', editando.id), datos)
      } else {
        await addDoc(collection(db, 'proveedores'), { ...datos, empresaId: empresa.id, creadoEl: serverTimestamp() })
      }
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: editando.id ? 'Editó proveedor' : 'Creó proveedor', detalle: datos.nombre,
      })
      toast('Guardado.')
      setEditando(null)
    } catch (err) {
      console.error(err); toast('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(p) {
    const usados = ingredientes.filter((i) => i.proveedorId === p.id).length
    const aviso = usados ? `\n\n⚠️ Tiene ${usados} ingrediente(s) asociados que quedarán sin proveedor.` : ''
    if (!confirm(`¿Eliminar al proveedor "${p.nombre}"?${aviso}`)) return
    await deleteDoc(doc(db, 'proveedores', p.id))
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: 'Eliminó proveedor', detalle: p.nombre,
    })
    toast('Eliminado.')
  }

  async function copiarLista() {
    const texto = [
      `LISTA DE PRECIOS — ${listaDe.nombre}`,
      `${empresa?.nombre || ''} · ${new Date().toLocaleDateString('es-CR')}`,
      '',
      ...ingredientesDe.map((i) =>
        `• ${i.nombre} — ${i.cantPresentacion} ${i.unidad} — ${formatMoneda(i.costo, empresa?.moneda)}${i.nota ? ` (${i.nota})` : ''}`),
    ].join('\n')
    try {
      await navigator.clipboard.writeText(texto)
      toast('Lista copiada al portapapeles.')
    } catch {
      toast('No se pudo copiar.')
    }
  }

  function toggleDia(d) {
    const dias = editando.diasEntrega || []
    setEditando({
      ...editando,
      diasEntrega: dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d],
    })
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>🚚 Proveedores</h2>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/app/config" className="btn btn-fantasma" style={{ padding: '8px 12px' }}>← Config</Link>
          <button className="btn btn-dorado" onClick={() => setEditando({ ...VACIO })}>＋ Nuevo</button>
        </div>
      </div>

      {proveedores.length === 0 && (
        <GuiaVacio emoji="🚚" titulo="Agregá tu primer proveedor"
          mensaje="La ficha completa guarda contacto, correo, WhatsApp, dirección y días de entrega." />
      )}

      {proveedores.map((p) => (
        <div key={p.id} className="card" style={{ padding: 12 }}>
          <div className="row spread">
            <div>
              <div style={{ fontWeight: 700 }}>{p.nombre} {p.dePrueba && <span className="pill pill-gris">prueba</span>}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {p.contacto && <>📞 {p.contacto} · </>}
                {p.correo && <>✉️ {p.correo} · </>}
                {p.whatsapp && <>💬 {p.whatsapp}</>}
              </div>
              {p.direccion && <div className="muted" style={{ fontSize: 12 }}>📍 {p.direccion}</div>}
              {(p.diasEntrega?.length || p.jornada) && (
                <div className="muted" style={{ fontSize: 12 }}>
                  🗓 {p.diasEntrega?.join(', ')}{p.jornada && ` · ${p.jornada}`}
                </div>
              )}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }} title="Lista de precios"
                onClick={() => setListaDe(p)}>💲</button>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }}
                onClick={() => setEditando({ ...VACIO, ...p, diasEntrega: p.diasEntrega || [] })}>✏️</button>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }} onClick={() => eliminar(p)}>🗑</button>
            </div>
          </div>
        </div>
      ))}

      {/* Ficha del proveedor */}
      <Hoja titulo={editando?.id ? 'Editar proveedor' : 'Nuevo proveedor'}
        abierta={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <form onSubmit={guardar} className="stack">
            <label className="campo">
              <span>Nombre</span>
              <input className="input" value={editando.nombre} autoFocus
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                placeholder="Ej: Distribuidora MICA" />
            </label>
            <div className="row" style={{ gap: 8 }}>
              <label className="campo" style={{ flex: 1 }}>
                <span>Teléfono de contacto</span>
                <input className="input" value={editando.contacto}
                  onChange={(e) => setEditando({ ...editando, contacto: e.target.value })} placeholder="8888-0000" />
              </label>
              <label className="campo" style={{ flex: 1 }}>
                <span>WhatsApp</span>
                <input className="input" value={editando.whatsapp}
                  onChange={(e) => setEditando({ ...editando, whatsapp: e.target.value })} placeholder="8888-0000" />
              </label>
            </div>
            <label className="campo">
              <span>Correo (aquí llegará el pedido)</span>
              <input className="input" type="email" value={editando.correo}
                onChange={(e) => setEditando({ ...editando, correo: e.target.value })} placeholder="pedidos@proveedor.com" />
            </label>
            <label className="campo">
              <span>Dirección</span>
              <input className="input" value={editando.direccion}
                onChange={(e) => setEditando({ ...editando, direccion: e.target.value })} placeholder="San José, …" />
            </label>
            <label className="campo">
              <span>Días de entrega</span>
              <div className="chips" style={{ padding: 0 }}>
                {DIAS.map((d) => (
                  <button key={d} type="button"
                    className={`chip ${editando.diasEntrega?.includes(d) ? 'activa' : ''}`}
                    onClick={() => toggleDia(d)}>{d.slice(0, 3)}</button>
                ))}
              </div>
            </label>
            <label className="campo">
              <span>Jornada (opcional)</span>
              <input className="input" value={editando.jornada}
                onChange={(e) => setEditando({ ...editando, jornada: e.target.value })}
                placeholder="Ej: mañanas de 6 a 11" />
            </label>
            <button className="btn btn-dorado btn-bloque" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar proveedor'}
            </button>
          </form>
        )}
      </Hoja>

      {/* Lista de precios */}
      <Hoja titulo={`💲 Lista de precios — ${listaDe?.nombre || ''}`}
        abierta={Boolean(listaDe)} onCerrar={() => setListaDe(null)}>
        {listaDe && (
          <div className="stack">
            {ingredientesDe.length === 0 && <p className="muted center">Sin ingredientes registrados para este proveedor.</p>}
            {ingredientesDe.map((i) => (
              <div key={i.id} className="row spread" style={{ borderBottom: '1px solid var(--borde)', paddingBottom: 6 }}>
                <span>{i.nombre} <span className="muted" style={{ fontSize: 12 }}>{i.cantPresentacion} {i.unidad}{i.nota ? ` · 📝 ${i.nota}` : ''}</span></span>
                <b>{formatMoneda(i.costo, empresa?.moneda)}</b>
              </div>
            ))}
            {ingredientesDe.length > 0 && (
              <button className="btn btn-dorado btn-bloque" onClick={copiarLista}>📋 Copiar lista</button>
            )}
            <p className="muted" style={{ fontSize: 12 }}>La exportación a Excel/PDF llega en la siguiente entrega.</p>
          </div>
        )}
      </Hoja>
    </div>
  )
}
