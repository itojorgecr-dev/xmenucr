// XMenú CR — Set pequeño de artículos "de prueba" para explorar.
// Todo lo sembrado lleva `dePrueba:true` y se puede borrar de un botón.
export const SEMILLA = {
  proveedores: [
    { clave: 'verduleria', nombre: 'Verdulería La Fresca (prueba)', contacto: '8888-0001' },
    { clave: 'licorera', nombre: 'Licorera El Barril (prueba)', contacto: '8888-0002' },
  ],
  categorias: [
    { clave: 'cocteles', nombre: 'Cócteles (prueba)' },
    { clave: 'entradas', nombre: 'Entradas (prueba)' },
  ],
  ingredientes: [
    { nombre: 'Limón (prueba)', proveedor: 'verduleria', costo: 1200, unidad: 'kg', cantPresentacion: 1, nota: 'viene por kilo' },
    { nombre: 'Ron blanco (prueba)', proveedor: 'licorera', costo: 6500, unidad: 'mL', cantPresentacion: 750, nota: 'botella de 750 mL' },
    { nombre: 'Azúcar (prueba)', proveedor: 'verduleria', costo: 900, unidad: 'kg', cantPresentacion: 1 },
    { nombre: 'Hierbabuena (prueba)', proveedor: 'verduleria', costo: 500, unidad: 'racimo', cantPresentacion: 1, nota: 'racimo' },
  ],
  recetas: [
    { nombre: 'Almíbar simple (prueba)', servicios: 20, nota: 'base para cócteles' },
    { nombre: 'Mezcla mojito (prueba)', servicios: 10 },
  ],
  menuItems: [
    { nombre: 'Mojito clásico (prueba)', categoria: 'cocteles', precioVenta: 3500 },
    { nombre: 'Daiquiri de limón (prueba)', categoria: 'cocteles', precioVenta: 3800 },
    { nombre: 'Ceviche de la casa (prueba)', categoria: 'entradas', precioVenta: 4500 },
  ],
}
