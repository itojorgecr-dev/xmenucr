// XMenú CR — Onboarding.
// Paso 1: ¿cargar datos de prueba (recomendado) o empezar de una vez?
//   - Datos de prueba → crea todo al instante con nombre editable después.
//   - Empezar de una vez → pide el nombre del restaurante y crea sin datos.
// Si el usuario YA tiene empresa, jamás vuelve a pasar por aquí.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import {
  crearEmpresaConRestaurante, sembrarArticulosPrueba, registrarBitacora,
} from '../lib/empresa'

const PASOS = { ELECCION: 'eleccion', NOMBRE: 'nombre' }
const NOMBRE_POR_DEFECTO = 'Mi Restaurante'

export default function Bienvenida() {
  const { user } = useAuth()
  const { recargar, tieneEmpresa, cargando } = useEmpresa()
  const toast = useToast()
  const navegar = useNavigate()

  const [paso, setPaso] = useState(PASOS.ELECCION)
  const [nombre, setNombre] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  // Si ya tiene empresa (llegó aquí por error o refrescó), directo a la app.
  useEffect(() => {
    if (!cargando && tieneEmpresa) navegar('/app', { replace: true })
  }, [cargando, tieneEmpresa, navegar])

  async function crear({ nombreRestaurante, conPrueba }) {
    setTrabajando(true)
    try {
      const res = await crearEmpresaConRestaurante({
        uid: user.uid,
        correo: user.email,
        nombreRestaurante,
      })
      await registrarBitacora({
        empresaId: res.empresaId, uid: user.uid, correo: user.email,
        accion: 'Empresa creada', detalle: nombreRestaurante,
      })
      if (conPrueba) {
        await sembrarArticulosPrueba(res)
        toast('¡Listo! Cargamos datos de prueba — borralos cuando querás con el botón del Menú.')
      } else {
        toast(`¡Bienvenido, ${nombreRestaurante}! 🎉`)
      }
      await recargar()
      navegar('/app')
    } catch (err) {
      console.error(err)
      toast('No se pudo crear el restaurante. Probá de nuevo.')
      setTrabajando(false)
    }
  }

  function enviarNombre(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    crear({ nombreRestaurante: nombre.trim(), conPrueba: false })
  }

  if (cargando || tieneEmpresa) return null

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 460 }}>
        {paso === PASOS.ELECCION && (
          <div className="stack">
            <h1 style={{ fontSize: 22 }}>¡Bienvenido a XMenú CR! 🎉</h1>
            <p className="muted">
              ¿Querés cargar <b>ítems de prueba</b> para explorar la app con ejemplos
              ya costeados? Después los borrás fácilmente con un botón.
            </p>
            <button className="btn btn-dorado btn-bloque" disabled={trabajando}
              onClick={() => crear({ nombreRestaurante: NOMBRE_POR_DEFECTO, conPrueba: true })}>
              {trabajando ? 'Preparando…' : '🧪 Sí, cargar datos de prueba (recomendado)'}
            </button>
            <button className="btn btn-fantasma btn-bloque" disabled={trabajando}
              onClick={() => setPaso(PASOS.NOMBRE)}>
              🚀 Empezar de una vez con mi menú real
            </button>
            <p className="muted center" style={{ fontSize: 12, margin: 0 }}>
              Con datos de prueba, tu restaurante se llama “{NOMBRE_POR_DEFECTO}” —
              lo cambiás cuando querás en ⚙️ Config.
            </p>
          </div>
        )}

        {paso === PASOS.NOMBRE && (
          <form onSubmit={enviarNombre}>
            <h1 style={{ fontSize: 22 }}>¡Vamos a empezar! 🚀</h1>
            <p className="muted">Ingresá el nombre de tu restaurante.</p>
            <label className="campo mt">
              <span>Nombre del restaurante</span>
              <input className="input" autoFocus value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Soda La Esquina" />
            </label>
            <button className="btn btn-bloque btn-dorado" type="submit"
              disabled={trabajando || !nombre.trim()}>
              {trabajando ? 'Creando…' : 'Crear mi restaurante'}
            </button>
            <button className="btn btn-bloque btn-fantasma mt" type="button"
              disabled={trabajando} onClick={() => setPaso(PASOS.ELECCION)}>
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
