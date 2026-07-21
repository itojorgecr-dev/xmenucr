// XMenú CR — Fotos de platillos: compresión en el navegador + subida a Storage.
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

const MAX_LADO = 1024
const CALIDAD = 0.8

// Comprime una imagen (File) a JPEG máx 1024px de lado.
export function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir'))),
        'image/jpeg',
        CALIDAD
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagen inválida')) }
    img.src = url
  })
}

// Sube la foto comprimida y devuelve la URL pública.
export async function subirFotoItem({ empresaId, itemId, file }) {
  const blob = await comprimirImagen(file)
  const r = ref(storage, `empresas/${empresaId}/menuItems/${itemId}.jpg`)
  await uploadBytes(r, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(r)
}

export async function borrarFotoItem({ empresaId, itemId }) {
  try {
    await deleteObject(ref(storage, `empresas/${empresaId}/menuItems/${itemId}.jpg`))
  } catch {
    // Si no existe, no pasa nada.
  }
}
