import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const requestSchema = z.object({
  nombre: z.string().max(200).optional(),
  url: z.string().url('URL inválida').optional(),
}).refine(d => d.nombre || d.url, { message: 'Se requiere nombre o URL del producto' })

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

const PRIVATE_IP_RE = /^(localhost|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i

async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    if (PRIVATE_IP_RE.test(parsed.hostname)) return null

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HighHopes-Bot/1.0; +https://highhopes.store)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    return html.slice(0, 18000)
  } catch {
    return null
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = []

  // og:image
  const ogMatches = [
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
  ]
  for (const m of ogMatches) {
    if (m?.[1] && !images.includes(m[1])) images.push(m[1])
  }

  // product/cdn image patterns
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null && images.length < 6) {
    const src = m[1]
    if (!src) continue
    if (src.startsWith('data:')) continue
    const lower = src.toLowerCase()
    if (
      lower.includes('product') || lower.includes('item') ||
      lower.includes('cdn') || lower.includes('shop') ||
      /\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower)
    ) {
      try {
        const abs = src.startsWith('http') ? src : new URL(src, baseUrl).href
        if (!images.includes(abs)) images.push(abs)
      } catch { /* ignore relative paths that can't be resolved */ }
    }
  }

  return images.slice(0, 5)
}

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and most tags — keep text content
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada. Agregala en el archivo .env' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { nombre, url } = parsed.data

  const categorias = await db.categoria.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  let htmlContent: string | null = null
  let paginaTexto = ''
  let imagenesDetectadas: string[] = []

  if (url) {
    htmlContent = await fetchUrlContent(url)
    if (htmlContent) {
      imagenesDetectadas = extractImages(htmlContent, url)
      paginaTexto = extractTextFromHtml(htmlContent)
    }
  }

  const categoriasStr = categorias
    .map(c => `  - ID: "${c.id}" → ${c.nombre}`)
    .join('\n')

  const contexto = [
    nombre && `Nombre del producto: "${nombre}"`,
    url && `URL de referencia: ${url}`,
    paginaTexto && `Texto extraído de la página:\n${paginaTexto}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      tools: [
        {
          name: 'generar_producto',
          description:
            'Genera datos estructurados y profesionales para un producto de indumentaria (remeras, buzos, accesorios) en Argentina.',
          input_schema: {
            type: 'object' as const,
            properties: {
              nombre: {
                type: 'string',
                description: 'Nombre del producto en español, claro y descriptivo (máx 100 caracteres)',
              },
              slug: {
                type: 'string',
                description:
                  'Slug para URL: solo letras minúsculas, números y guiones, sin espacios ni acentos',
              },
              descripcionCorta: {
                type: 'string',
                description:
                  'Descripción breve de 1-2 oraciones para mostrar en cards (máx 180 caracteres)',
              },
              descripcion: {
                type: 'string',
                description:
                  'Descripción completa con características técnicas, materiales, beneficios y uso. Puede usar formato markdown básico. Entre 400 y 800 caracteres.',
              },
              marca: {
                type: 'string',
                description: 'Marca o fabricante del producto',
              },
              precioSugerido: {
                type: 'number',
                description:
                  'Precio de venta sugerido en ARS (pesos argentinos), valor numérico sin símbolo',
              },
              tags: {
                type: 'string',
                description:
                  'Tags de búsqueda separados por coma, entre 5 y 8 tags relevantes en minúsculas',
              },
              categoriaId: {
                type: 'string',
                description:
                  'ID exacto de la categoría del listado que mejor corresponde al producto',
              },
              imagenes: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'URLs de imágenes del producto extraídas de la página (dejar vacío si no hay URL)',
              },
            },
            required: [
              'nombre',
              'slug',
              'descripcionCorta',
              'descripcion',
              'tags',
              'categoriaId',
            ],
          },
        },
      ],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `Sos un experto en e-commerce de indumentaria y streetwear en Argentina. Tu tarea es generar datos de producto completos, profesionales y precisos.

${contexto}

Categorías disponibles (usá el ID exacto):
${categoriasStr}${
            imagenesDetectadas.length > 0
              ? `\n\nImágenes detectadas en la página de referencia:\n${imagenesDetectadas.map(i => `  - ${i}`).join('\n')}`
              : ''
          }

Consideraciones:
- Los precios deben ser realistas para el mercado argentino 2026 (ARS)
- La descripción técnica debe ser precisa y útil para el comprador
- El slug debe ser único y descriptivo
- Los tags deben incluir términos de búsqueda que usaría un cultivador
- Elegí la categoría que mejor corresponda al uso principal del producto`,
        },
      ],
    })

    const toolUseBlock = response.content.find(b => b.type === 'tool_use')
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'La IA no pudo generar datos para este producto. Intentá con más detalle.' },
        { status: 500 }
      )
    }

    const data = toolUseBlock.input as Record<string, unknown>

    // Merge detected images with AI-provided ones (detected take priority as they're real)
    const finalImages =
      imagenesDetectadas.length > 0
        ? imagenesDetectadas
        : Array.isArray(data.imagenes)
          ? (data.imagenes as string[])
          : []

    return NextResponse.json({
      ok: true,
      nombre: data.nombre ?? nombre ?? '',
      slug: data.slug ?? '',
      descripcionCorta: data.descripcionCorta ?? '',
      descripcion: data.descripcion ?? '',
      marca: data.marca ?? '',
      precio: data.precioSugerido ?? '',
      tags: data.tags ?? '',
      categoriaId: data.categoriaId ?? categorias[0]?.id ?? '',
      imagenes: finalImages,
    })
  } catch (err) {
    console.error('[AI generar producto]', err)
    const msg =
      err instanceof Error && err.message.includes('API key')
        ? 'API key de Anthropic inválida'
        : 'Error al comunicarse con la IA. Intentá nuevamente.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
