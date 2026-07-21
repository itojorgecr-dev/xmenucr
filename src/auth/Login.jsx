// XMenú CR — Pantalla de ingreso / registro.
// Google Sign-In + correo/clave, con recuperación de contraseña.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { traducirErrorAuth } from './erroresAuth'
import { MARCA } from '../lib/constants'

const MODOS = { INGRESAR: 'ingresar', REGISTRAR: 'registrar', RECUPERAR: 'recuperar' }

export default function Login() {
  const { ingresarGoogle, ingresarCorreo, registrarCorreo, recuperarClave } = useAuth()
  const navegar = useNavigate()

  const [modo, setModo] = useState(MODOS.INGRESAR)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(false)

  async function conGoogle() {
    setError(''); setCargando(true)
    try {
      await ingresarGoogle()
      navegar('/app')
    } catch (e) {
      setError(traducirErrorAuth(e))
    } finally {
      setCargando(false)
    }
  }

  async function enviar(e) {
    e.preventDefault()
    setError(''); setAviso(''); setCargando(true)
    try {
      if (modo === MODOS.INGRESAR) {
        await ingresarCorreo(correo.trim(), clave)
        navegar('/app')
      } else if (modo === MODOS.REGISTRAR) {
        await registrarCorreo(correo.trim(), clave, nombre.trim())
        setAviso('¡Cuenta creada! Te enviamos un correo para verificar tu dirección.')
        navegar('/app')
      } else if (modo === MODOS.RECUPERAR) {
        await recuperarClave(correo.trim())
        setAviso('Te enviamos un correo para restablecer tu contraseña.')
        setModo(MODOS.INGRESAR)
      }
    } catch (e2) {
      setError(traducirErrorAuth(e2))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div className="center" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            XMenú<span style={{ color: MARCA.colores.dorado }}> CR</span>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>{MARCA.lema}</div>
        </div>

        {error && <div className="aviso aviso-peligro" style={{ marginBottom: 12 }}>{error}</div>}
        {aviso && <div className="aviso aviso-info" style={{ marginBottom: 12 }}>{aviso}</div>}

        {modo !== MODOS.RECUPERAR && (
          <>
            <button className="btn btn-bloque btn-dorado" onClick={conGoogle} disabled={cargando}>
              Continuar con Google
            </button>
            <div className="center muted" style={{ margin: '14px 0', fontSize: 13 }}>o con tu correo</div>
          </>
        )}

        <form onSubmit={enviar}>
          {modo === MODOS.REGISTRAR && (
            <label className="campo">
              <span>Tu nombre</span>
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Jorge" autoComplete="name" />
            </label>
          )}
          <label className="campo">
            <span>Correo</span>
            <input className="input" type="email" required value={correo}
              onChange={(e) => setCorreo(e.target.value)} placeholder="vos@correo.com"
              autoComplete="email" />
          </label>
          {modo !== MODOS.RECUPERAR && (
            <label className="campo">
              <span>Contraseña</span>
              <input className="input" type="password" required minLength={6} value={clave}
                onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 6 caracteres"
                autoComplete={modo === MODOS.REGISTRAR ? 'new-password' : 'current-password'} />
            </label>
          )}

          <button className="btn btn-bloque btn-dorado mt" type="submit" disabled={cargando}>
            {modo === MODOS.INGRESAR && 'Ingresar'}
            {modo === MODOS.REGISTRAR && 'Crear cuenta'}
            {modo === MODOS.RECUPERAR && 'Enviar correo de recuperación'}
          </button>
        </form>

        <div className="center mt stack" style={{ fontSize: 14 }}>
          {modo === MODOS.INGRESAR && (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); setModo(MODOS.REGISTRAR); setError('') }}>
                ¿No tenés cuenta? Creá una
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setModo(MODOS.RECUPERAR); setError('') }}>
                Olvidé mi contraseña
              </a>
            </>
          )}
          {modo !== MODOS.INGRESAR && (
            <a href="#" onClick={(e) => { e.preventDefault(); setModo(MODOS.INGRESAR); setError('') }}>
              ← Volver a ingresar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
