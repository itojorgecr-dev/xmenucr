// XMenú CR — Onboarding: crear empresa + primer restaurante y
// (opcional) sembrar artículos de prueba para explorar.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import {
  crearEmpresaConRestaurante, sembrarArticulosPrueba, registrarBitacora,
} from '../lib/empresa'

const PASOS = { NOMBRE: 'nombre', PRUEBA: 'prueba' }

export default function Bienvenida() {
  const { user } = useAuth()
  const { recargar } = useEmpresa()
  const toast = useToast()
  const navegar = useNavigate()

  const [paso, setPaso] = useState(PASOS.NOMBRE)
  const [nombre, setNombre] = useState('')
  const [ids, setIds] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function crear(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setCargando(true)
    try {
      const res = await crearEmpresaConRestaurante({
        uid: user.uid,
        correo: user.email,
        nombreRestaurante: nombre,
      })
      setIds(res)
      await registrarBitacora({
        empresaId: res.empresaId, uid: user.uid, correo: user.email,
        accion: 'Empresa creada', detalle: nombre.trim(),
      })
      setPaso(PASOS.PRUEBA)
    } catch (err) {
      console.error(err)
      toast('No se pudo crear la empresa. Probá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  async function terminar(conPrueba) {
    setCargando(true)
    try {
      if (conPrueba && ids) {
        await sembrarArticulosPrueba(ids)
        toast('Listo: sembramos artículos de prueba para que explorés.')
      }
      await recargar()
      navegar('/app')
    } catch (err) {
      console.error(err)
      toast('No se pudieron sembrar los artículos de prueba.')
      await recargar()
      navegar('/app')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        {paso === PASOS.NOMBRE && (
          <form onSubmit={crear}>
            <h1 style={{ fontSize: 22 }}>¡Bienvenido a XMenú CR! 🎉</h1>
            <p className="muted">Ingresá el nombre de tu restaurante para comenzar.</p>
            <label className="campo mt">
              <span>Nombre del restaurante</span>
              <input className="input" autoFocus value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Soda La Esquina" />
            </label>
            <button className="btn btn-bloque btn-dorado" type="submit"
              disabled={cargando || !nombre.trim()}>
              {cargando ? 'Creando…' : 'Comenzar'}
            </button>
          </form>
        )}

        {paso === PASOS.PRUEBA && (
          <div className="stack">
            <h1 style={{ fontSize: 22 }}>¿Querés iniciar con artículos de prueba?</h1>
            <p className="muted">
              Sembramos un set pequeño (proveedores, ingredientes, recetas, categorías y
              algunos ítems de menú) claramente marcados <b>“de prueba”</b> para que
              explorés. Los podés borrar cuando querás desde ⚙️ Configuración.
            </p>
            <button className="btn btn-bloque btn-dorado" disabled={cargando}
              onClick={() => terminar(true)}>
              {cargando ? 'Sembrando…' : 'Sí, sembrar artículos de prueba'}
            </button>
            <button className="btn btn-bloque btn-fantasma" disabled={cargando}
              onClick={() => terminar(false)}>
              Empezar de cero
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
