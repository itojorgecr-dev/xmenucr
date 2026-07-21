// XMenú CR — Contexto de autenticación (Firebase Auth).
// Google Sign-In + correo/contraseña, verificación de correo y
// recuperación de contraseña con los flujos nativos de Firebase (en es).
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider, SUPERADMIN_UID } from '../firebase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setCargando(false)
    })
  }, [])

  const acciones = {
    ingresarGoogle: () => signInWithPopup(auth, googleProvider),

    ingresarCorreo: (correo, clave) =>
      signInWithEmailAndPassword(auth, correo, clave),

    registrarCorreo: async (correo, clave, nombre) => {
      const cred = await createUserWithEmailAndPassword(auth, correo, clave)
      if (nombre) await updateProfile(cred.user, { displayName: nombre })
      // Verificación de correo (plantilla en español desde Firebase Auth).
      await sendEmailVerification(cred.user)
      return cred
    },

    reenviarVerificacion: () =>
      auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve(),

    recuperarClave: (correo) => sendPasswordResetEmail(auth, correo),

    salir: () => signOut(auth),
  }

  const esSuperadmin = Boolean(
    user &&
      (user.uid === SUPERADMIN_UID ||
        // Custom claim `superadmin` (fuente de verdad para las reglas).
        false)
  )

  return (
    <AuthCtx.Provider value={{ user, cargando, esSuperadmin, ...acciones }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
