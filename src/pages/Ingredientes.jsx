// XMenú CR — 🧺 Ingredientes: CRUD completo.
// Proveedor obligatorio, presentación con tablas de unidades EXACTAS,
// equivalencias visibles, nota opcional, código/SKU, aviso de usos al
// editar, eliminación con confirm, import masivo desde Excel (con
// plantilla descargable) y export a Excel/PDF.
import { useMemo, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import Hoja from '../components/Hoja'
import { formatMoneda } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'
import { chequearLimite } from '../lib/limites'
import { usosDe, costoPorBase } from '../lib/costeo'
import { UNIDADES_VOLUMEN, UNIDADES_MASA, UNIDADES_ABSTRACTAS_BASE } from '../lib/constants'
import { exportarIngredientesExcel, exportarIngredientesPDF } from '../lib/exportar'
import { descargarPlantillaIngredientes, importarIngredientes } from '../lib/importar'

const VACIO = { codigo: '', nombre: '', proveedorId: '', cantPresentacion: 1, unidad: 'g', costo: '', nota: '' }

export default function Ingredientes() {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()

  const { datos: ingredientes, cargando } = useColeccion('ingredientes')
  const { datos: proveedores } = useColeccion('proveedores')
  const { datos: recetas } = useColeccion('recetas')
  const { datos: menuItems } = useColeccion('menuItems')
  const { datos: unidadesAbs } = useColeccion('unidadesAbs')

  const [editando, setEditando] = useState(null) // null | {id?, ...campos}
  const [guardando, setGuardando] = useState(false)
  const [filtroProv, setFiltroProv] = useState('')
  const [importando, setImportando] = useState(false)
  const inputImport = useRef(null)

  const provPorId = useMemo(() => Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])), [proveedores])

  const unidadesAbstractas = [
    ...UNIDADES_ABSTRACTAS_BASE,
    ...unidadesAbs.map((u) => u.nombre).filter((n) => !UNIDADES_ABSTRACTAS_BASE.includes(n)),
  ]

  if (cargando) return <Cargando />

  if (proveedores.length === 0) {
    return (
      <GuiaVacio emoji="🚚" titulo="Primero necesitás un proveedor"
        mensaje="Cada ingrediente lleva un proveedor obligatorio. Creá uno en ⚙️ Configuración y volvé aquí."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }} />
    )
  }

  async function guardar(e) {
    e.preventDefault()
    if (!editando.nombre.trim()) return toast('Poné el nombre del ingrediente.')
    if (!editando.proveedorId) return toast('El proveedor es obligatorio.')
    const costo = Number(editando.costo)
    const cant = Number(editando.cantPresentacion)
    if (!(costo >= 0) || !(cant > 0)) return toast('Revisá costo y cantidad de la presentación.')

    if (!editando.id) {
      const delProveedor = ingredientes.filter((i) => i.proveedorId === editando.proveedorId).length
      const chk = chequearLimite(plan.id, 'ingredientesPorProveedor', delProveedor)
      if (!chk.permitido) return toast(chk.mensaje)
    }

    setGuardando(true)
    try {
      const datos = {
        codigo: editando.codigo?.trim() || '',
        nombre: editando.nombre.trim(),
        proveedorId: editando.proveedorId,
        cantPresentacion: cant,
        unidad: editando.unidad,
        costo,
        nota: editando.nota?.trim() || '',
      }
      if (editando.id) {
        await updateDoc(doc(db, 'ingredientes', editando.id), datos)
      } else {
        await addDoc(collection(db, 'ingredientes'), {
          ...datos, empresaId: empresa.id, creadoEl: serverTimestamp(),
        })
      }
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: editando.id ? 'Editó ingrediente' : 'Creó ingrediente', detalle: datos.nombre,
      })
      toast('Guardado.')
      setEditando(null)
    } catch (err) {
      console.error(err); toast('No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(ing) {
    const usos = usosDe(ing.id, { recetas, menuItems })
    const detalleUsos = usos.total
      ? `\n\n⚠️ Se usa en: ${[...usos.enRecetas.map((r) => `📖 ${r.nombre}`), ...usos.enItems.map((i) => `🍽 ${i.nombre}`)].join(', ')}.\nEsos costeos quedarán marcados con error.`
      : ''
    if (!confirm(`¿Eliminar "${ing.nombre}"?${detalleUsos}`)) return
    await deleteDoc(doc(db, 'ingredientes', ing.id))
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: 'Eliminó ingrediente', detalle: ing.nombre,
    })
    toast('Eliminado.')
  }

  const lista = ingredientes.filter((i) => !filtroProv || i.proveedorId === filtroProv)
  const moneda = empresa?.moneda
  const usosDelEditando = editando?.id ? usosDe(editando.id, { recetas, menuItems }) : null

  async function alElegirArchivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    try {
      const res = await importarIngredientes({
        file, empresaId: empresa.id, planId: plan.id, proveedores, ingredientes,
      })
      let msj = `Importados: ${res.creados} ingrediente(s)`
      if (res.proveedoresNuevos) msj += ` · ${res.proveedoresNuevos} proveedor(es) nuevos`
      if (res.errores.length) msj += ` · ${res.errores.length} con error`
      toast(msj, 6000)
      if (res.errores.length) {
        console.warn('Errores de importación:', res.errores)
        alert(`Filas con problemas:\n${res.errores.slice(0, 12).map((x) => `• Fila ${x.fila}: ${x.motivo}`).join('\n')}${res.errores.length > 12 ? `\n…y ${res.errores.length - 12} más` : ''}`)
      }
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: 'Importó ingredientes', detalle: `${res.creados} creados desde Excel`,
      })
    } catch (err) {
      console.error(err); toast('No se pudo leer el archivo. ¿Es el Excel de la plantilla?')
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>🧺 Ingredientes</h2>
        <button className="btn btn-dorado" onClick={() => setEditando({ ...VACIO, proveedorId: filtroProv || '' })}>＋ Nuevo</button>
      </div>

      {/* Import / export */}
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        💡 ¿Tenés muchos ingredientes? Descargá la <b>⬇️ Plantilla</b> de Excel,
        llenala con tus productos (código/SKU, nombre, proveedor, cantidad, unidad y
        precio) y subila con <b>📥 Importar</b> — mucho más rápido que digitarlos uno
        por uno. Los proveedores que no existan se crean solos.
      </p>
      <div className="row row-wrap" style={{ gap: 8 }}>
        <input ref={inputImport} type="file" accept=".xlsx,.xls,.csv" hidden onChange={alElegirArchivo} />
        <button className="btn btn-fantasma" style={{ padding: '8px 12px' }}
          onClick={() => inputImport.current?.click()} disabled={importando}>
          {importando ? 'Importando…' : '📥 Importar Excel'}
        </button>
        <button className="btn btn-fantasma" style={{ padding: '8px 12px' }} onClick={descargarPlantillaIngredientes}>
          ⬇️ Plantilla
        </button>
        {lista.length > 0 && (
          <>
            <button className="btn btn-fantasma" style={{ padding: '8px 12px' }}
              onClick={() => exportarIngredientesExcel({ ingredientes: lista, provPorId, empresaNombre: empresa.nombre })}>
              📊 Excel
            </button>
            <button className="btn btn-fantasma" style={{ padding: '8px 12px' }}
              onClick={() => exportarIngredientesPDF({ ingredientes: lista, provPorId, empresaNombre: empresa.nombre, moneda })}>
              📄 PDF
            </button>
          </>
        )}
      </div>

      {proveedores.length > 1 && (
        <div className="chips">
          <button className={`chip ${!filtroProv ? 'activa' : ''}`} onClick={() => setFiltroProv('')}>Todos</button>
          {proveedores.map((p) => (
            <button key={p.id} className={`chip ${filtroProv === p.id ? 'activa' : ''}`}
              onClick={() => setFiltroProv(filtroProv === p.id ? '' : p.id)}>🚚 {p.nombre}</button>
          ))}
        </div>
      )}

      {lista.length === 0 && (
        <GuiaVacio emoji="🧺" titulo="Agregá tu primer ingrediente"
          mensaje="Tocá ＋ Nuevo: elegí proveedor, presentación (cantidad + unidad) y costo. Con eso ya se puede costear." />
      )}

      {lista.map((ing) => (
        <div key={ing.id} className="card" style={{ padding: 12 }}>
          <div className="row spread">
            <div>
              <div style={{ fontWeight: 700 }}>{ing.nombre} {ing.dePrueba && <span className="pill pill-gris">prueba</span>}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {ing.codigo && <>🏷 {ing.codigo} · </>}
                🚚 {provPorId[ing.proveedorId] || '⚠️ sin proveedor'} · {ing.cantPresentacion} {ing.unidad}
                {ing.nota && <> · 📝 {ing.nota}</>}
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="pill pill-dorado">{formatMoneda(ing.costo, moneda)}</span>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }} onClick={() => setEditando({ ...VACIO, ...ing })}>✏️</button>
              <button className="btn btn-fantasma" style={{ padding: '4px 10px' }} onClick={() => eliminar(ing)}>🗑</button>
            </div>
          </div>
        </div>
      ))}

      <Hoja titulo={editando?.id ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        abierta={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <form onSubmit={guardar} className="stack">
            {usosDelEditando?.total > 0 && (
              <div className="aviso aviso-info" style={{ fontSize: 13 }}>
                ⚠️ Este ingrediente se usa en {usosDelEditando.total} lugar(es):{' '}
                {[...usosDelEditando.enRecetas.map((r) => `📖 ${r.nombre}`), ...usosDelEditando.enItems.map((i) => `🍽 ${i.nombre}`)].join(', ')}.
                Al cambiar el precio, esos costeos se recalculan solos.
              </div>
            )}
            <div className="row" style={{ gap: 8 }}>
              <label className="campo" style={{ flex: 2 }}>
                <span>Nombre</span>
                <input className="input" value={editando.nombre} autoFocus
                  onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  placeholder="Ej: Ron blanco" />
              </label>
              <label className="campo" style={{ flex: 1 }}>
                <span>Código / SKU (opcional)</span>
                <input className="input" value={editando.codigo || ''}
                  onChange={(e) => setEditando({ ...editando, codigo: e.target.value })}
                  placeholder="RON-750" />
              </label>
            </div>
            <label className="campo">
              <span>Proveedor (obligatorio)</span>
              <select className="input" value={editando.proveedorId}
                onChange={(e) => setEditando({ ...editando, proveedorId: e.target.value })}>
                <option value="">Elegí un proveedor…</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            <div className="row" style={{ gap: 8 }}>
              <label className="campo" style={{ flex: 1 }}>
                <span>Presentación: cantidad</span>
                <input className="input" type="number" inputMode="decimal" min="0" step="any"
                  value={editando.cantPresentacion}
                  onChange={(e) => setEditando({ ...editando, cantPresentacion: e.target.value })} />
              </label>
              <label className="campo" style={{ flex: 1.4 }}>
                <span>Unidad</span>
                <select className="input" value={editando.unidad}
                  onChange={(e) => setEditando({ ...editando, unidad: e.target.value })}>
                  <optgroup label="Masa (base g)">
                    {Object.entries(UNIDADES_MASA).map(([u, f]) => (
                      <option key={u} value={u}>{u === 'g' ? 'g' : `${u} (${f} g)`}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Volumen (base mL)">
                    {Object.entries(UNIDADES_VOLUMEN).map(([u, f]) => (
                      <option key={u} value={u}>{u === 'mL' ? 'mL' : `${u} (${f} mL)`}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Abstractas (sin conversión)">
                    {unidadesAbstractas.map((u) => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                </select>
              </label>
            </div>
            <label className="campo">
              <span>Costo de esa presentación</span>
              <input className="input" type="number" inputMode="decimal" min="0" step="any"
                value={editando.costo}
                onChange={(e) => setEditando({ ...editando, costo: e.target.value })}
                placeholder="Ej: 6500" />
            </label>
            {Number(editando.costo) > 0 && Number(editando.cantPresentacion) > 0 && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                ≈ {formatMoneda(costoPorBase({ ...editando, costo: Number(editando.costo), cantPresentacion: Number(editando.cantPresentacion) }), moneda)} por unidad base.
              </p>
            )}
            <label className="campo">
              <span>Nota (opcional)</span>
              <input className="input" value={editando.nota || ''}
                onChange={(e) => setEditando({ ...editando, nota: e.target.value })}
                placeholder='Ej: "lata de 4.1", "viene en saco"' />
            </label>
            <button className="btn btn-dorado btn-bloque" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        )}
      </Hoja>
    </div>
  )
}
