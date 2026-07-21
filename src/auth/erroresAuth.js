// XMenú CR — Traducción de errores de Firebase Auth al español (es-CR).
const MAPA = {
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña no es correcta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en un rato.',
  'auth/popup-closed-by-user': 'Cerraste la ventana antes de terminar.',
  'auth/cancelled-popup-request': 'Se canceló el ingreso. Probá de nuevo.',
  'auth/network-request-failed': 'Problema de conexión. Revisá tu internet.',
  'auth/operation-not-allowed': 'Ese método de ingreso no está habilitado.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado para el ingreso con Google. Hay que agregarlo en Firebase → Authentication → Configuración → Dominios autorizados.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila y probá de nuevo.',
}

export function traducirErrorAuth(error) {
  const code = error?.code || ''
  return MAPA[code] || 'Ocurrió un error. Probá de nuevo.'
}
