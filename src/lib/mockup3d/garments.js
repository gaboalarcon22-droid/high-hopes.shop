'use client';

// Calibración: ancho de pecho (plano) del modelo 3D en unidades locales del GLB.
export const CHEST_UNITS = 0.37;
export const CM_PER_INCH = 2.54;

// Anclas de cada zona de estampado en el frame local del modelo (antes de escalar).
// pos = posición base, rotY = orientación de proyección, defScale = tamaño inicial,
// range = límites del desplazamiento del usuario.
export const ZONE_ANCHORS = {
  front:   { pos: [0, 0.04, 0.15],     rotY: 0,             defScale: 0.16, range: { x: [-0.15, 0.15], y: [-0.12, 0.18] } },
  back:    { pos: [0, 0.05, -0.15],    rotY: Math.PI,       defScale: 0.16, range: { x: [-0.15, 0.15], y: [-0.12, 0.18] } },
  sleeveL: { pos: [0.21, 0.17, 0.11],  rotY: 0,  defScale: 0.06, range: { x: [-0.06, 0.06], y: [-0.07, 0.07] } },
  sleeveR: { pos: [-0.21, 0.17, 0.11], rotY: 0,  defScale: 0.06, range: { x: [-0.06, 0.06], y: [-0.07, 0.07] } },
};

// Catálogo de prendas. Cada tipo trae su modelo 3D, tabla de talles (cm),
// perfil de calce (fitShape: escala no uniforme), colores y margen de estampado.
export const GARMENTS = [
  {
    id: 'premium-241',
    name: 'Remera Premium Algodón Peinado 24.1',
    fit: 'Corte clásico / Regular fit',
    source: 'High Hopes',
    model: '/mockup3d/models/tshirt.glb',
    fitShape: { x: 1, y: 1, z: 1 },
    baseSize: 'M',
    printMarginCm: 16,
    colors: [
      { name: 'Blanco', hex: '#f3f3f3' },
      { name: 'Negro', hex: '#1c1c1c' },
      { name: 'Rojo', hex: '#b3261e' },
      { name: 'Azul Marino', hex: '#1f2a44' },
      { name: 'Gris', hex: '#9aa0a6' },
      { name: 'Azul FR', hex: '#2f5fb0' },
      { name: 'Gris Melange', hex: '#b9bcc1' },
    ],
    sizes: {
      S: { ancho: 53, largo: 71 },
      M: { ancho: 55, largo: 72 },
      L: { ancho: 57, largo: 75 },
      XL: { ancho: 61, largo: 82 },
      XXL: { ancho: 63, largo: 83 },
    },
  },
  {
    id: 'oversize',
    name: 'Remera Oversize',
    fit: 'Oversize / Box fit',
    source: 'High Hopes',
    model: '/mockup3d/models/tshirt.glb',
    fitShape: { x: 1.14, y: 1.06, z: 1.14 },
    baseSize: 'M',
    printMarginCm: 14,
    colors: [
      { name: 'Blanco', hex: '#f3f3f3' },
      { name: 'Negro', hex: '#1c1c1c' },
      { name: 'Arena', hex: '#d8c7a8' },
      { name: 'Verde oliva', hex: '#5a6043' },
      { name: 'Gris Melange', hex: '#b9bcc1' },
      { name: 'Azul Marino', hex: '#1f2a44' },
    ],
    sizes: {
      S: { ancho: 56, largo: 70 },
      M: { ancho: 58, largo: 72 },
      L: { ancho: 60, largo: 74 },
      XL: { ancho: 62, largo: 76 },
      XXL: { ancho: 64, largo: 78 },
    },
  },
];

export function getGarment(id) {
  return GARMENTS.find((g) => g.id === id) || GARMENTS[0];
}

export function sizeMeta(garment, size) {
  return garment.sizes[size] || garment.sizes[garment.baseSize];
}

// Escala 3D no uniforme: talle (ancho/largo) × perfil de calce del tipo de prenda.
export function modelScale(garment, size) {
  const base = garment.sizes[garment.baseSize];
  const m = sizeMeta(garment, size);
  const f = garment.fitShape || { x: 1, y: 1, z: 1 };
  const sw = m.ancho / base.ancho;
  const sl = m.largo / base.largo;
  return [sw * f.x, sl * f.y, sw * f.z];
}

// Ancho real de la estampa (cm) a partir del "tamaño" 3D y el talle.
export function decalCmWidth(decalScale, garment, size) {
  const m = sizeMeta(garment, size);
  return (decalScale * m.ancho) / CHEST_UNITS;
}

// Ancho máximo recomendado de estampado para ese talle (cm).
export function printableMaxCm(garment, size) {
  const m = sizeMeta(garment, size);
  return m.ancho - garment.printMarginCm;
}
