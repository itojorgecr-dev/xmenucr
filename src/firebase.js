// XMenú CR — Inicialización del SDK de Firebase (cliente).
// La config es pública (se sirve al navegador); las claves secretas
// (service account, Resend, Anthropic) viven SOLO en Vercel como
// variables sin prefijo VITE_ y se usan desde /api/*.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseListo = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// Si faltan las variables VITE_FIREBASE_*, NO inicializamos el SDK:
// getAuth() lanza auth/invalid-api-key al importar el módulo y la SPA
// quedaría en blanco. Con app=null, App muestra la pantalla de
// "Falta configurar Firebase" con los pasos.
let app = null
let auth = null
let googleProvider = null
let db = null
let storage = null

if (firebaseListo) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Flujos nativos de Firebase Auth en español (verificación / reset).
  auth.languageCode = 'es'
  googleProvider = new GoogleAuthProvider()
  db = getFirestore(app)
  storage = getStorage(app)
}

export { auth, googleProvider, db, storage }

// Superadmin (Jorge): por correo. La app activa el custom claim
// `superadmin` (fuente de verdad de las reglas) vía /api/claim-superadmin.
// El UID por variable de entorno queda como respaldo opcional.
export const SUPERADMIN_CORREO = 'itojorgecr@gmail.com'
export const SUPERADMIN_UID = import.meta.env.VITE_SUPERADMIN_UID || ''

export default app
