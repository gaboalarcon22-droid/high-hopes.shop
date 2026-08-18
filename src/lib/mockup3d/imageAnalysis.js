'use client';

// Analiza una imagen (estampa) y devuelve métricas + sugerencias de mejora.
// Todo corre en el navegador (canvas), sin enviar nada a un servidor.

const PRINT_WIDTH_CM = 28; // ancho típico de zona de estampado en pecho (A4 aprox.)
const CM_PER_INCH = 2.54;

export async function analyzeImage(img, fileSize = 0, shirtHex = '#f3f3f3') {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // Trabajamos sobre una versión reducida para velocidad
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cw, ch);
  const { data } = ctx.getContext ? ctx.getImageData(0, 0, cw, ch) : ctx.getImageData(0, 0, cw, ch);

  let opaquePx = 0;
  let transparentPx = 0;
  let semiPx = 0;
  let sumL = 0;
  let sumL2 = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  const lum = new Float32Array(cw * ch);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const a = data[i + 3];
    if (a < 8) { transparentPx++; lum[p] = -1; continue; }
    if (a < 250) semiPx++;
    opaquePx++;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[p] = l;
    sumL += l; sumL2 += l * l;
    sumR += r; sumG += g; sumB += b;
  }

  const totalPx = cw * ch;
  const opaqueRatio = opaquePx / totalPx;
  const hasAlpha = transparentPx / totalPx > 0.02;
  const avgL = opaquePx ? sumL / opaquePx : 0;
  const variance = opaquePx ? Math.max(0, sumL2 / opaquePx - avgL * avgL) : 0;
  const contrast = Math.sqrt(variance); // desviación estándar de luminancia (0-128 aprox)
  const avgColor = opaquePx
    ? { r: sumR / opaquePx, g: sumG / opaquePx, b: sumB / opaquePx }
    : { r: 0, g: 0, b: 0 };

  // Nitidez: energía de bordes (Laplaciano simple) sobre píxeles opacos
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const p = y * cw + x;
      if (lum[p] < 0) continue;
      const up = lum[p - cw], dn = lum[p + cw], lf = lum[p - 1], rt = lum[p + 1];
      if (up < 0 || dn < 0 || lf < 0 || rt < 0) continue;
      const lap = Math.abs(4 * lum[p] - up - dn - lf - rt);
      edgeSum += lap;
      edgeCount++;
    }
  }
  const sharpness = edgeCount ? edgeSum / edgeCount : 0;

  // DPI estimado si se imprime a PRINT_WIDTH_CM de ancho
  const printInches = PRINT_WIDTH_CM / CM_PER_INCH;
  const dpi = Math.round(w / printInches);
  const maxWidthAt300 = +(w / 300 * CM_PER_INCH).toFixed(1); // cm a 300dpi
  const maxWidthAt150 = +(w / 150 * CM_PER_INCH).toFixed(1); // cm a 150dpi

  // Contraste contra el color de la camiseta
  const shirtL = hexLuminance(shirtHex);
  const printL = avgL;
  const garmentContrast = Math.abs(shirtL - printL); // 0-255

  const metrics = {
    width: w,
    height: h,
    megapixels: +((w * h) / 1e6).toFixed(1),
    fileSizeKB: Math.round(fileSize / 1024),
    hasAlpha,
    opaqueRatio: +(opaqueRatio * 100).toFixed(0),
    avgBrightness: +avgL.toFixed(0),
    contrast: +contrast.toFixed(0),
    sharpness: +sharpness.toFixed(1),
    dpi,
    maxWidthAt300,
    maxWidthAt150,
    garmentContrast: +garmentContrast.toFixed(0),
    avgColor,
  };

  const suggestions = buildSuggestions(metrics);
  const score = computeScore(metrics);

  return { metrics, suggestions, score };
}

function buildSuggestions(m) {
  const s = [];

  // Resolución
  if (m.width < 1200 || m.height < 1200) {
    s.push({
      level: 'error',
      title: 'Resolución baja',
      text: `La imagen mide ${m.width}×${m.height}px. Para estampado nítido conviene mínimo 1500px en el lado largo. Reescalar un PNG pequeño pixelará la estampa.`,
      action: 'Pide el archivo original más grande, o vectoriza/upscalea la imagen.',
    });
  } else if (m.width < 2000 || m.height < 2000) {
    s.push({
      level: 'warn',
      title: 'Resolución justa',
      text: `${m.width}×${m.height}px sirve para una estampa mediana, pero limita el tamaño máximo de impresión.`,
      action: `A 300 DPI imprimís nítido hasta ~${m.maxWidthAt300} cm de ancho.`,
    });
  } else {
    s.push({
      level: 'ok',
      title: 'Resolución óptima',
      text: `${m.width}×${m.height}px (${m.megapixels} MP). Suficiente para estampas grandes.`,
      action: `A 300 DPI imprimís nítido hasta ~${m.maxWidthAt300} cm de ancho.`,
    });
  }

  // Transparencia / fondo
  if (!m.hasAlpha) {
    s.push({
      level: 'warn',
      title: 'Sin fondo transparente',
      text: 'El PNG no tiene transparencia: se verá un recuadro sólido sobre la tela.',
      action: 'Si la estampa debe ir recortada, elimina el fondo y exporta PNG con alfa.',
    });
  } else {
    s.push({
      level: 'ok',
      title: 'Fondo transparente detectado',
      text: `~${100 - m.opaqueRatio}% del lienzo es transparente. La estampa se integrará a la prenda.`,
      action: 'Verifica que no queden halos blancos en los bordes.',
    });
  }

  // Contraste interno
  if (m.contrast < 25) {
    s.push({
      level: 'warn',
      title: 'Bajo contraste interno',
      text: `La estampa es muy plana (contraste ${m.contrast}). Puede verse apagada al imprimir.`,
      action: 'Aumenta contraste/saturación o añade un contorno para dar definición.',
    });
  }

  // Contraste contra la prenda
  if (m.garmentContrast < 45) {
    s.push({
      level: 'warn',
      title: 'Poca diferencia con la camiseta',
      text: 'El tono medio de la estampa se parece al color de la prenda; se "pierde" visualmente.',
      action: 'Cambia el color de camiseta o añade un fondo/halo de contraste a la estampa.',
    });
  }

  // Nitidez
  if (m.sharpness < 3) {
    s.push({
      level: 'warn',
      title: 'Imagen poco nítida',
      text: 'Bordes suaves/borrosos detectados. Puede deberse a un PNG comprimido o escalado.',
      action: 'Usa el archivo original, aplica enfoque suave (sharpen) o vectoriza el logo.',
    });
  }

  return s;
}

function computeScore(m) {
  let score = 100;
  if (m.width < 1200 || m.height < 1200) score -= 35;
  else if (m.width < 2000 || m.height < 2000) score -= 12;
  if (!m.hasAlpha) score -= 12;
  if (m.contrast < 25) score -= 12;
  if (m.garmentContrast < 45) score -= 10;
  if (m.sharpness < 3) score -= 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hexLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Consejos generales para mejorar la calidad de la muestra/mockup
export const GENERAL_TIPS = [
  'Usa estampas en PNG con fondo transparente y al menos 1500–3000px.',
  'Elige el color de camiseta que más contraste con la estampa.',
  'Centra la estampa y mantené márgenes; evita que toque las costuras.',
  'Gira el modelo 3D y captura desde un ángulo de 3/4 para una muestra más realista.',
  'Activa las sombras de contacto y la luz de estudio para dar volumen.',
  'Para logos y texto, preferí vectores (SVG) o PNG de alta resolución.',
];
