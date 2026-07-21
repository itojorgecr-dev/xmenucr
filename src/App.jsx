// XMenú CR — Router y guardas de ruta.
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { EmpresaProvider, useEmpresa } from './context/EmpresaContext'
import { ToastProvider } from './components/Toast'
import { firebaseListo } from './firebase'

import Cargando from './components/Cargando'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './auth/Login'
import Bienvenida from './onboarding/Bienvenida'
import Menu from './pages/Menu'
import Ingredientes from './pages/Ingredientes'
import Recetas from './pages/Recetas'
import Pedidos from './pages/Pedidos'
import Config from './pages/Config'
import Planes from './pages/Planes'
import Superadmin from './pages/Superadmin'

// Aviso cuando falta la config de Firebase (deploy sin variables).
function ConfigFaltante() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Falta configurar Firebase</h2>
        <p className="muted">
          Cargá las variables <code>VITE_FIREBASE_*</code> en Vercel (o en tu
          <code> .env.local</code>) según <code>.env.example</code> y volvé a desplegar.
        </p>
      </div>
    </div>
  )
}

// Exige sesión. Redirige al onboarding si el usuario aún no tiene empresa.
function RutaApp({ children, requiereEmpresa = true }) {
  const { user, cargando: cargaAuth } = useAuth()
  const { tieneEmpresa, cargando: cargaEmp } = useEmpresa()
  const location = useLocation()

  if (cargaAuth || cargaEmp) return <Cargando />
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location }} />
  if (requiereEmpresa && !tieneEmpresa) return <Navigate to="/onboarding" replace />
  return children
}

// Rutas públicas: si ya hay sesión + empresa, empujar a la app.
function RutaPublica({ children }) {
  const { user, cargando } = useAuth()
  const { tieneEmpresa, cargando: cargaEmp } = useEmpresa()
  if (cargando || (user && cargaEmp)) return <Cargando />
  if (user) return <Navigate to={tieneEmpresa ? '/app' : '/onboarding'} replace />
  return children
}

function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/ingresar" element={<RutaPublica><Login /></RutaPublica>} />

      <Route path="/onboarding" element={
        <RutaApp requiereEmpresa={false}><Bienvenida /></RutaApp>
      } />

      <Route path="/app" element={<RutaApp><Layout /></RutaApp>}>
        <Route index element={<Menu />} />
        <Route path="ingredientes" element={<Ingredientes />} />
        <Route path="recetas" element={<Recetas />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="config" element={<Config />} />
        <Route path="planes" element={<Planes />} />
      </Route>

      <Route path="/superadmin" element={<RutaApp requiereEmpresa={false}><Superadmin /></RutaApp>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!firebaseListo) return <ConfigFaltante />
  return (
    <BrowserRouter>
      <AuthProvider>
        <EmpresaProvider>
          <ToastProvider>
            <Rutas />
          </ToastProvider>
        </EmpresaProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
