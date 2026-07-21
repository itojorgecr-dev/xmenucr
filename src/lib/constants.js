// XMenú CR — Constantes de negocio (planes, límites, unidades).
// Los montos de precios son CONFIGURABLES: se dejan aquí en una sola
// constante para ajustarlos sin tocar la UI.

// ── Planes y tarifas ──
export const PLANES = {
  demo: {
    id: 'demo',
    nombre: 'Demo',
    precio: 0,
    etiquetaPrecio: 'Gratis',
    restaurantes: 1,
    colaboradores: 0, // solo el dueño
    limites: {
      proveedores: 3,
      ingredientesPorProveedor: 10,
      recetas: 2,
      categorias: 2,
      menuItems: 10,
    },
    roles: false,
    bitacora: false,
  },
  personal1: {
    id: 'personal1',
    nombre: 'Personal',
    precio: 8,
    etiquetaPrecio: '$8/mes',
    restaurantes: 1,
    colaboradores: 0,
    limites: null, // ilimitado
    roles: false,
    bitacora: false,
  },
  personal5: {
    id: 'personal5',
    nombre: 'Personal Plus',
    precio: 10,
    etiquetaPrecio: '$10/mes',
    restaurantes: 5,
    colaboradores: 0,
    limites: null,
    roles: false,
    bitacora: false,
  },
  empresarial: {
    id: 'empresarial',
    nombre: 'Empresarial',
    precio: 50,
    etiquetaPrecio: '$50/mes',
    restaurantes: 10,
    colaboradores: 10,
    limites: null,
    roles: true,
    bitacora: true,
  },
}

export const ORDEN_PLANES = ['demo', 'personal1', 'personal5', 'empresarial']

// ── Roles ──
export const ROLES = {
  dueño: { id: 'dueño', nombre: 'Dueño', desc: 'Todo + planes/pago + colaboradores' },
  editor: { id: 'editor', nombre: 'Editor', desc: 'Todo el contenido (no plan ni miembros)' },
  operador: { id: 'operador', nombre: 'Operador', desc: 'Ingredientes y pedidos' },
  lector: { id: 'lector', nombre: 'Lector', desc: 'Solo ve todo' },
}

// Permisos por rol (para gates en la UI; el respaldo real son las reglas).
export const PERMISOS = {
  dueño: { contenido: true, ingredientes: true, pedidos: true, menu: true, recetas: true, plan: true, miembros: true, bitacora: true },
  editor: { contenido: true, ingredientes: true, pedidos: true, menu: true, recetas: true, plan: false, miembros: false, bitacora: true },
  operador: { contenido: false, ingredientes: true, pedidos: true, menu: false, recetas: false, plan: false, miembros: false, bitacora: false },
  lector: { contenido: false, ingredientes: false, pedidos: false, menu: false, recetas: false, plan: false, miembros: false, bitacora: false },
}

// ── Datos de pago manual (SINPE / transferencia) — configurable ──
export const PAGO_MANUAL = {
  sinpe: '8888-8888',
  nombre: 'Jorge (XMenú CR)',
  bancoNota: 'SINPE Móvil o transferencia. Indicá el nombre de tu restaurante en el detalle.',
}

// ── Monedas soportadas ──
export const MONEDAS = {
  CRC: { codigo: 'CRC', simbolo: '₡', nombre: 'Colón (₡)', locale: 'es-CR' },
  USD: { codigo: 'USD', simbolo: '$', nombre: 'Dólar ($)', locale: 'es-CR' },
}
export const MONEDA_POR_DEFECTO = 'CRC'

// ── Tablas de unidades EXACTAS (del módulo Recetas aprobado) ──
// Volumen base: mililitros (mL)
export const UNIDADES_VOLUMEN = {
  gal: 3785.41178,
  L: 1000,
  qt: 946.352946,
  pt: 473.176473,
  cup: 240,
  dL: 100,
  'fl oz': 29.57353,
  tbsp: 14.786765,
  tsp: 4.928922,
  mL: 1,
}

// Masa base: gramos (g)
export const UNIDADES_MASA = {
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
  g: 1,
  mg: 0.001,
}

// Abstractas sin conversión (más las personalizadas por empresa).
export const UNIDADES_ABSTRACTAS_BASE = ['cada', 'racimo', 'pellizco', 'rebanada']

// ── Paleta / identidad ──
export const MARCA = {
  nombre: 'XMenú CR',
  lema: 'Costeá tu menú, conocé tu utilidad',
  colores: {
    fondoTop: '#141233',
    fondoBottom: '#241f4d',
    dorado: '#f9c74f',
  },
}
