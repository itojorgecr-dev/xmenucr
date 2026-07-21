// XMenú CR — Contexto de la empresa activa del usuario.
// Carga las membresías, resuelve la empresa activa y expone acciones.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { empresaPorId, membresiasDe } from '../lib/empresa'
import { PLANES } from '../lib/constants'

const EmpresaCtx = createContext(null)
const LS_EMPRESA = 'xmenucr.empresaActiva'

export function EmpresaProvider({ children }) {
  const { user } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [membresias, setMembresias] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [rol, setRol] = useState(null)

  const [error, setError] = useState(false)

  const cargar = useCallback(async () => {
    if (!user) {
      setMembresias([]); setEmpresa(null); setRol(null); setError(false); setCargando(false)
      return
    }
    setCargando(true)
    setError(false)
    try {
      const mems = await membresiasDe(user.uid)
      setMembresias(mems)

      if (mems.length === 0) {
        setEmpresa(null); setRol(null)
        return
      }
      // Empresa activa: la guardada en localStorage si sigue siendo válida.
      const guardada = localStorage.getItem(LS_EMPRESA)
      const activa =
        mems.find((m) => m.empresaId === guardada) || mems[0]
      const emp = await empresaPorId(activa.empresaId)
      setEmpresa(emp)
      setRol(activa.rol)
      if (emp) localStorage.setItem(LS_EMPRESA, emp.id)
    } catch (e) {
      // Si la carga falla (red, permisos transitorios), NO mandamos al
      // onboarding: se muestra reintento para no crear empresas duplicadas.
      console.error('EmpresaContext:', e)
      setError(true)
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEmpresa = useCallback(async (empresaId) => {
    const mem = membresias.find((m) => m.empresaId === empresaId)
    if (!mem) return
    const emp = await empresaPorId(empresaId)
    setEmpresa(emp); setRol(mem.rol)
    localStorage.setItem(LS_EMPRESA, empresaId)
  }, [membresias])

  const plan = empresa ? PLANES[empresa.plan] || PLANES.demo : PLANES.demo

  return (
    <EmpresaCtx.Provider
      value={{
        cargando, membresias, empresa, rol, plan, error,
        tieneEmpresa: membresias.length > 0,
        recargar: cargar,
        cambiarEmpresa,
      }}
    >
      {children}
    </EmpresaCtx.Provider>
  )
}

export function useEmpresa() {
  const ctx = useContext(EmpresaCtx)
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de <EmpresaProvider>')
  return ctx
}
