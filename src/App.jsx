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
      <div className="card" style={{ maxWidth: 560 }}>
        <h2>⚙️ Falta configurar Firebase</h2>
        <p className="muted">
          La app está desplegada pero no encuentra las variables de Firebase, así
          que no puede mostrar el login. Para activarla:
        </p>
        <ol className="muted" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>En <b>Firebase Console</b> → Configuración del proyecto → Tus apps →
            App web, copiá la configuración del SDK.</li>
          <li>En <b>Vercel</b> → Settings → Environment Variables, cargá cada valor
            como <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>,
            <code> VITE_FIREBASE_PROJECT_ID</code>, <code>VITE_FIREBASE_STORAGE_BUCKET</code>,
            <code> VITE_FIREBASE_MESSAGING_SENDER_ID</code> y <code>VITE_FIREBASE_APP_ID</code>
            (ver <code>.env.example</code>).</li>
          <li>Marcá que apliquen también a <b>Preview</b>, no solo a Production.</li>
          <li><b>Redeploy</b> desde Vercel para que tomen efecto.</li>
        </ol>
        <p className="muted">
          En local: copiá <code>.env.example</code> a <code>.env.local</code> y completá los valores.
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
