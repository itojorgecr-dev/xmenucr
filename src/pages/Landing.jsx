// XMenú CR — Landing pública (raíz). Identidad visual de la marca.
// Estructura lista para incrustar videos y capturas más adelante.
import { Link } from 'react-router-dom'
import { MARCA, PLANES, ORDEN_PLANES } from '../lib/constants'

const BLOQUES = [
  { emoji: '⚡', titulo: 'Costeo en vivo', texto: 'Armá cada ítem con ingredientes y recetas; mirá el costo, la utilidad y el % en tiempo real.' },
  { emoji: '📖', titulo: 'Recetas base', texto: 'Creá recetas anidables con costo por servicio y reutilizalas en todo tu menú.' },
  { emoji: '🛒', titulo: 'Pedidos a proveedores', texto: 'Armá el carrito y enviá el pedido por correo o Excel, con o sin precios.' },
  { emoji: '📊', titulo: 'Exportaciones con tu marca', texto: 'Excel con fórmulas vivas y PDF con grupos y ponderados, listos para compartir.' },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <header style={{ padding: '28px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          XMenú<span style={{ color: MARCA.colores.dorado }}> CR</span>
        </div>
        <Link to="/ingresar" className="btn btn-dorado" style={{ padding: '10px 16px' }}>
          Ingresar
        </Link>
      </header>

      <section className="center" style={{ padding: '40px 20px 20px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1 }}>
          Costeá tu menú,<br /><span style={{ color: MARCA.colores.dorado }}>conocé tu utilidad</span>
        </div>
        <p className="muted mt" style={{ fontSize: 18 }}>
          XMenú CR es la herramienta para restaurantes que calcula el costo real de
          cada platillo y te muestra cuánto ganás. Multiempresa, en vivo y en español.
        </p>
        <div className="row center mt-lg" style={{ justifyContent: 'center' }}>
          <Link to="/ingresar" className="btn btn-dorado">Crear cuenta gratis</Link>
          <a href="#precios" className="btn btn-fantasma">Ver precios</a>
        </div>
      </section>

      {/* Bloques con espacio para capturas/videos */}
      <section style={{ maxWidth: 1000, margin: '30px auto', padding: '0 16px', display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {BLOQUES.map((b) => (
          <div key={b.titulo} className="card">
            <div style={{ fontSize: 34 }}>{b.emoji}</div>
            <h3 className="mt">{b.titulo}</h3>
            <p className="muted">{b.texto}</p>
            {/* Espacio reservado para video / captura (se agregará después). */}
            <div className="mt" style={{ aspectRatio: '16/9', borderRadius: 10, border: '1px dashed var(--borde)', display: 'grid', placeItems: 'center', color: 'var(--texto-tenue)', fontSize: 13 }}>
              ▶ Video / captura
            </div>
          </div>
        ))}
      </section>

      {/* Precios y tarifas */}
      <section id="precios" style={{ maxWidth: 1000, margin: '40px auto', padding: '0 16px' }}>
        <h2 className="center">Precios y tarifas</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginTop: 16 }}>
          {ORDEN_PLANES.map((id) => {
            const p = PLANES[id]
            return (
              <div key={id} className="card center">
                <h3>{p.nombre}</h3>
                <div style={{ fontSize: 30, fontWeight: 900, color: MARCA.colores.dorado }}>
                  {p.etiquetaPrecio}
                </div>
                <ul className="muted" style={{ textAlign: 'left', fontSize: 14, paddingLeft: 18, marginTop: 12 }}>
                  <li>{p.restaurantes} restaurante{p.restaurantes > 1 ? 's' : ''}</li>
                  <li>{p.colaboradores > 0 ? `Hasta ${p.colaboradores} colaboradores` : 'Solo el dueño'}</li>
                  <li>{p.limites ? 'Límites del demo' : 'Contenido ilimitado'}</li>
                  {p.roles && <li>Roles + bitácora</li>}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Contacto (el formulario real conecta a Resend en PR4) */}
      <section style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
        <div className="card center">
          <h2>¿Preguntas?</h2>
          <p className="muted">Escribinos y te ayudamos a empezar.</p>
          <a className="btn btn-dorado mt" href="mailto:hola@xmenucr.com">Contactar</a>
        </div>
      </section>

      <footer className="center muted" style={{ padding: '30px 16px 50px', fontSize: 13 }}>
        © {`${new Date().getFullYear()}`} XMenú CR · Términos y privacidad · Hecho en Costa Rica 🇨🇷
      </footer>
    </div>
  )
}
