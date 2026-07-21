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
  // Diagnóstico: solo mostramos si cada variable LLEGÓ al build (nunca su valor).
  const estado = [
    ['VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY],
    ['VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN],
    ['VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID],
    ['VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID],
    ['VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID],
  ]
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 560 }}>
        <h2>⚙️ Falta configurar Firebase</h2>
        <p className="muted">
          La app está desplegada pero al momento del build no llegaron estas
          variables. Estado de cada una en ESTE deploy:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2, fontFamily: 'monospace', fontSize: 13 }}>
          {estado.map(([nombre, valor]) => (
            <li key={nombre}>
              {valor ? '✅' : '❌'} {nombre}
              {valor ? '' : ' — no llegó'}
            </li>
          ))}
        </ul>
        <p className="muted">
          Para arreglarlo: en <b>Vercel</b> → Settings → Environment Variables,
          revisá que cada ❌ exista con ese nombre EXACTO y aplique a
          <b> Preview</b>. Después hacé <b>Redeploy</b> (las variables solo
          entran en builds nuevos).
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
