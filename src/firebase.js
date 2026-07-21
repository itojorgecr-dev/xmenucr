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

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Flujos nativos de Firebase Auth en español (verificación / reset).
auth.languageCode = 'es'

export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)

// UID del superadmin (Jorge). Además del custom claim `superadmin` en el
// token, dejamos este fallback por UID para el panel del cliente.
export const SUPERADMIN_UID = import.meta.env.VITE_SUPERADMIN_UID || ''

export default app
