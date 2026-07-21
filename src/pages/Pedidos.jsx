// XMenú CR — 🛒 Pedidos: carrito por proveedor con buscador y −/＋,
// toggle con/sin precios, copiar texto y guardar el pedido.
// (Enviar por correo vía Resend y exportar Excel llegan en PR 4.)
import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import { formatMoneda, formatFecha } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'

export default function Pedidos() {
  const { user } = useAuth()
  const { empresa } = useEmpresa()
  const toast = useToast()

  const { datos: proveedores, cargando } = useColeccion('proveedores')
  const { datos: ingredientes } = useColeccion('ingredientes')
  const { datos: pedidos } = useColeccion('pedidos', { orderByNombre: false })

  const [proveedorId, setProveedorId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState({}) // {ingredienteId: cantidad}
  const [conPrecios, setConPrecios] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const proveedor = proveedores.find((p) => p.id === proveedorId)
  const delProveedor = useMemo(() => {
    const t = busqueda.trim().toLocaleLowerCase('es')
    return ingredientes
      .filter((i) => i.proveedorId === proveedorId)
      .filter((i) => !t || (i.nombre || '').toLocaleLowerCase('es').includes(t))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
  }, [ingredientes, proveedorId, busqueda])

  if (cargando) return <Cargando />

  if (proveedores.length === 0) {
    return (
      <GuiaVacio emoji="🚚" titulo="Necesitás proveedores para hacer pedidos"
        mensaje="Creá un proveedor en ⚙️ Configuración y después armá el pedido con sus ingredientes."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }} />
    )
  }

  function cambiar(id, delta) {
    setCarrito((c) => {
      const n = Math.max(0, (c[id] || 0) + delta)
      const copia = { ...c }
      if (n === 0) delete copia[id]
      else copia[id] = n
      return copia
    })
  }

  const lineas = Object.entries(carrito)
    .map(([id, cant]) => ({ ing: ingredientes.find((i) => i.id === id), cant }))
    .filter((l) => l.ing)
  const total = lineas.reduce((s, l) => s + l.cant * (Number(l.ing.costo) || 0), 0)
  const moneda = empresa?.moneda

  function textoPedido() {
    const enc = `PEDIDO — ${empresa?.nombre || ''}\nProveedor: ${proveedor?.nombre || ''}\nFecha: ${new Date().toLocaleDateString('es-CR')}\n`
    const cuerpo = lineas.map((l) => {
      const base = `• ${l.ing.nombre} — ${l.cant} × (${l.ing.cantPresentacion} ${l.ing.unidad})`
      return conPrecios ? `${base} — ${formatMoneda(l.cant * l.ing.costo, moneda)}` : base
    }).join('\n')
    const pie = conPrecios ? `\nTOTAL: ${formatMoneda(total, moneda)}` : ''
    return `${enc}\n${cuerpo}${pie}`
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoPedido())
      toast('Pedido copiado al portapapeles.')
    } catch {
      toast('No se pudo copiar. Probá de nuevo.')
    }
  }

  async function guardarPedido() {
    if (!lineas.length) return
    setGuardando(true)
    try {
      await addDoc(collection(db, 'pedidos'), {
        empresaId: empresa.id,
        proveedorId,
        proveedorNombre: proveedor?.nombre || '',
        lineas: lineas.map((l) => ({
          ingredienteId: l.ing.id, nombre: l.ing.nombre, cantidad: l.cant,
          presentacion: `${l.ing.cantPresentacion} ${l.ing.unidad}`, costoUnit: Number(l.ing.costo) || 0,
        })),
        total,
        creadoEl: serverTimestamp(),
        creadoPor: user.email || '',
      })
      await registrarBitacora({
        empresaId: empresa.id, uid: user.uid, correo: user.email,
        accion: 'Creó pedido', detalle: `${proveedor?.nombre} (${lineas.length} líneas)`,
      })
      toast('Pedido guardado.')
      setCarrito({})
    } catch (err) {
      console.error(err); toast('No se pudo guardar el pedido.')
    } finally {
      setGuardando(false)
    }
  }

  const historial = [...pedidos].sort((a, b) => (b.creadoEl?.seconds || 0) - (a.creadoEl?.seconds || 0)).slice(0, 10)

  return (
    <div className="stack">
      <h2>🛒 Pedidos</h2>

      <div className="chips">
        {proveedores.map((p) => (
          <button key={p.id} className={`chip ${proveedorId === p.id ? 'activa' : ''}`}
            onClick={() => { setProveedorId(p.id); setCarrito({}); setBusqueda('') }}>
            🚚 {p.nombre}
          </button>
        ))}
      </div>

      {!proveedorId && <p className="muted center">Elegí el proveedor para armar el pedido. 👆</p>}

      {proveedorId && (
        <>
          <input className="input" placeholder="Buscar ingrediente…" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} />

          {delProveedor.length === 0 && (
            <p className="muted center">Este proveedor no tiene ingredientes registrados todavía.</p>
          )}

          {delProveedor.map((ing) => (
            <div key={ing.id} className="card row spread" style={{ padding: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{ing.nombre}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {ing.cantPresentacion} {ing.unidad} · {formatMoneda(ing.costo, moneda)}
                  {ing.nota && <> · 📝 {ing.nota}</>}
                </div>
              </div>
              <div className="stepper">
                <button type="button" onClick={() => cambiar(ing.id, -1)}>−</button>
                <span>{carrito[ing.id] || 0}</span>
                <button type="button" onClick={() => cambiar(ing.id, 1)}>＋</button>
              </div>
            </div>
          ))}

          {lineas.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--dorado)' }}>
              <div className="row spread">
                <b>Resumen ({lineas.length} líneas)</b>
                <label className="row" style={{ gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={conPrecios} onChange={(e) => setConPrecios(e.target.checked)} />
                  con precios
                </label>
              </div>
              <pre className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: 13, fontFamily: 'inherit' }}>{textoPedido()}</pre>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-fantasma" style={{ flex: 1 }} onClick={copiar}>📋 Copiar texto</button>
                <button className="btn btn-dorado" style={{ flex: 1 }} onClick={guardarPedido} disabled={guardando}>
                  {guardando ? 'Guardando…' : '💾 Guardar pedido'}
                </button>
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
                ✉️ El envío por correo al proveedor y el Excel llegan en la siguiente entrega.
              </p>
            </div>
          )}
        </>
      )}

      {historial.length > 0 && (
        <>
          <h3>Últimos pedidos</h3>
          {historial.map((p) => (
            <div key={p.id} className="card row spread" style={{ padding: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>🚚 {p.proveedorNombre}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {formatFecha(p.creadoEl)} · {p.lineas?.length || 0} líneas · {p.creadoPor}
                </div>
              </div>
              <span className="pill pill-dorado">{formatMoneda(p.total, moneda)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
