'use client';

// Compositor de texto basado en el alfabeto de imágenes "Kpop1".
// Arma una palabra colocando cada glifo PNG, normalizado por altura y
// alineado a una línea base, con espaciado (tracking) configurable.

export const FONTS = [
  { id: 'kpop1', name: 'Kpop1', base: '/mockup3d/fonts/kpop1/', variants: ['color', 'black'] },
];

export const GLYPH_HEIGHT = 760; // altura interna de cada letra (px)
const SUPPORTED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const cache = new Map(); // url -> {img, trim}

export function getFont(id) {
  return FONTS.find((f) => f.id === id) || FONTS[0];
}

export function isSupported(ch) {
  return SUPPORTED.includes(ch.toUpperCase());
}

function glyphUrl(font, ch, variant) {
  const suffix = variant === 'black' ? '-black' : '';
  return `${font.base}${ch.toUpperCase()}${suffix}.png`;
}

function loadGlyph(url) {
  if (cache.has(url)) return cache.get(url).promise;
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const trim = trimBounds(img);
      const entry = { img, trim };
      cache.set(url, { ...entry, promise });
      resolve(entry);
    };
    img.onerror = reject;
    img.src = url;
  });
  cache.set(url, { promise });
  return promise;
}

// Bounding box de píxeles no transparentes
function trimBounds(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return { x: 0, y: 0, w: c.width, h: c.height };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Compone el texto y devuelve { dataUrl, width, height } o null si no hay nada visible.
// Opciones: variant ('color'|'black'), tracking (espaciado), textColor (hex o '' = original),
// outlineWidth (fracción de la altura, 0 = sin contorno), outlineColor (hex).
export async function composeText(
  text,
  { fontId = 'kpop1', variant = 'color', tracking = 0.05, textColor = '', outlineWidth = 0, outlineColor = '#ffffff' } = {}
) {
  const font = getFont(fontId);
  const chars = [...(text || '').toUpperCase()];

  const H = GLYPH_HEIGHT;
  const gap = tracking * H; // espacio entre glifos
  const spaceW = H * 0.42; // ancho de un espacio en blanco

  // Resolver glifos (en orden), con placeholders para espacios
  const items = [];
  for (const ch of chars) {
    if (ch === ' ') {
      items.push({ space: true });
      continue;
    }
    if (!isSupported(ch)) continue; // ignora signos no disponibles
    const { img, trim } = await loadGlyph(glyphUrl(font, ch, variant));
    const scale = H / trim.h;
    items.push({ img, trim, w: trim.w * scale, scale });
  }

  const glyphs = items.filter((i) => !i.space);
  if (!glyphs.length) return null;

  // Ancho total
  let totalW = 0;
  items.forEach((it, idx) => {
    if (it.space) totalW += spaceW;
    else totalW += it.w;
    if (idx < items.length - 1) totalW += gap;
  });
  const pad = Math.round(H * 0.06);
  const canvasW = Math.ceil(totalW) + pad * 2;
  const canvasH = H + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  let x = pad;
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    if (it.space) {
      x += spaceW + gap;
      continue;
    }
    // alineado a línea base inferior (bottom)
    ctx.drawImage(
      it.img,
      it.trim.x, it.trim.y, it.trim.w, it.trim.h,
      x, pad, it.w, H
    );
    x += it.w + gap;
  }

  // Recolorear las letras (tinte sólido) si se eligió un color
  if (textColor) recolor(canvas, textColor);

  // Contorno alrededor de las letras
  let final = canvas;
  if (outlineWidth > 0) {
    final = addOutline(canvas, Math.round(outlineWidth * H), outlineColor);
  }

  return { dataUrl: final.toDataURL('image/png'), width: final.width, height: final.height };
}

function recolor(canvas, color) {
  const ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
}

function addOutline(base, ow, color) {
  // Silueta del texto en el color del contorno
  const sil = document.createElement('canvas');
  sil.width = base.width;
  sil.height = base.height;
  const sctx = sil.getContext('2d');
  sctx.drawImage(base, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = color;
  sctx.fillRect(0, 0, sil.width, sil.height);

  const out = document.createElement('canvas');
  out.width = base.width + ow * 2;
  out.height = base.height + ow * 2;
  const octx = out.getContext('2d');
  // Estampar la silueta en un anillo de offsets para formar el contorno
  const steps = 20;
  for (let r = ow; r >= Math.max(1, ow * 0.5); r -= Math.max(1, ow * 0.5)) {
    for (let a = 0; a < steps; a++) {
      const ang = (a / steps) * Math.PI * 2;
      octx.drawImage(sil, ow + Math.cos(ang) * r, ow + Math.sin(ang) * r);
    }
  }
  // Texto original encima
  octx.drawImage(base, ow, ow);
  return out;
}
