// XMenú CR — Constructor de ítem de menú.
// ＋ Agregar componente (hoja con buscador alfabético), costeo EN VIVO,
// mano de obra opcional, 🤖 IA que acomoda la preparación y 📸 foto
// (compresión + Storage).
import { useMemo, useRef, useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import EditorComponentes from '../components/EditorComponentes'
import { formatMoneda, formatPorcentaje } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'
import { chequearLimite } from '../lib/limites'
import { costoItem } from '../lib/costeo'
import { subirFotoItem } from '../lib/fotos'

export default function ItemEditor({ item, onCerrar, contexto }) {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()
  const { menuItems, categorias, restaurantes, ingredientes, recetas, mapas } = contexto

  const [form, setForm] = useState({
    nombre: item.nombre || '',
    restauranteId: item.restauranteId || restaurantes[0]?.id || '',
    categoria: item.categoria || '',
    precioVenta: item.precioVenta ?? '',
    manoObra: item.manoObra ?? '',
    preparacion: item.preparacion || '',
    componentes: item.componentes || [],
    fotoUrl: item.fotoUrl || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [acomodando, setAcomodando] = useState(false)
  const inputFoto = useRef(null)

  const costeo = useMemo(
    () => costoItem({ ...form, precioVenta: Number(form.precioVenta) || 0, manoObra: Number(form.manoObra) || 0 }, mapas),
    [form, mapas]
  )
  const moneda = empresa?.moneda

  function set(campos) { setForm((f) => ({ ...f, ...campos })) }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return toast('Poné el nombre del ítem.')
    if (!form.categoria) return toast('Elegí una categoría (o creala en ⚙️ Configuración).')
    if (!form.restauranteId) return toast('Elegí el restaurante.')
    if (!item.id) {
      const chk = chequearLimite(plan.id, 'menuItems', menuItems.length)
      if (!chk.permitido) return toast(chk.mensaje)
    }
    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        restauranteId: form.restauranteId,
        categoria: form.categoria,
        precioVenta: Number(form.precioVenta) || 0,
        manoObra: Number(form.manoObra) || 0,
        preparacion: form.preparacion.trim(),
        componentes: form.componentes.map((c) => ({
          tipo: c.tipo, refId: c.refId, cantidad: Number(c.cantidad) || 0, unidad: c.unidad,
        })),
        fotoUrl: form.fotoUrl || '',
      }
      if (item.id) {
        await updateDoc(doc(db, 'menuItems', item.id), datos)
      } else {
        await addDoc(collection(db, 'menuItems'), { ...datos, empresaId: empresa.id, creadoEl: serverTimestamp() })
      }
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: item.id ? 'Editó ítem de menú' : 'Creó ítem de menú', detalle: datos.nombre,
      })
      toast('Guardado.')
      onCerrar()
    } catch (err) {
      console.error(err); toast('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function elegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoFoto(true)
    try {
      // La foto se guarda por id de ítem; si es nuevo, usamos un id temporal
      // estable basado en el nombre para no dejar archivos huérfanos.
      const itemId = item.id || `nuevo-${(form.nombre || 'item').replace(/\W+/g, '-').toLowerCase()}`
      const url = await subirFotoItem({ empresaId: empresa.id, itemId, file })
      set({ fotoUrl: url })
      toast('Foto subida.')
    } catch (err) {
      console.error(err); toast('No se pudo subir la foto.')
    } finally {
      setSubiendoFoto(false)
      e.target.value = ''
    }
  }

  // 🤖 Manda la preparación desordenada a /api/ia y la reemplaza acomodada.
  async function acomodarPreparacion() {
    const texto = form.preparacion.trim()
    if (!texto) return toast('Escribí (o dictá) la preparación primero.')
    setAcomodando(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const resp = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto }),
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(json.error || 'Error de la IA')
      if (json.preparacion) {
        set({ preparacion: json.preparacion })
        toast('¡Preparación acomodada! 🤖')
      }
    } catch (err) {
      console.error(err)
      toast(err.message || 'No se pudo acomodar. Probá de nuevo.')
    } finally {
      setAcomodando(false)
    }
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>{item.id ? '✏️ Editar ítem' : '＋ Nuevo ítem'}</h2>
        <button className="btn btn-fantasma" onClick={onCerrar}>← Volver</button>
      </div>

      <form onSubmit={guardar} className="stack">
        <label className="campo">
          <span>Nombre</span>
          <input className="input" value={form.nombre} autoFocus={!item.id}
            onChange={(e) => set({ nombre: e.target.value })} placeholder="Ej: Mojito clásico" />
        </label>

        <div className="row" style={{ gap: 8 }}>
          <label className="campo" style={{ flex: 1 }}>
            <span>Restaurante</span>
            <select className="input" value={form.restauranteId} onChange={(e) => set({ restauranteId: e.target.value })}>
              {restaurantes.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </label>
          <label className="campo" style={{ flex: 1 }}>
            <span>Categoría</span>
            <select className="input" value={form.categoria} onChange={(e) => set({ categoria: e.target.value })}>
              <option value="">Elegí…</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <label className="campo" style={{ flex: 1 }}>
            <span>Precio de venta</span>
            <input className="input" type="number" inputMode="decimal" min="0" step="any"
              value={form.precioVenta} onChange={(e) => set({ precioVenta: e.target.value })} placeholder="3500" />
          </label>
          <label className="campo" style={{ flex: 1 }}>
            <span>Mano de obra (opcional)</span>
            <input className="input" type="number" inputMode="decimal" min="0" step="any"
              value={form.manoObra} onChange={(e) => set({ manoObra: e.target.value })} placeholder="0" />
          </label>
        </div>

        <h3 style={{ margin: '4px 0 0' }}>Componentes</h3>
        <EditorComponentes
          componentes={form.componentes}
          onCambiar={(componentes) => set({ componentes })}
          ingredientes={ingredientes} recetas={recetas} mapas={mapas} />

        {/* Costeo EN VIVO */}
        <div className="aviso aviso-info">
          <div className="row spread"><span>Costo componentes</span><b>{formatMoneda(costeo.costoComponentes, moneda)}</b></div>
          {costeo.manoObra > 0 && (
            <div className="row spread"><span>Mano de obra</span><b>{formatMoneda(costeo.manoObra, moneda)}</b></div>
          )}
          <div className="row spread"><span>Costo total</span><b>{formatMoneda(costeo.costo, moneda)}</b></div>
          <div className="row spread"><span>Utilidad</span>
            <b style={{ color: costeo.utilidad >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
              {formatMoneda(costeo.utilidad, moneda)} ({formatPorcentaje(costeo.pctCosto)} costo)
            </b>
          </div>
          {costeo.error && <div style={{ color: 'var(--rojo)', fontSize: 13 }}>⚠️ {costeo.error}</div>}
        </div>

        <label className="campo">
          <span>Preparación (escribila o dictala desordenada y la IA la acomoda)</span>
          <textarea className="input" rows={5} value={form.preparacion}
            onChange={(e) => set({ preparacion: e.target.value })}
            placeholder="Ej: hielo hasta arriba, 12 hojas de hierbabuena macerar suave, ron 60 mL, ginger de garnish, azúcar 2 tsp primero…" />
        </label>
        <button className="btn btn-fantasma btn-bloque" type="button"
          onClick={acomodarPreparacion} disabled={acomodando}>
          {acomodando ? '🤖 Acomodando…' : '🤖 Acomodar preparación con IA'}
        </button>

        {/* 📸 Foto */}
        {form.fotoUrl && <img className="foto-item" src={form.fotoUrl} alt="Foto del platillo" />}
        <input ref={inputFoto} type="file" accept="image/*" hidden onChange={elegirFoto} />
        <button className="btn btn-fantasma btn-bloque" type="button"
          onClick={() => inputFoto.current?.click()} disabled={subiendoFoto}>
          {subiendoFoto ? 'Subiendo…' : form.fotoUrl ? '📸 Cambiar foto' : '📸 Agregar foto del platillo'}
        </button>

        <button className="btn btn-dorado btn-bloque" type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar ítem'}
        </button>
      </form>
    </div>
  )
}
