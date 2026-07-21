// XMenú CR — Exportaciones con formato de marca.
// Excel (SheetJS) con encabezado, fórmulas vivas y fila de ponderado.
// PDF (jsPDF + autotable) con banda de marca, grupos y ponderados.
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MARCA } from './constants'
import { formatMoneda, formatPorcentaje } from './format'

const AZUL = [20, 18, 51]
const AZUL_2 = [42, 36, 86]
const DORADO = [249, 199, 79]

const hoy = () => new Date().toLocaleDateString('es-CR')
const archivo = (nombre) => `${nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}`

// ── Excel ──────────────────────────────────────────────────────

function hojaConMarca(titulo, empresaNombre, encabezados, filas) {
  const aoa = [
    [`${MARCA.nombre} — ${MARCA.lema}`],
    [`${titulo} · ${empresaNombre} · ${hoy()}`],
    [],
    encabezados,
    ...filas,
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = encabezados.map((h) => ({ wch: Math.max(14, String(h).length + 4) }))
  return ws
}

// Menú: fórmulas vivas de utilidad y % + fila de ponderado.
export function exportarMenuExcel({ items, empresaNombre, catPorId, restPorId }) {
  const encabezados = ['Ítem', 'Categoría', 'Restaurante', 'Venta', 'Costo', 'Utilidad', '% Costo']
  const filas = items.map((it) => [
    it.nombre, catPorId[it.categoria] || '', restPorId[it.restauranteId] || '',
    it.costeo.venta, it.costeo.costo, 0, 0,
  ])
  const ws = hojaConMarca('Menú costeado', empresaNombre, encabezados, filas)

  const inicio = 4 // fila 5 en Excel (0-based r=4)
  items.forEach((_, i) => {
    const r = inicio + i + 1 // número de fila Excel
    ws[`F${r}`] = { t: 'n', f: `D${r}-E${r}` }
    ws[`G${r}`] = { t: 'n', f: `IF(D${r}=0,0,E${r}/D${r})`, z: '0.0%' }
  })
  // Fila de ponderado con fórmulas vivas.
  const rTot = inicio + items.length + 1
  const rFin = rTot - 1
  ws[`A${rTot}`] = { t: 's', v: 'PONDERADO' }
  ws[`D${rTot}`] = { t: 'n', f: `SUM(D${inicio + 1}:D${rFin})` }
  ws[`E${rTot}`] = { t: 'n', f: `SUM(E${inicio + 1}:E${rFin})` }
  ws[`F${rTot}`] = { t: 'n', f: `D${rTot}-E${rTot}` }
  ws[`G${rTot}`] = { t: 'n', f: `IF(D${rTot}=0,0,E${rTot}/D${rTot})`, z: '0.0%' }
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rTot - 1, c: 6 } })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Menú')
  XLSX.writeFile(wb, `${archivo('menu ' + empresaNombre)}.xlsx`)
}

export function exportarIngredientesExcel({ ingredientes, provPorId, empresaNombre }) {
  const encabezados = ['Código', 'Ingrediente', 'Proveedor', 'Cantidad', 'Unidad', 'Precio', 'Nota']
  const filas = ingredientes.map((i) => [
    i.codigo || '', i.nombre, provPorId[i.proveedorId] || '',
    Number(i.cantPresentacion) || 0, i.unidad, Number(i.costo) || 0, i.nota || '',
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, hojaConMarca('Ingredientes', empresaNombre, encabezados, filas), 'Ingredientes')
  XLSX.writeFile(wb, `${archivo('ingredientes ' + empresaNombre)}.xlsx`)
}

export function exportarListaPreciosExcel({ proveedor, ingredientes, empresaNombre }) {
  const encabezados = ['Código', 'Producto', 'Cantidad', 'Unidad', 'Precio', 'Nota']
  const filas = ingredientes.map((i) => [
    i.codigo || '', i.nombre, Number(i.cantPresentacion) || 0, i.unidad, Number(i.costo) || 0, i.nota || '',
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,
    hojaConMarca(`Lista de precios — ${proveedor.nombre}`, empresaNombre, encabezados, filas), 'Precios')
  XLSX.writeFile(wb, `${archivo('precios ' + proveedor.nombre)}.xlsx`)
}

// Pedido a proveedor (con o sin precios).
export function exportarPedidoExcel({ empresaNombre, proveedorNombre, lineas, conPrecios, total }) {
  const encabezados = conPrecios
    ? ['Producto', 'Cantidad', 'Presentación', 'Precio unit.', 'Subtotal']
    : ['Producto', 'Cantidad', 'Presentación']
  const filas = lineas.map((l) => conPrecios
    ? [l.nombre, l.cantidad, l.presentacion, Number(l.costoUnit) || 0, (Number(l.cantidad) || 0) * (Number(l.costoUnit) || 0)]
    : [l.nombre, l.cantidad, l.presentacion])
  if (conPrecios) filas.push(['TOTAL', '', '', '', Number(total) || 0])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,
    hojaConMarca(`Pedido — ${proveedorNombre}`, empresaNombre, encabezados, filas), 'Pedido')
  XLSX.writeFile(wb, `${archivo('pedido ' + proveedorNombre)}.xlsx`)
}

// ── PDF ────────────────────────────────────────────────────────

function bandaDeMarca(doc, titulo, empresaNombre) {
  doc.setFillColor(...AZUL)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, 'F')
  doc.setTextColor(...DORADO)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text(MARCA.nombre, 14, 10)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`${titulo} · ${empresaNombre} · ${hoy()}`, 14, 18)
}

