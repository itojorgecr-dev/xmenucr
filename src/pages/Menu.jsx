// XMenú CR — 🍽 Menú multi-restaurante.
// Listado alfabético con venta/costo/utilidad + pastillas de %, chips de
// restaurante y categoría, ponderado del grupo al pie, detalle con desglose,
// editar/eliminar con confirm y copiar ítem a otro restaurante.
import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'
import Hoja from '../components/Hoja'
import ItemEditor from './ItemEditor'
import { formatMoneda, formatPorcentaje } from '../lib/format'
import { registrarBitacora } from '../lib/empresa'
import { chequearLimite } from '../lib/limites'
import { costoItem, ponderadoGrupo, porId } from '../lib/costeo'

// Pastilla de % de costo con color según rango.
function PillPct({ pct }) {
  const clase = pct <= 30 ? 'pill-verde' : pct <= 40 ? 'pill-dorado' : 'pill-rojo'
  return <span className={`pill ${clase}`}>{formatPorcentaje(pct)}</span>
}

export default function Menu() {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()

  const { datos: menuItems, cargando } = useColeccion('menuItems')
  const { datos: categorias } = useColeccion('categorias')
  const { datos: restaurantes } = useColeccion('restaurantes')
  const { datos: ingredientes } = useColeccion('ingredientes')
  const { datos: recetas } = useColeccion('recetas')

  const [filtroRest, setFiltroRest] = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [detalle, setDetalle] = useState(null)   // ítem en hoja de detalle
  const [editando, setEditando] = useState(null) // ítem en editor
  const [copiando, setCopiando] = useState(null) // ítem a copiar

  const mapas = useMemo(() => ({ ingredientes: porId(ingredientes), recetas: porId(recetas) }), [ingredientes, recetas])
  const catPorId = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c.nombre])), [categorias])
  const restPorId = useMemo(() => Object.fromEntries(restaurantes.map((r) => [r.id, r.nombre])), [restaurantes])

  if (cargando) return <Cargando />

  if (categorias.length === 0) {
    return (
      <GuiaVacio emoji="🍽" titulo="Todavía no hay menú"
        mensaje="Primero creá una categoría en ⚙️ Configuración (ej: Cócteles) y después agregá tus ítems."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }} />
    )
  }

  const lista = menuItems
    .filter((it) => !filtroRest || it.restauranteId === filtroRest)
    .filter((it) => !filtroCat || it.categoria === filtroCat)
    .map((it) => ({ ...it, costeo: costoItem(it, mapas) }))
  const ponderado = ponderadoGrupo(lista)
  const moneda = empresa?.moneda

  async function eliminar(item) {
    if (!confirm(`¿Eliminar "${item.nombre}" del menú?`)) return
    await deleteDoc(doc(db, 'menuItems', item.id))
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: 'Eliminó ítem de menú', detalle: item.nombre,
    })
    setDetalle(null)
    toast('Eliminado.')
  }

  // Copiar a otro restaurante: crea un ítem NUEVO e independiente.
  async function copiarA(item, restauranteId) {
    const chk = chequearLimite(plan.id, 'menuItems', menuItems.length)
    if (!chk.permitido) { setCopiando(null); return toast(chk.mensaje) }
    const datos = { ...item }
    delete datos.id
    delete datos.costeo
    await addDoc(collection(db, 'menuItems'), {
      ...datos, restauranteId, empresaId: empresa.id,
      fotoUrl: '', // la foto no se comparte: cada copia es independiente
      creadoEl: serverTimestamp(),
    })
    await registrarBitacora({
      empresaId: empresa.id, uid: user.uid, correo: user.email,
      accion: 'Copió ítem de menú', detalle: `${item.nombre} → ${restPorId[restauranteId]}`,
    })
    setCopiando(null); setDetalle(null)
    toast(`Copiado a ${restPorId[restauranteId]}.`)
  }

  if (editando !== null) {
    return (
      <ItemEditor
        item={editando}
        onCerrar={() => setEditando(null)}
        contexto={{ menuItems, categorias, restaurantes, ingredientes, recetas, mapas }}
      />
    )
  }

  return (
    <div className="stack">
      <div className="row spread">
        <h2>🍽 Menú</h2>
        <button className="btn btn-dorado" onClick={() => setEditando({})}>＋ Nuevo ítem</button>
      </div>

      {restaurantes.length > 1 && (
        <div className="chips">
          <button className={`chip ${!filtroRest ? 'activa' : ''}`} onClick={() => setFiltroRest('')}>Todos</button>
          {restaurantes.map((r) => (
            <button key={r.id} className={`chip ${filtroRest === r.id ? 'activa' : ''}`}
              onClick={() => setFiltroRest(filtroRest === r.id ? '' : r.id)}>🏠 {r.nombre}</button>
          ))}
        </div>
      )}
      <div className="chips">
        <button className={`chip ${!filtroCat ? 'activa' : ''}`} onClick={() => setFiltroCat('')}>Todas</button>
        {categorias.map((c) => (
          <button key={c.id} className={`chip ${filtroCat === c.id ? 'activa' : ''}`}
            onClick={() => setFiltroCat(filtroCat === c.id ? '' : c.id)}>🏷 {c.nombre}</button>
        ))}
      </div>

      {lista.length === 0 && (
        <GuiaVacio emoji="🍽" titulo="Agregá tu primer ítem"
          mensaje="Tocá ＋ Nuevo ítem: elegí restaurante y categoría, agregá componentes y mirá el costeo en vivo." />
      )}

      {lista.map((it) => (
        <div key={it.id} className="card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => setDetalle(it)}>
          <div className="row spread">
            <div>
              <div style={{ fontWeight: 700 }}>{it.nombre} {it.dePrueba && <span className="pill pill-gris">prueba</span>}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                🏷 {catPorId[it.categoria] || 'Sin categoría'}
                {restaurantes.length > 1 && <> · 🏠 {restPorId[it.restauranteId] || '—'}</>}
                {it.costeo.error && <> · <span style={{ color: 'var(--rojo)' }}>⚠️</span></>}
              </div>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="pill pill-gris">V {formatMoneda(it.costeo.venta, moneda)}</span>
              <span className="pill pill-gris">C {formatMoneda(it.costeo.costo, moneda)}</span>
              <PillPct pct={it.costeo.pctCosto} />
            </div>
          </div>
        </div>
      ))}

      {/* Ponderado del grupo al pie */}
      {lista.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--dorado)' }}>
          <div className="row spread"><b>Ponderado del grupo ({lista.length} ítems)</b><PillPct pct={ponderado.pctCosto} /></div>
          <div className="muted" style={{ fontSize: 13 }}>
            Venta {formatMoneda(ponderado.totVenta, moneda)} · Costo {formatMoneda(ponderado.totCosto, moneda)} ·
            Utilidad {formatMoneda(ponderado.totUtilidad, moneda)}
          </div>
        </div>
      )}

      {/* Detalle con desglose de costeo */}
      <Hoja titulo={detalle?.nombre || ''} abierta={Boolean(detalle)} onCerrar={() => setDetalle(null)}>
        {detalle && (
          <div className="stack">
            {detalle.fotoUrl && <img className="foto-item" src={detalle.fotoUrl} alt={detalle.nombre} />}
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span className="pill pill-gris">Venta {formatMoneda(detalle.costeo.venta, moneda)}</span>
              <span className="pill pill-gris">Costo {formatMoneda(detalle.costeo.costo, moneda)}</span>
              <span className="pill pill-verde">Utilidad {formatMoneda(detalle.costeo.utilidad, moneda)}</span>
              <PillPct pct={detalle.costeo.pctCosto} />
            </div>

            <h3 style={{ margin: '6px 0 0' }}>Desglose</h3>
            {detalle.costeo.detalle.map((c, i) => {
              const obj = c.tipo === 'receta' ? mapas.recetas[c.refId] : mapas.ingredientes[c.refId]
              return (
                <div key={i} className="row spread" style={{ borderBottom: '1px solid var(--borde)', paddingBottom: 6 }}>
                  <span>
                    {c.tipo === 'receta' ? '📖' : '🧺'} {obj?.nombre || '⚠️ eliminado'}{' '}
                    <span className="muted" style={{ fontSize: 12 }}>{c.cantidad} {c.unidad}</span>
                    {c.error && <span style={{ color: 'var(--rojo)', fontSize: 12 }}> ⚠️ {c.error}</span>}
                  </span>
                  <b>{formatMoneda(c.costo, moneda)}</b>
                </div>
              )
            })}
            {detalle.costeo.manoObra > 0 && (
              <div className="row spread" style={{ borderBottom: '1px solid var(--borde)', paddingBottom: 6 }}>
                <span>👷 Mano de obra</span><b>{formatMoneda(detalle.costeo.manoObra, moneda)}</b>
              </div>
            )}
            {detalle.preparacion && (
              <>
                <h3 style={{ margin: '6px 0 0' }}>Preparación</h3>
                <p className="muted" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{detalle.preparacion}</p>
              </>
            )}

            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-dorado" style={{ flex: 1 }}
                onClick={() => { setEditando(detalle); setDetalle(null) }}>✏️ Editar</button>
              {restaurantes.length > 1 && (
                <button className="btn btn-fantasma" style={{ flex: 1 }} onClick={() => setCopiando(detalle)}>
                  📋 Copiar a…
                </button>
              )}
              <button className="btn btn-peligro" onClick={() => eliminar(detalle)}>🗑</button>
            </div>
          </div>
        )}
      </Hoja>

      {/* Elegir restaurante destino de la copia */}
      <Hoja titulo="Copiar ítem a…" abierta={Boolean(copiando)} onCerrar={() => setCopiando(null)}>
        {copiando && (
          <div className="stack">
            <p className="muted">Se crea un ítem nuevo e independiente en el restaurante elegido.</p>
            {restaurantes.filter((r) => r.id !== copiando.restauranteId).map((r) => (
              <button key={r.id} className="btn btn-fantasma btn-bloque" onClick={() => copiarA(copiando, r.id)}>
                🏠 {r.nombre}
              </button>
            ))}
          </div>
        )}
      </Hoja>
    </div>
  )
}
