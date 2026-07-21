// XMenú CR — Hoja (bottom sheet) para selección y formularios rápidos.
export default function Hoja({ titulo, abierta, onCerrar, children }) {
  if (!abierta) return null
  return (
    <>
      <div className="hoja-fondo" onClick={onCerrar} />
      <div className="hoja" role="dialog" aria-label={titulo}>
        <div className="hoja-cabecera">
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          <button className="btn btn-fantasma" style={{ padding: '6px 12px' }} onClick={onCerrar}>✕</button>
        </div>
        <div className="hoja-cuerpo">{children}</div>
      </div>
    </>
  )
}
