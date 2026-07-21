// XMenú CR — Guía direccional para estados vacíos.
// La app SIEMPRE dice el siguiente paso, con botón directo.
import { useNavigate } from 'react-router-dom'

export default function GuiaVacio({ emoji = '✨', titulo, mensaje, accion }) {
  const navegar = useNavigate()
  return (
    <div className="vacio">
      <span className="emoji">{emoji}</span>
      {titulo && <h3>{titulo}</h3>}
      {mensaje && <p className="muted" style={{ maxWidth: 420, margin: '0 auto' }}>{mensaje}</p>}
      {accion && (
        <button
          className="btn btn-dorado"
          onClick={() => (accion.onClick ? accion.onClick() : navegar(accion.a))}
        >
          {accion.texto}
        </button>
      )}
    </div>
  )
}
