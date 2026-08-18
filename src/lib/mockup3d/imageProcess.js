'use client';
import { hexToRgb } from '@/lib/mockup3d/imageAnalysis';

// Procesa la estampa según los ajustes y devuelve un nuevo data URL (PNG).
// Corre 100% en el navegador con <canvas>.

export const DEFAULT_ADJUST = {
  brightness: 100, // %
  contrast: 100, // %
  saturation: 100, // %
  removeBg: false, // quitar fondo claro
  bgThreshold: 240, // 0-255: qué tan claro debe ser para volverse transparente
  sharpen: false, // realce de bordes
  removeColors: [], // colores (hex) del diseño a volver transparentes
  colorTol: 46, // tolerancia de coincidencia de color (0-120)
};

export const PRESETS = {
  original: { label: 'Original', adjust: { ...DEFAULT_ADJUST } },
  auto: { label: 'Auto realce', adjust: { ...DEFAULT_ADJUST, brightness: 104, contrast: 118, saturation: 112, sharpen: true } },
  vivid: { label: 'Vívido', adjust: { ...DEFAULT_ADJUST, contrast: 122, saturation: 150 } },
  punch: { label: 'Alto contraste', adjust: { ...DEFAULT_ADJUST, brightness: 100, contrast: 145, saturation: 110, sharpen: true } },
  soft: { label: 'Suave', adjust: { ...DEFAULT_ADJUST, brightness: 106, contrast: 92, saturation: 96 } },
  bw: { label: 'Blanco y negro', adjust: { ...DEFAULT_ADJUST, saturation: 0, contrast: 120 } },
  cutout: { label: 'Recortar fondo', adjust: { ...DEFAULT_ADJUST, removeBg: true, bgThreshold: 238 } },
};

const PREVIEW_MAX_SIDE = 1600; // límite de trabajo para la textura del mockup

// Render para el MOCKUP (rápido, acotado)
export async function processImage(img, adjust = DEFAULT_ADJUST) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(w, h));
  const canvas = renderToCanvas(img, adjust, Math.round(w * scale), Math.round(h * scale));
  return canvas.toDataURL('image/png');
}

// Render a RESOLUCIÓN EXACTA (para exportar artwork DTF). Devuelve el canvas.
export function renderArtwork(img, adjust, targetW, targetH) {
  return renderToCanvas(img, adjust, targetW, targetH);
}

function renderToCanvas(img, adjust, cw, ch) {
  cw = Math.max(1, cw);
  ch = Math.max(1, ch);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.filter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%)`;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, cw, ch);
  ctx.filter = 'none';

  let imageData = ctx.getImageData(0, 0, cw, ch);

  if (adjust.removeBg) removeLightBackground(imageData, adjust.bgThreshold);
  if (adjust.removeColors && adjust.removeColors.length) {
    // Coincidir contra los colores ORIGINALES (sin filtros de tono) para que
    // el recorte sea consistente aunque se ajuste brillo/contraste.
    const matchCanvas = document.createElement('canvas');
    matchCanvas.width = cw;
    matchCanvas.height = ch;
    const mctx = matchCanvas.getContext('2d', { willReadFrequently: true });
    mctx.drawImage(img, 0, 0, cw, ch);
    const matchData = mctx.getImageData(0, 0, cw, ch);
    removeSpecificColors(imageData, matchData, adjust.removeColors, adjust.colorTol ?? 46);
  }
  if (adjust.sharpen) imageData = sharpenImage(imageData, cw, ch);

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Vuelve transparentes los píxeles claros/desaturados (típico fondo blanco)
function removeLightBackground(imageData, threshold) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    if (max >= threshold && sat < 30) {
      const t = Math.min(1, (max - threshold) / (255 - threshold));
      d[i + 3] = Math.round(d[i + 3] * (1 - t));
    }
  }
}

// Vuelve transparentes los píxeles cercanos a los colores indicados (separación de color).
// `matchData` son los píxeles ORIGINALES contra los que se compara (si no, los mismos).
function removeSpecificColors(imageData, matchData, colors, tol) {
  const d = imageData.data;
  const m = (matchData || imageData).data;
  const targets = colors.map((c) => (typeof c === 'string' ? hexToRgb(c) : hexToRgb(c.hex)));
  const t2 = tol * tol * 3; // umbral en distancia cuadrada
  const feather = t2 * 2.4; // rango ampliado para barrer halos/bordes anti-alias
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = m[i], g = m[i + 1], b = m[i + 2];
    let best = Infinity;
    for (const t of targets) {
      const dr = r - t.r, dg = g - t.g, db = b - t.b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < best) best = dist;
    }
    if (best <= t2) {
      d[i + 3] = 0;
    } else if (best <= feather) {
      const k = (best - t2) / (feather - t2);
      d[i + 3] = Math.round(d[i + 3] * k);
    }
  }
}

// Realce de bordes (unsharp simple 3x3)
function sharpenImage(imageData, w, h) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.min(w - 1, Math.max(0, x + kx));
            const py = Math.min(h - 1, Math.max(0, y + ky));
            sum += src[(py * w + px) * 4 + c] * k[ki++];
          }
        }
        out[idx + c] = sum;
      }
      out[idx + 3] = src[idx + 3];
    }
  }
  return new ImageData(out, w, h);
}

// Extrae los colores dominantes (hex) de una imagen, ignorando transparentes.
export function extractPalette(img, maxColors = 6) {
  const side = 72;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, side, side);
  const { data } = ctx.getImageData(0, 0, side, side);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) continue;
    const r = data[i] & 0xe0; // cuantiza a buckets de 32
    const g = data[i + 1] & 0xe0;
    const b = data[i + 2] & 0xe0;
    const key = (r << 16) | (g << 8) | b;
    const e = buckets.get(key);
    if (e) { e.n++; e.r += data[i]; e.g += data[i + 1]; e.b += data[i + 2]; }
    else buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, maxColors)
    .map((e) => rgbToHex(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)));
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
