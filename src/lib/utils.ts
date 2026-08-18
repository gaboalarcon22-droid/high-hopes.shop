import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(precio)
}

export function formatFecha(fecha: Date | string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const ESTADOS_PEDIDO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  PREPARANDO: { label: 'Preparando', color: 'bg-purple-100 text-purple-800' },
  ENVIADO: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
} as const

export const METODOS_PAGO = {
  MERCADOPAGO: 'MercadoPago',
  TRANSFERENCIA: 'Transferencia bancaria',
  WHATSAPP: 'Contacto por WhatsApp',
  EFECTIVO: 'Efectivo',
} as const

export function generarMensajeWhatsApp(
  items: Array<{ nombre: string; cantidad: number; precio: number }>,
  total: number,
  numero: string
) {
  const detalle = items
    .map(i => `• ${i.nombre} x${i.cantidad} — ${formatPrecio(i.precio * i.cantidad)}`)
    .join('%0A')
  const mensaje = `Hola! Quiero realizar el siguiente pedido:%0A%0A${detalle}%0A%0A*Total: ${formatPrecio(total)}*%0A%0APor favor confirmenme disponibilidad y forma de pago. Gracias!`
  return `https://wa.me/${numero}?text=${mensaje}`
}
