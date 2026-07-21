// XMenú CR — Activa el custom claim `superadmin` (Vercel serverless).
// SOLO para la cuenta del superadmin (correo fijo, verificado por Firebase).
// Las reglas de Firestore usan este claim como fuente de verdad.
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const SUPERADMIN_CORREO = 'itojorgecr@gmail.com'

function adminApp() {
  if (getApps().length) return getApps()[0]
  const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  return initializeApp({ credential: cert(cuenta) })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Falta el token de sesión' })

    const admin = getAuth(adminApp())
    const decoded = await admin.verifyIdToken(token)

    const esElCorreo = (decoded.email || '').toLowerCase() === SUPERADMIN_CORREO
    if (!esElCorreo || !decoded.email_verified) {
      return res.status(403).json({ error: 'Esta cuenta no es el superadmin' })
    }
    if (decoded.superadmin === true) {
      return res.status(200).json({ ok: true, yaEstaba: true })
    }

    await admin.setCustomUserClaims(decoded.uid, { superadmin: true })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('claim-superadmin:', e?.message)
    return res.status(401).json({ error: 'Sesión inválida' })
  }
}
