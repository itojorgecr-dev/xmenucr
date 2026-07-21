// XMenú CR — Capa de datos multiempresa sobre Firestore.
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, writeBatch, serverTimestamp, deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { MONEDA_POR_DEFECTO } from './constants'
import { SEMILLA } from './seed'

// ID determinístico del miembro: {empresaId}_{uid}
export const miembroId = (empresaId, uid) => `${empresaId}_${uid}`

// Devuelve las membresías activas del usuario (una empresa por membresía).
export async function membresiasDe(uid) {
  const q = query(collection(db, 'miembros'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function empresaPorId(empresaId) {
  const s = await getDoc(doc(db, 'empresas', empresaId))
  return s.exists() ? { id: s.id, ...s.data() } : null
}

// Onboarding: crea la empresa (dueño), su miembro y el primer restaurante.
export async function crearEmpresaConRestaurante({ uid, correo, nombreRestaurante }) {
  // 1) empresa (plan demo por defecto)
  const empresaRef = doc(collection(db, 'empresas'))
  await setDoc(empresaRef, {
    nombre: nombreRestaurante.trim(),
    ownerUid: uid,
    plan: 'demo',
    estadoPago: 'al_dia',
    moneda: MONEDA_POR_DEFECTO,
    creadaEl: serverTimestamp(),
  })

  // 2) miembro dueño (id determinístico para las reglas)
  await setDoc(doc(db, 'miembros', miembroId(empresaRef.id, uid)), {
    empresaId: empresaRef.id,
    uid,
    correo: correo || '',
    rol: 'dueño',
    estado: 'activo',
    creadaEl: serverTimestamp(),
  })

  // 3) primer restaurante
  const restauranteRef = await addDoc(collection(db, 'restaurantes'), {
    empresaId: empresaRef.id,
    nombre: nombreRestaurante.trim(),
    creadoEl: serverTimestamp(),
  })

  return { empresaId: empresaRef.id, restauranteId: restauranteRef.id }
}

// Siembra un set pequeño de artículos de prueba, marcados `dePrueba:true`.
export async function sembrarArticulosPrueba({ empresaId, restauranteId }) {
  const batch = writeBatch(db)
  const base = { empresaId, dePrueba: true, creadoEl: serverTimestamp() }

  const provRefs = {}
  for (const p of SEMILLA.proveedores) {
    const ref = doc(collection(db, 'proveedores'))
    provRefs[p.clave] = ref.id
    batch.set(ref, { ...base, nombre: p.nombre, contacto: p.contacto || '' })
  }

  const catRefs = {}
  for (const c of SEMILLA.categorias) {
    const ref = doc(collection(db, 'categorias'))
    catRefs[c.clave] = ref.id
    batch.set(ref, { ...base, nombre: c.nombre })
  }

  for (const ing of SEMILLA.ingredientes) {
    const ref = doc(collection(db, 'ingredientes'))
    batch.set(ref, {
      ...base,
      nombre: ing.nombre,
      proveedorId: provRefs[ing.proveedor] || '',
      costo: ing.costo,
      unidad: ing.unidad,
      cantPresentacion: ing.cantPresentacion,
      nota: ing.nota || '',
    })
  }

  for (const r of SEMILLA.recetas) {
    const ref = doc(collection(db, 'recetas'))
    batch.set(ref, { ...base, nombre: r.nombre, servicios: r.servicios, nota: r.nota || '' })
  }

  for (const m of SEMILLA.menuItems) {
    const ref = doc(collection(db, 'menuItems'))
    batch.set(ref, {
      ...base,
      restauranteId,
      nombre: m.nombre,
      categoria: catRefs[m.categoria] || '',
      precioVenta: m.precioVenta,
    })
  }

  await batch.commit()
}

// Borra SOLO los artículos sembrados (dePrueba:true) de la empresa.
export async function eliminarArticulosPrueba(empresaId) {
  const colecciones = ['proveedores', 'categorias', 'ingredientes', 'recetas', 'menuItems']
  let borrados = 0
  for (const col of colecciones) {
    const q = query(
      collection(db, col),
      where('empresaId', '==', empresaId),
      where('dePrueba', '==', true)
    )
    const snap = await getDocs(q)
    // Lotes de máx 400 para no pasar el límite de 500 por batch.
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
      borrados += Math.min(400, snap.docs.length - i)
    }
  }
  return borrados
}

// Restaurantes de una empresa (para Config y selector).
export async function restaurantesDe(empresaId) {
  const q = query(collection(db, 'restaurantes'), where('empresaId', '==', empresaId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
}

// Registro en bitácora (quién / qué / cuándo).
export async function registrarBitacora({ empresaId, uid, correo, accion, detalle }) {
  try {
    await addDoc(collection(db, 'bitacora'), {
      empresaId, uid, correo: correo || '', accion, detalle: detalle || '',
      cuando: serverTimestamp(),
    })
  } catch {
    // La bitácora no debe bloquear la acción principal.
  }
}

export { deleteDoc, updateDoc }
