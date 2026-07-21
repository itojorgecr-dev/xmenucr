// XMenú CR — Panel de superadmin (solo Jorge, por uid / custom claim).
// PR1: esqueleto. La gestión de planes de cualquier empresa, catálogos
// maestros y avisos de pago se completa en PR3/PR5.
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Superadmin() {
  const { esSuperadmin, user } = useAuth()

  if (!esSuperadmin) {
    return (
      <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        <div className="aviso aviso-peligro">
          <h3>Acceso restringido</h3>
          <p>Este panel es solo para el superadministrador.</p>
          <Link to="/app" className="btn btn-fantasma mt">← Volver a la app</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }} className="stack">
      <div className="row spread">
        <h2>🛡 Panel de superadmin</h2>
        <Link to="/app" className="btn btn-fantasma" style={{ padding: '8px 12px' }}>← App</Link>
      </div>
      <p className="muted">Sesión: {user?.email}</p>

      <div className="card">
        <h3>Empresas y planes</h3>
        <p className="muted">Activar/cambiar el plan de cualquier empresa. (Se completa en PR 3.)</p>
      </div>
      <div className="card">
        <h3>Avisos de pago</h3>
        <p className="muted">Revisar los “Ya pagué” pendientes y confirmarlos. (PR 3.)</p>
      </div>
      <div className="card">
        <h3>Catálogos maestros de proveedores</h3>
        <p className="muted">Importar/actualizar catálogos (MICA, Belca…), diff y publicación. (PR 5.)</p>
      </div>
    </div>
  )
}
