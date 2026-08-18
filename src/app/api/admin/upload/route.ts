import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_SIZE = 2 * 1024 * 1024
const MAX_FILES = 5

// Magic bytes: verificar que el contenido real coincida con el MIME declarado
const MAGIC: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png':  [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
}

function checkMagicBytes(buffer: Buffer, mime: string): boolean {
  const signatures = MAGIC[mime]
  if (!signatures) return false
  return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const files = formData.getAll('images') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'Sin archivos' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo ${MAX_FILES} imágenes por carga` }, { status: 400 })
  }

  const urls: string[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.name}. Usá JPG, PNG o WebP.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" supera el límite de 2 MB. Comprimila antes de subir.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: `"${file.name}" no es un archivo de imagen válido.` },
        { status: 400 }
      )
    }

    const base64 = buffer.toString('base64')
    urls.push(`data:${file.type};base64,${base64}`)
  }

  return NextResponse.json({ urls })
}
