// XMenú CR — Activa el custom claim `superadmin` (Vercel serverless).
// SOLO para la cuenta del superadmin (correo fijo, verificado por Firebase).
// Las reglas de Firestore usan este claim como fuente de verdad.
//
// Los imports son dinámicos y todo va dentro de try/catch para que
// CUALQUIER falla (incluso al cargar librerías) devuelva el detalle.

const SUPERADMIN_CORREO = 'itojorgecr@gmail.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  let admin
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    const crudo = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!crudo) throw new Error('FIREBASE_SERVICE_ACCOUNT no está configurada en Vercel')
    let cuenta
    try {
      cuenta = JSON.parse(crudo)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido (pegá el archivo completo de la cuenta de servicio)')
    }
    // Arreglo clásico: Vercel a veces guarda la llave con \n literales.
    if (cuenta.private_key) cuenta.private_key = cuenta.private_key.replace(/\\n/g, '\n')
    if (!cuenta.private_key || !cuenta.client_email) {
      throw new Error('A FIREBASE_SERVICE_ACCOUNT le faltan private_key o client_email')
    }

    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(cuenta) })
    admin = getAuth(app)
  } catch (e) {
    console.error('claim-superadmin init:', e)
    return res.status(500).json({ error: `Inicialización: ${e?.message || e}` })
  }

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Falta el token de sesión' })

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
    console.error('claim-superadmin:', e)
    return res.status(401).json({ error: `Sesión: ${e?.message || e}` })
  }
}
