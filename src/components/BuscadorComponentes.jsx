// XMenú CR — Buscador alfabético de ingredientes/recetas con letras,
// precios y notas 📝. Se usa dentro de una Hoja al agregar componentes.
import { useMemo, useState } from 'react'
import { useEmpresa } from '../context/EmpresaContext'
import { formatMoneda } from '../lib/format'
import { costoPorBase, costoReceta } from '../lib/costeo'

export default function BuscadorComponentes({ ingredientes, recetas, mapas, onElegir, excluirRecetaId }) {
  const { empresa } = useEmpresa()
  const [tipo, setTipo] = useState('ingrediente')
  const [letra, setLetra] = useState('')
  const [texto, setTexto] = useState('')

  const lista = useMemo(() => {
    const base = tipo === 'ingrediente'
      ? ingredientes
      : recetas.filter((r) => r.id !== excluirRecetaId) // sin auto-anidarse
    const t = texto.trim().toLocaleLowerCase('es')
    return base
      .filter((x) => !t || (x.nombre || '').toLocaleLowerCase('es').includes(t))
      .filter((x) => !letra || (x.nombre || '').toLocaleUpperCase('es').startsWith(letra))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
  }, [tipo, texto, letra, ingredientes, recetas, excluirRecetaId])

  const letras = useMemo(() => {
    const base = tipo === 'ingrediente' ? ingredientes : recetas
    return [...new Set(base.map((x) => (x.nombre || '?')[0].toLocaleUpperCase('es')))].sort((a, b) => a.localeCompare(b, 'es'))
  }, [tipo, ingredientes, recetas])

  const moneda = empresa?.moneda

  return (
    <div>
      <div className="chips">
        <button className={`chip ${tipo === 'ingrediente' ? 'activa' : ''}`}
          onClick={() => { setTipo('ingrediente'); setLetra('') }}>🧺 Ingredientes</button>
        <button className={`chip ${tipo === 'receta' ? 'activa' : ''}`}
          onClick={() => { setTipo('receta'); setLetra('') }}>📖 Recetas</button>
      </div>

      <input className="input" placeholder="Buscar por nombre…" value={texto}
        onChange={(e) => setTexto(e.target.value)} autoFocus />

      <div className="letras-rail">
        <button className={letra === '' ? 'activa' : ''} onClick={() => setLetra('')}>Todas</button>
        {letras.map((l) => (
          <button key={l} className={letra === l ? 'activa' : ''}
            onClick={() => setLetra(letra === l ? '' : l)}>{l}</button>
        ))}
      </div>

      {lista.length === 0 && <p className="muted center mt">Nada por aquí con ese filtro.</p>}

      {lista.map((x) => {
        const precio = tipo === 'ingrediente'
          ? `${formatMoneda(x.costo, moneda)} / ${x.cantPresentacion} ${x.unidad}`
          : `${formatMoneda(costoReceta(x, mapas).costoPorServicio, moneda)} por servicio`
        const detalle = tipo === 'ingrediente'
          ? `${formatMoneda(costoPorBase(x), moneda)} por ${x.unidad in { cada: 1 } ? x.unidad : 'unidad base'}`
          : `${x.servicios || 1} servicios`
        return (
          <div key={x.id} className="fila-busqueda" onClick={() => onElegir(tipo, x)}>
            <div>
              <div style={{ fontWeight: 700 }}>{x.nombre}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {detalle}
                {x.nota && <> · 📝 {x.nota}</>}
              </div>
            </div>
            <span className="pill pill-dorado" style={{ whiteSpace: 'nowrap' }}>{precio}</span>
          </div>
        )
      })}
    </div>
  )
}
