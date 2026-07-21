// XMenú CR — Shell de la app: encabezado + botones de navegación arriba,
// juntos y con icono grande (estilo tarjeta).
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { PERMISOS } from '../lib/constants'

export default function Layout() {
  const { user, salir } = useAuth()
  const { empresa, plan, rol } = useEmpresa()
  const navegar = useNavigate()
  const permisos = PERMISOS[rol] || PERMISOS.lector

  const NAV = [
    { a: '/app', ico: '🍽', texto: 'Menú', fin: true },
    { a: '/app/ingredientes', ico: '🧺', texto: 'Ingredientes' },
    { a: '/app/proveedores', ico: '🚚', texto: 'Proveedores' },
    { a: '/app/recetas', ico: '📖', texto: 'Recetas' },
    { a: '/app/pedidos', ico: '🛒', texto: 'Pedidos' },
    ...(permisos.bitacora ? [{ a: '/app/bitacora', ico: '📋', texto: 'Bitácora' }] : []),
    { a: '/app/config', ico: '⚙️', texto: 'Config' },
  ]

  async function cerrarSesion() {
    await salir()
    navegar('/')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="row spread" style={{ width: '100%' }}>
          <div>
            <div className="marca">XMenú<b> CR</b></div>
            {empresa && (
              <div className="muted" style={{ fontSize: 12 }}>
                {empresa.nombre} · <span className="pill pill-gris">{plan.nombre}</span>
              </div>
            )}
          </div>
          <button className="btn btn-fantasma" style={{ padding: '8px 14px' }} onClick={cerrarSesion}
            title={user?.email || ''}>
            Salir
          </button>
        </div>
        <nav className="navtop">
          {NAV.map((t) => (
            <NavLink key={t.a} to={t.a} end={t.fin}
              className={({ isActive }) => (isActive ? 'activa' : '')}>
              <span className="ico">{t.ico}</span>
              <span>{t.texto}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
