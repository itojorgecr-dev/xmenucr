// XMenú CR — Importación masiva de ingredientes desde Excel.
// Plantilla: codigo (SKU) · nombre · proveedor · cantidad · unidad · precio · nota
import * as XLSX from 'xlsx'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { UNIDADES_VOLUMEN, UNIDADES_MASA, UNIDADES_ABSTRACTAS_BASE } from './constants'
import { chequearLimite } from './limites'

// Descarga la plantilla con el formato esperado y ejemplos.
export function descargarPlantillaIngredientes() {
  const aoa = [
    ['codigo', 'nombre', 'proveedor', 'cantidad', 'unidad', 'precio', 'nota'],
    ['RON-750', 'Ron blanco', 'Licorera El Barril', 750, 'mL', 6500, 'botella 750 mL'],
    ['LIM-KG', 'Limón mesino', 'Verdulería La Fresca', 1, 'kg', 1200, ''],
    ['HIER-RAC', 'Hierbabuena', 'Verdulería La Fresca', 1, 'racimo', 500, ''],
    [],
    ['Unidades válidas:'],
    [`Masa: ${Object.keys(UNIDADES_MASA).join(', ')}`],
    [`Volumen: ${Object.keys(UNIDADES_VOLUMEN).join(', ')}`],
    [`Abstractas: ${UNIDADES_ABSTRACTAS_BASE.join(', ')} (o la que usés, se crea sola)`],
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 24 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ingredientes')
  XLSX.writeFile(wb, 'plantilla-ingredientes-xmenucr.xlsx')
}

const normalizar = (s) => String(s ?? '').trim()
const claveNombre = (s) => normalizar(s).toLocaleLowerCase('es')

// Importa el Excel: crea proveedores que no existan y los ingredientes.
// Devuelve { creados, proveedoresNuevos, errores: [{fila, motivo}] }.
export async function importarIngredientes({ file, empresaId, planId, proveedores, ingredientes }) {
  const data = XLSX.read(await file.arrayBuffer())
  const ws = data.Sheets[data.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json(ws, { defval: '' })

  // Mapa de proveedores por nombre (case-insensitive), se amplía al crear.
  const provPorNombre = new Map(proveedores.map((p) => [claveNombre(p.nombre), p]))
  const conteoPorProveedor = new Map()
  for (const i of ingredientes) {
    conteoPorProveedor.set(i.proveedorId, (conteoPorProveedor.get(i.proveedorId) || 0) + 1)
  }

  let creados = 0
  let proveedoresNuevos = 0
  const errores = []

  for (let idx = 0; idx < filas.length; idx++) {
    const fila = Object.fromEntries(
      Object.entries(filas[idx]).map(([k, v]) => [claveNombre(k), v])
    )
    const numFila = idx + 2 // 1 = encabezado

    const nombre = normalizar(fila.nombre)
    if (!nombre || nombre.startsWith('Unidades válidas')) continue // filas de ayuda/vacías

    const provNombre = normalizar(fila.proveedor)
    const precio = Number(fila.precio)
    const cantidad = Number(fila.cantidad) || 1
    const unidad = normalizar(fila.unidad) || 'cada'

    if (!provNombre) { errores.push({ fila: numFila, motivo: `"${nombre}": falta el proveedor` }); continue }
    if (!(precio >= 0)) { errores.push({ fila: numFila, motivo: `"${nombre}": precio inválido` }); continue }

    // Proveedor: buscar o crear.
    let prov = provPorNombre.get(claveNombre(provNombre))
    if (!prov) {
      const chkProv = chequearLimite(planId, 'proveedores', provPorNombre.size)
      if (!chkProv.permitido) {
        errores.push({ fila: numFila, motivo: `"${nombre}": ${chkProv.mensaje}` })
        continue
      }
      const ref = await addDoc(collection(db, 'proveedores'), {
        empresaId, nombre: provNombre, creadoEl: serverTimestamp(),
      })
      prov = { id: ref.id, nombre: provNombre }
      provPorNombre.set(claveNombre(provNombre), prov)
      proveedoresNuevos++
    }

    // Límite del plan por proveedor.
    const actual = conteoPorProveedor.get(prov.id) || 0
    const chk = chequearLimite(planId, 'ingredientesPorProveedor', actual)
    if (!chk.permitido) {
      errores.push({ fila: numFila, motivo: `"${nombre}": ${chk.mensaje}` })
      continue
    }

    await addDoc(collection(db, 'ingredientes'), {
      empresaId,
      codigo: normalizar(fila.codigo),
      nombre,
      proveedorId: prov.id,
      cantPresentacion: cantidad,
      unidad,
      costo: precio,
      nota: normalizar(fila.nota),
      creadoEl: serverTimestamp(),
    })
    conteoPorProveedor.set(prov.id, actual + 1)
    creados++
  }

  return { creados, proveedoresNuevos, errores }
}
