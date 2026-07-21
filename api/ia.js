// XMenú CR — 🤖 IA que acomoda la preparación (Vercel serverless, Node ESM).
// El usuario escribe/dicta la preparación desordenada y la devolvemos como
// pasos numerados y presentables. Requiere sesión de Firebase (ID token).
import Anthropic from '@anthropic-ai/sdk'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function adminApp() {
  if (getApps().length) return getApps()[0]
  const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  return initializeApp({ credential: cert(cuenta) })
}

const SISTEMA = `Sos el asistente de XMenú CR, una app de costeo para restaurantes de Costa Rica.
Tu única tarea: tomar la preparación de un platillo o cóctel escrita de forma
desordenada (pasos sueltos, temperaturas, tiempos, garnish, todo mezclado) y
devolverla ordenada y presentable.

Reglas:
- Devolvé SOLO la preparación acomodada, sin saludos ni comentarios.
- Pasos numerados (1., 2., 3., …), una acción clara por paso, en orden lógico.
- Conservá TODA la información (cantidades, temperaturas, tiempos, utensilios,
  garnish); no inventés nada que no esté en el texto.
- Español neutro de Costa Rica, tono profesional de cocina.
- Si mencionan garnish/decoración, dejalo como último paso.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Autenticación: solo usuarios con sesión de la app pueden usar la IA.
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Falta el token de sesión' })
    await getAuth(adminApp()).verifyIdToken(token)
  } catch {
    return res.status(401).json({ error: 'Sesión inválida' })
  }

  const texto = (req.body?.texto || '').trim()
  if (!texto) return res.status(400).json({ error: 'Falta el texto de la preparación' })
  if (texto.length > 8000) return res.status(400).json({ error: 'El texto es demasiado largo' })

  try {
    const anthropic = new Anthropic() // lee ANTHROPIC_API_KEY del entorno
    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096, // las preparaciones son cortas
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: SISTEMA,
      messages: [{ role: 'user', content: texto }],
    })
    const bloque = respuesta.content.find((b) => b.type === 'text')
    return res.status(200).json({ preparacion: bloque?.text?.trim() || '' })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'La IA está ocupada. Probá en un momento.' })
    }
    console.error('ia.js:', e?.status || '', e?.message)
    return res.status(502).json({ error: 'No se pudo acomodar la preparación.' })
  }
}
