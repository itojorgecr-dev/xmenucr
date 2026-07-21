// XMenú CR — ✉️ Envía el pedido al proveedor vía Resend.
// Desde noreply@xmenucr.com, con reply-to del usuario que lo envía.
// Requiere sesión de Firebase; el contenido se arma en el servidor.

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function moneda(n, simbolo) {
  return `${simbolo}${Number(n || 0).toLocaleString('es-CR')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Autenticación con Firebase (mismo patrón robusto que las demás APIs).
  let correoUsuario = ''
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')
    const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
    if (cuenta.private_key) cuenta.private_key = cuenta.private_key.replace(/\\n/g, '\n')
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(cuenta) })
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Falta el token de sesión' })
    const decoded = await getAuth(app).verifyIdToken(token)
    correoUsuario = decoded.email || ''
  } catch (e) {
    console.error('enviar-pedido auth:', e?.message)
    return res.status(401).json({ error: 'Sesión inválida' })
  }

  const {
    proveedorEmail, proveedorNombre, empresaNombre,
    lineas, conPrecios, total, simbolo = '₡', notas = '',
  } = req.body || {}

  if (!proveedorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proveedorEmail)) {
    return res.status(400).json({ error: 'El proveedor no tiene un correo válido' })
  }
  if (!Array.isArray(lineas) || lineas.length === 0 || lineas.length > 300) {
    return res.status(400).json({ error: 'El pedido no tiene líneas válidas' })
  }

  const fecha = new Date().toLocaleDateString('es-CR')
  const filas = lineas.map((l) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${esc(l.nombre)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${Number(l.cantidad) || 0}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${esc(l.presentacion)}</td>
      ${conPrecios ? `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${moneda((Number(l.cantidad) || 0) * (Number(l.costoUnit) || 0), simbolo)}</td>` : ''}
    </tr>`).join('')

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">
    <div style="background:#141233;color:#f9c74f;padding:16px 20px;border-radius:10px 10px 0 0;">
      <div style="font-size:18px;font-weight:bold;">XMenú CR</div>
      <div style="color:#ffffff;font-size:13px;">Pedido de ${esc(empresaNombre)} · ${fecha}</div>
    </div>
    <div style="border:1px solid #e5e5f0;border-top:none;border-radius:0 0 10px 10px;padding:20px;">
      <p style="margin:0 0 12px;">Estimado proveedor <b>${esc(proveedorNombre)}</b>, este es nuestro pedido:</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr style="background:#f4f2ff;">
          <th style="padding:8px 10px;text-align:left;">Producto</th>
          <th style="padding:8px 10px;text-align:center;">Cant.</th>
          <th style="padding:8px 10px;text-align:left;">Presentación</th>
          ${conPrecios ? '<th style="padding:8px 10px;text-align:right;">Subtotal</th>' : ''}
        </tr>
        ${filas}
        ${conPrecios ? `<tr><td colspan="3" style="padding:8px 10px;text-align:right;font-weight:bold;">TOTAL</td><td style="padding:8px 10px;text-align:right;font-weight:bold;">${moneda(total, simbolo)}</td></tr>` : ''}
      </table>
      ${notas ? `<p style="margin:14px 0 0;font-size:13px;color:#555;">📝 ${esc(notas)}</p>` : ''}
      <p style="margin:16px 0 0;font-size:13px;color:#555;">
        Para confirmar o consultar, respondé directamente a este correo
        (le llega a ${esc(correoUsuario)}).
      </p>
    </div>
  </div>`

  const texto = [
    `PEDIDO — ${empresaNombre} · ${fecha}`,
    `Proveedor: ${proveedorNombre}`,
    '',
    ...lineas.map((l) => `• ${l.nombre} — ${l.cantidad} × (${l.presentacion})${conPrecios ? ` — ${moneda((Number(l.cantidad) || 0) * (Number(l.costoUnit) || 0), simbolo)}` : ''}`),
    conPrecios ? `TOTAL: ${moneda(total, simbolo)}` : '',
  ].join('\n')

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY no está configurada en Vercel' })
    }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'XMenú CR <noreply@xmenucr.com>',
        to: [proveedorEmail],
        reply_to: correoUsuario || undefined,
        subject: `Pedido de ${empresaNombre} — ${fecha}`,
        html,
        text: texto,
      }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('resend:', r.status, JSON.stringify(j))
      const detalle = j?.message || j?.error || `HTTP ${r.status}`
      if (/domain|verify/i.test(String(detalle))) {
        return res.status(502).json({ error: 'El dominio xmenucr.com aún no está verificado en Resend. Revisá resend.com → Domains.' })
      }
      return res.status(502).json({ error: `Resend: ${detalle}` })
    }
    return res.status(200).json({ ok: true, id: j.id })
  } catch (e) {
    console.error('enviar-pedido:', e?.message)
    return res.status(502).json({ error: 'No se pudo enviar el correo.' })
  }
}
