// XMenú CR — Shell de la app: header + pestañas móviles con icono grande.
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'

const TABS = [
  { a: '/app', ico: '🍽', texto: 'Menú', fin: true },
  { a: '/app/ingredientes', ico: '🧺', texto: 'Ingredientes' },
  { a: '/app/recetas', ico: '📖', texto: 'Recetas' },
  { a: '/app/pedidos', ico: '🛒', texto: 'Pedidos' },
  { a: '/app/config', ico: '⚙️', texto: 'Config' },
]

export default function Layout() {
  const { user, salir } = useAuth()
  const { empresa, plan } = useEmpresa()
  const navegar = useNavigate()

  async function cerrarSesion() {
    await salir()
    navegar('/')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="marca">XMenú<b> CR</b></div>
          {empresa && (
            <div className="muted" style={{ fontSize: 12 }}>
              {empresa.nombre} · <span className="pill pill-gris">{plan.nombre}</span>
            </div>
          )}
        </div>
        <button className="btn btn-fantasma" style={{ padding: '8px 12px' }} onClick={cerrarSesion}
          title={user?.email || ''}>
          Salir
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink key={t.a} to={t.a} end={t.fin}
            className={({ isActive }) => (isActive ? 'activa' : '')}>
            <span className="ico">{t.ico}</span>
            <span>{t.texto}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