const estiloTabla = {
  styles: { fontSize: 9, cellPadding: 2.5 },
  headStyles: { fillColor: AZUL_2, textColor: DORADO, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [245, 244, 252] },
  startY: 30,
}

// Menú agrupado por categoría, con ponderado por grupo y total.
export function exportarMenuPDF({ items, empresaNombre, catPorId, restPorId, moneda }) {
  const doc = new jsPDF()
  bandaDeMarca(doc, 'Menú costeado', empresaNombre)

  const grupos = {}
  for (const it of items) {
    const cat = catPorId[it.categoria] || 'Sin categoría'
    ;(grupos[cat] = grupos[cat] || []).push(it)
  }

  const body = []
  const filaPonderado = (etiqueta, lista) => {
    const v = lista.reduce((s, x) => s + x.costeo.venta, 0)
    const c = lista.reduce((s, x) => s + x.costeo.costo, 0)
    return [
      { content: etiqueta, styles: { fontStyle: 'bold' } },
      { content: formatMoneda(v, moneda), styles: { fontStyle: 'bold' } },
      { content: formatMoneda(c, moneda), styles: { fontStyle: 'bold' } },
      { content: formatMoneda(v - c, moneda), styles: { fontStyle: 'bold' } },
      { content: formatPorcentaje(v > 0 ? (c / v) * 100 : 0), styles: { fontStyle: 'bold' } },
    ]
  }

  for (const [cat, lista] of Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b, 'es'))) {
    body.push([{
      content: cat, colSpan: 5,
      styles: { fillColor: AZUL_2, textColor: DORADO, fontStyle: 'bold' },
    }])
    for (const it of lista) {
      body.push([
        `${it.nombre}${restPorId && Object.keys(restPorId).length > 1 ? ` (${restPorId[it.restauranteId] || ''})` : ''}`,
        formatMoneda(it.costeo.venta, moneda),
        formatMoneda(it.costeo.costo, moneda),
        formatMoneda(it.costeo.utilidad, moneda),
        formatPorcentaje(it.costeo.pctCosto),
      ])
    }
    body.push(filaPonderado(`Ponderado ${cat}`, lista))
  }
  body.push(filaPonderado('PONDERADO TOTAL', items))

  autoTable(doc, {
    ...estiloTabla,
    head: [['Ítem', 'Venta', 'Costo', 'Utilidad', '% Costo']],
    body,
  })
  doc.save(`${archivo('menu ' + empresaNombre)}.pdf`)
}

export function exportarIngredientesPDF({ ingredientes, provPorId, empresaNombre, moneda }) {
  const doc = new jsPDF()
  bandaDeMarca(doc, 'Ingredientes', empresaNombre)
  autoTable(doc, {
    ...estiloTabla,
    head: [['Código', 'Ingrediente', 'Proveedor', 'Presentación', 'Precio', 'Nota']],
    body: ingredientes.map((i) => [
      i.codigo || '', i.nombre, provPorId[i.proveedorId] || '',
      `${i.cantPresentacion} ${i.unidad}`, formatMoneda(i.costo, moneda), i.nota || '',
    ]),
  })
  doc.save(`${archivo('ingredientes ' + empresaNombre)}.pdf`)
}

export function exportarListaPreciosPDF({ proveedor, ingredientes, empresaNombre, moneda }) {
  const doc = new jsPDF()
  bandaDeMarca(doc, `Lista de precios — ${proveedor.nombre}`, empresaNombre)
  autoTable(doc, {
    ...estiloTabla,
    head: [['Código', 'Producto', 'Presentación', 'Precio', 'Nota']],
    body: ingredientes.map((i) => [
      i.codigo || '', i.nombre, `${i.cantPresentacion} ${i.unidad}`,
      formatMoneda(i.costo, moneda), i.nota || '',
    ]),
  })
  doc.save(`${archivo('precios ' + proveedor.nombre)}.pdf`)
}
