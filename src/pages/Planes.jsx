// XMenú CR — Planes y tarifas. Pago MANUAL (SINPE / transferencia) por ahora.
// La pasarela automática es fase 2. El botón "Ya pagué" notifica al superadmin.
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useEmpresa } from '../context/EmpresaContext'
import { useToast } from '../components/Toast'
import { PLANES, ORDEN_PLANES, PAGO_MANUAL } from '../lib/constants'

export default function Planes() {
  const { user } = useAuth()
  const { empresa, plan } = useEmpresa()
  const toast = useToast()

  async function yaPague(planDestino) {
    try {
      await addDoc(collection(db, 'invitaciones'), { // reutiliza colección de avisos; se moverá a `avisosPago` en PR3
        tipo: 'aviso_pago',
        empresaId: empresa?.id || '',
        correo: user?.email || '',
        planActual: plan.id,
        planDestino,
        estado: 'pendiente',
        creadoEl: serverTimestamp(),
      })
      toast('¡Gracias! Registramos tu aviso de pago. Activaremos tu plan pronto.')
    } catch {
      toast('No se pudo registrar el aviso. Escribinos y lo resolvemos.')
    }
  }

  return (
    <div className="stack">
      <h2>Planes y tarifas</h2>
      <p className="muted">Elegí el plan que mejor se ajusta a tu operación.</p>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {ORDEN_PLANES.map((id) => {
          const p = PLANES[id]
          const actual = plan.id === id
          return (
            <div key={id} className="card" style={actual ? { borderColor: 'var(--dorado)' } : undefined}>
              <div className="row spread">
                <h3 style={{ margin: 0 }}>{p.nombre}</h3>
                {actual && <span className="pill pill-dorado">Tu plan</span>}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--dorado)' }}>{p.etiquetaPrecio}</div>
              <ul className="muted" style={{ fontSize: 14, paddingLeft: 18, marginTop: 10 }}>
                <li>{p.restaurantes} restaurante{p.restaurantes > 1 ? 's' : ''}</li>
                <li>{p.colaboradores > 0 ? `Hasta ${p.colaboradores} colaboradores` : 'Solo el dueño'}</li>
                <li>{p.limites
                  ? `${p.limites.proveedores} proveedores · ${p.limites.menuItems} ítems`
                  : 'Contenido ilimitado'}</li>
                {p.roles && <li>Roles + bitácora</li>}
              </ul>
              {id !== 'demo' && !actual && (
                <button className="btn btn-dorado btn-bloque mt" onClick={() => yaPague(id)}>
                  Ya pagué este plan
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Instrucciones de pago manual */}
      <div className="aviso aviso-info mt">
        <h3>💳 ¿Cómo pago?</h3>
        <p style={{ margin: '6px 0' }}>Por ahora el pago es manual:</p>
        <ul style={{ paddingLeft: 18 }}>
          <li><b>SINPE Móvil</b> o transferencia al <b>{PAGO_MANUAL.sinpe}</b> ({PAGO_MANUAL.nombre}).</li>
          <li>{PAGO_MANUAL.bancoNota}</li>
          <li>Después tocá <b>“Ya pagué”</b> en el plan elegido y activamos tu cuenta.</li>
        </ul>
      </div>
    </div>
  )
}
