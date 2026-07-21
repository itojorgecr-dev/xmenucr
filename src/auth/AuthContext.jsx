// XMenú CR — Contexto de autenticación (Firebase Auth).
// Google Sign-In + correo/contraseña, verificación de correo OBLIGATORIA
// para cuentas de correo/clave y recuperación de contraseña, con los
// flujos nativos de Firebase (en español).
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

// Foto inmutable del usuario para que React re-renderice al refrescar
// (el objeto de Firebase es mutable y no dispara renders por sí solo).
function fotoDe(u) {
  if (!u) return null
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    emailVerified: u.emailVerified,
    // Solo las cuentas de correo/clave requieren verificación manual;
    // las de Google ya vienen verificadas por Google.
    esPassword: u.providerData.some((p) => p.providerId === 'password'),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(fotoDe(u))
      setCargando(false)
    })
  }, [])

  // Recarga el usuario desde Firebase (para "Ya verifiqué mi correo").
  const refrescar = useCallback(async () => {
    if (!auth.currentUser) return null
    await auth.currentUser.reload()
    const foto = fotoDe(auth.currentUser)
    setUser(foto)
    return foto
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

    refrescar,
  }

  const esSuperadmin = Boolean(user && user.uid === SUPERADMIN_UID)

  // Cuenta de correo/clave sin verificar: se bloquea el ingreso a la app.
  const requiereVerificacion = Boolean(user && user.esPassword && !user.emailVerified)

  return (
    <AuthCtx.Provider value={{ user, cargando, esSuperadmin, requiereVerificacion, ...acciones }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
