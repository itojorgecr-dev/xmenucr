// XMenú CR — Pantalla de verificación de correo obligatoria.
// Las cuentas de correo/clave no entran a la app hasta verificar.
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from '../components/Toast'

export default function VerificarCorreo() {
  const { user, reenviarVerificacion, refrescar, salir } = useAuth()
  const toast = useToast()
  const [enviando, setEnviando] = useState(false)
  const [revisando, setRevisando] = useState(false)

  async function reenviar() {
    setEnviando(true)
    try {
      await reenviarVerificacion()
      toast('Correo de verificación reenviado. Revisá también el spam.')
    } catch {
      toast('No se pudo reenviar. Esperá un minuto y probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  async function yaVerifique() {
    setRevisando(true)
    try {
      const foto = await refrescar()
      if (foto?.emailVerified) {
        toast('¡Correo verificado! Bienvenido. 🎉')
      } else {
        toast('Todavía no aparece verificado. Abrí el enlace del correo y volvé a tocar aquí.')
      }
    } finally {
      setRevisando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <h2>📬 Verificá tu correo</h2>
        <p className="muted">
          Te enviamos un enlace de verificación a <b>{user?.email}</b>. Abrilo para
          activar tu cuenta y después tocá <b>“Ya verifiqué”</b>.
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          💡 Si no lo ves, revisá la carpeta de <b>spam / correo no deseado</b> — el
          remitente es <code>noreply@xmenucr.firebaseapp.com</code>.
        </p>
        <div className="stack mt">
          <button className="btn btn-dorado btn-bloque" onClick={yaVerifique} disabled={revisando}>
            {revisando ? 'Revisando…' : '✅ Ya verifiqué mi correo'}
          </button>
          <button className="btn btn-fantasma btn-bloque" onClick={reenviar} disabled={enviando}>
            {enviando ? 'Enviando…' : '↻ Reenviar correo de verificación'}
          </button>
          <button className="btn btn-fantasma btn-bloque" onClick={salir}>
            Salir y usar otra cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
