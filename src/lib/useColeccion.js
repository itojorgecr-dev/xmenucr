// XMenú CR — Hook para leer una colección filtrada por empresaId (en vivo).
import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useEmpresa } from '../context/EmpresaContext'

export function useColeccion(nombreColeccion, { orderByNombre = true } = {}) {
  const { empresa } = useEmpresa()
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!empresa) return
    setCargando(true)
    const q = query(collection(db, nombreColeccion), where('empresaId', '==', empresa.id))
    const unsub = onSnapshot(
      q,
      (snap) => {
        let arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (orderByNombre) {
          arr = arr.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
        }
        setDatos(arr)
        setCargando(false)
      },
      (err) => { setError(err); setCargando(false) }
    )
    return unsub
  }, [empresa, nombreColeccion, orderByNombre])

  return { datos, cargando, error }
}
