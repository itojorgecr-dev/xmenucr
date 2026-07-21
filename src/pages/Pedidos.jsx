// XMenú CR — Pestaña Pedidos (PR1: guía direccional).
// Carrito, con/sin precios, envío por Resend y Excel llegan en PR2/PR4 (§5).
import { useColeccion } from '../lib/useColeccion'
import GuiaVacio from '../components/GuiaVacio'
import Cargando from '../components/Cargando'

export default function Pedidos() {
  const { datos: proveedores, cargando } = useColeccion('proveedores')

  if (cargando) return <Cargando />

  if (proveedores.length === 0) {
    return (
      <GuiaVacio
        emoji="🚚"
        titulo="Necesitás proveedores para hacer pedidos"
        mensaje="Creá un proveedor en ⚙️ Configuración y después armá el pedido con sus ingredientes."
        accion={{ texto: 'Ir a Configuración', a: '/app/config' }}
      />
    )
  }

  return (
    <GuiaVacio
      emoji="🛒"
      titulo="Armá tu primer pedido"
      mensaje="Ya tenés proveedores. El carrito con buscador, toggle con/sin precios y envío por correo se habilita en la siguiente entrega."
    />
  )
}
