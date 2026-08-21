import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requerido')
    .max(254, 'Email demasiado largo')
    .email('Email inválido')
    .transform(s => s.toLowerCase()),
  password: z
    .string()
    .min(4, 'Contraseña requerida')
    .max(128, 'Contraseña demasiado larga'),
})

// ── Checkout ──────────────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  productoId: z.string().min(1, 'ID de producto inválido'),
  varianteId: z.string().min(1).optional(),
  cantidad: z.number().int().min(1, 'Cantidad mínima: 1').max(100, 'Cantidad máxima: 100'),
  // NOTA: precioUnit ya NO viene del cliente — se busca en BD (fix price manipulation)
})

export const checkoutSchema = z.object({
  cliente: z.object({
    nombre: z.string().min(2, 'Nombre muy corto').max(100).trim(),
    email: z.string().max(254).email('Email inválido').transform(s => s.toLowerCase()),
    telefono: z.string().max(20).optional().or(z.literal('')),
    empresa: z.string().max(100).optional().or(z.literal('')),
  }),
  direccion: z.object({
    calle: z.string().min(3, 'Dirección requerida').max(200).trim(),
    ciudad: z.string().min(2).max(100).trim(),
    provincia: z.string().min(2).max(100).trim(),
    cp: z.string().max(10).optional().or(z.literal('')),
  }),
  notas: z.string().max(500).optional().or(z.literal('')),
  metodoPago: z.enum(['MERCADOPAGO', 'TRANSFERENCIA', 'WHATSAPP', 'EFECTIVO']),
  items: z.array(checkoutItemSchema).min(1, 'El carrito está vacío').max(50, 'Demasiados productos'),
})

// ── Admin — Productos ────────────────────────────────────────────

export const productoSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(200).trim(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug solo puede contener letras minúsculas, números y guiones')
    .trim(),
  descripcion: z.string().max(5000).optional().or(z.literal('')),
  descripcionCorta: z.string().max(300).optional().or(z.literal('')),
  precio: z.number().positive('El precio debe ser positivo').max(99_999_999),
  precioAnterior: z.number().positive().max(99_999_999).nullable().optional(),
  stock: z.number().int().min(0).max(99_999),
  stockMinimo: z.number().int().min(0).max(99_999),
  sku: z.string().max(100).optional().or(z.literal('')).nullable(),
  marca: z.string().max(100).optional().or(z.literal('')),
  imagenes: z.string(), // JSON string validado por separado
  destacado: z.boolean().optional(),
  activo: z.boolean().optional(),
  categoriaId: z.string().min(1, 'Categoría inválida'),
  peso: z.number().positive().max(9999).nullable().optional(),
  tags: z.string(), // JSON string
  dimensiones: z.string().max(200).optional().nullable(),
  mockup3d: z.string().max(20_000_000, 'La estampa del mockup 3D es demasiado pesada. Probá con una imagen más chica.').optional().nullable(), // JSON string, incluye la estampa en base64
  fondo: z.string().max(20_000_000, 'La imagen de fondo es demasiado pesada. Probá con una imagen más chica.').optional().nullable(), // JSON string (FondoBlock), puede incluir imagen en base64
  variantes: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        nombre: z.string().min(1).max(100).trim(),
        valor: z.string().min(1).max(100).trim(),
        precio: z.string().max(20).optional().or(z.literal('')),
        stock: z.string().max(10).optional(),
        sku: z.string().max(100).optional().or(z.literal('')),
      })
    )
    .optional(),
})

// ── Admin — Pedido estado ────────────────────────────────────────

export const pedidoEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']),
})

// ── Admin — Categorías ───────────────────────────────────────────

export const categoriaSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre demasiado largo').trim(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
    .trim(),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  icono: z.string().max(10).optional().or(z.literal('')),
  orden: z.number().int().min(0).max(9999).optional(),
  activa: z.boolean().optional(),
})

// ── Admin — Usuarios ─────────────────────────────────────────────

export const usuarioCreateSchema = z.object({
  email: z
    .string()
    .max(254)
    .email('Email inválido')
    .transform(s => s.toLowerCase()),
  nombre: z.string().min(2, 'Nombre muy corto').max(100).trim(),
  rol: z.enum(['ADMIN', 'OPERADOR']),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Contraseña demasiado larga'),
})

export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(2).max(100).trim().optional(),
  rol: z.enum(['ADMIN', 'OPERADOR']).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
})

// ── Admin — Configuración ────────────────────────────────────────

export const configuracionSchema = z.record(
  z.string().min(1).max(100),
  z.string().max(20_000_000, 'La imagen de fondo es demasiado pesada. Probá con una imagen más chica.') // permite imágenes de fondo en base64 (FONDO_*)
)

// ── Helpers ──────────────────────────────────────────────────────

export function safeParseJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(i => typeof i === 'string') : []
  } catch {
    return []
  }
}
