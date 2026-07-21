// XMenú CR — Indicador de carga.
export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando">
      <div className="stack center">
        <div className="spinner" />
        <div className="muted">{texto}</div>
      </div>
    </div>
  )
}
