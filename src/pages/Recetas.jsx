// XMenú CR — 📖 Recetas base: costeo total → servicios → costo por servicio.
// Anidables (una receta puede llevar otra) y con "usada en".
import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import Hoja from '../components/Hoja'
import EditorComponentes from '../components/EditorComponentes'
import { formatMoneda } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'
import { chequearLimite } from '../lib/limites'
import { costoReceta, porId, usosDe } from '../lib/costeo'

const VACIA = { nombre: '', servicios: 1, componentes: [], nota: '' }

export default function Recetas() {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()

  const { datos: recetas, cargando } = useColeccion('recetas')
  const { datos: ingredientes } = useColeccion('ingredientes')
  const { datos: menuItems } = useColeccion('menuItems')

  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const mapas = useMemo(() => ({ ingredientes: porId(ingredientes), recetas: porId(recetas) }), [ingredientes, recetas])

  if (cargando) return <Cargando />

  async function guardar(e) {
    e.preventDefault()
    if (!editando.nombre.trim()) return toast('Poné el nombre de la receta.')
    const servicios = Number(editando.servicios)
    if (!(servicios > 0)) return toast('Los servicios deben ser mayores a 0.')
    if (!editando.id) {
      const chk = chequearLimite(plan.id, 'recetas', recetas.length)
      if (!chk.permitido) return toast(chk.mensaje)
    }
    setGuardando(true)
    try {
      const datos = {
        nombre: editando.nombre.trim(),
        servicios,
        componentes: (editando.componentes || []).map((c) => ({
          tipo: c.tipo, refId: c.refId, cantidad: Number(c.cantidad) || 0, unidad: c.unidad,
        })),
        nota: editando.nota?.trim() || '',
      }
      if (editando.id) {
        await updateDoc(doc(db, 'recetas', editando.id), datos)
      } else {
        await addDoc(collection(db, 'recetas'), { ...datos, empresaId: empresa.id, creadoEl: serverTimestamp() })
      }
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: editando.id ? 'Editó receta' : 'Creó receta', detalle: datos.nombre,
      })
      toast('Guardada.')
      setEditando(null)
    } catch (err) {
      console.error(err); toast('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(receta) {
    const usos = usosDe(receta.id, { recetas, menuItems })
    const detalle = usos.total
      ? `\n\n⚠️ Se usa en: ${[...usos.enRecetas.map((r) => `📖 ${r.nombre}`), ...usos.enItems.map((i) => `🍽 ${i.nombre}`)].join(', ')}.`
      : ''
    if (!confirm(`¿Eliminar la receta "${receta.nombre}"?${detalle}`)) return
    await deleteDoc(doc(db, 'recetas', receta.id))
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: 'Eliminó receta', detalle: receta.nombre,
    })
    toast('Eliminada.')
  }

  const moneda = empresa?.moneda
  const costeoEnVivo = editando
    ? costoReceta({ ...editando, id: editando.id || '__nueva__', servicios: Number(editando.servicios) || 1 }, mapas)
    : null

  return (
    <div className="stack">
      <div className="row spread">
        <h2>📖 Recetas base</h2>
        <button className="btn btn-dorado" onClick={() => setEditando({ ...VACIA })}>＋ Nueva</button>
      </div>

      {recetas.length === 0 && (
        <GuiaVacio emoji="📖" titulo="Todavía no hay recetas base"
          mensaje="Una receta base agrupa ingredientes (o otras recetas) y te da un costo por servicio para reutilizar en tus ítems. Tocá ＋ Nueva." />
      )}

      {recetas.map((r) => {
        const c = costoReceta(r, mapas)
        const usos = usosDe(r.id, { recetas, menuItems })
        return (
          <div key={r.id} className="card" style={{ padding: 12 }}>
            <div className="row spread">
              <div>
                <div style={{ fontWeight: 700 }}>{r.nombre} {r.dePrueba && <span className="pill pill-gris">prueba</span>}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {formatMoneda(c.costoTotal, moneda)} ÷ {r.servicios || 1} servicios
                  {r.nota && <> · 📝 {r.nota}</>}
                  {c.error && <> · <span style={{ color: 'var(--rojo)' }}>⚠️ {c.error}</span></>}
                </div>
                {usos.total > 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    Usada en: {[...usos.enRecetas.map((x) => `📖 ${x.nombre}`), ...usos.enItems.map((x) => `🍽 ${x.nombre}`)].join(', ')}
                  </div>
                )}
              </div>
              <div className="row" style={{ gap: 6 }}>
                <span className="pill pill-dorado" style={{ whiteSpace: 'nowrap' }}>
                  {formatMoneda(c.costoPorServicio, moneda)}/serv
                </span>
                <button className="btn btn-fantasma" style={{ padding: '4px 10px' }}
                  onClick={() => setEditando({ ...VACIA, ...r, componentes: r.componentes || [] })}>✏️</button>
                <button className="btn btn-fantasma" style={{ padding: '4px 10px' }} onClick={() => eliminar(r)}>🗑</button>
              </div>
            </div>
          </div>
        )
      })}

      <Hoja titulo={editando?.id ? 'Editar receta' : 'Nueva receta'}
        abierta={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <form onSubmit={guardar} className="stack">
            <label className="campo">
              <span>Nombre</span>
              <input className="input" value={editando.nombre} autoFocus
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                placeholder="Ej: Almíbar simple" />
            </label>
            <div className="row" style={{ gap: 8 }}>
              <label className="campo" style={{ flex: 1 }}>
                <span>Servicios que rinde</span>
                <input className="input" type="number" inputMode="decimal" min="0" step="any"
                  value={editando.servicios}
                  onChange={(e) => setEditando({ ...editando, servicios: e.target.value })} />
              </label>
              <label className="campo" style={{ flex: 1.4 }}>
                <span>Nota (opcional)</span>
                <input className="input" value={editando.nota || ''}
                  onChange={(e) => setEditando({ ...editando, nota: e.target.value })}
                  placeholder="Ej: base para cócteles" />
              </label>
            </div>

            <h3 style={{ margin: '4px 0 0' }}>Componentes</h3>
            <EditorComponentes
              componentes={editando.componentes || []}
              onCambiar={(componentes) => setEditando({ ...editando, componentes })}
              ingredientes={ingredientes} recetas={recetas} mapas={mapas}
              excluirRecetaId={editando.id} />

            {/* Costeo en vivo */}
            <div className="aviso aviso-info">
              <div className="row spread"><span>Costo total</span><b>{formatMoneda(costeoEnVivo.costoTotal, moneda)}</b></div>
              <div className="row spread"><span>÷ {Number(editando.servicios) || 1} servicios</span>
                <b style={{ color: 'var(--dorado)' }}>{formatMoneda(costeoEnVivo.costoPorServicio, moneda)} por servicio</b></div>
              {costeoEnVivo.error && <div style={{ color: 'var(--rojo)', fontSize: 13 }}>⚠️ {costeoEnVivo.error}</div>}
            </div>

            <button className="btn btn-dorado btn-bloque" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar receta'}
            </button>
          </form>
        )}
      </Hoja>
    </div>
  )
}
