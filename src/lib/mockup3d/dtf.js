'use client';
import { renderArtwork } from '@/lib/mockup3d/imageProcess';

// Exporta la estampa a tamaño REAL de impresión (cm) a la densidad indicada (DTF),
// con todas las mejoras/ajustes aplicados y fondo transparente.
export async function exportDTF({ img, adjust, cmWidth, dpi = 300, name = 'estampa', zone = 'frente' }) {
  const aspect = img.naturalHeight / img.naturalWidth;
  const cmHeight = cmWidth * aspect;
  const targetW = Math.max(1, Math.round((cmWidth / 2.54) * dpi));
  const targetH = Math.max(1, Math.round((cmHeight / 2.54) * dpi));

  const canvas = renderArtwork(img, adjust, targetW, targetH);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const withDpi = await injectPhys(blob, dpi);

  const fname = `${slug(name)}-${zone}-${cmWidth.toFixed(0)}x${cmHeight.toFixed(0)}cm-${dpi}dpi.png`;
  downloadBlob(withDpi, fname);

  return {
    fileName: fname,
    px: { w: targetW, h: targetH },
    cm: { w: +cmWidth.toFixed(1), h: +cmHeight.toFixed(1) },
    dpi,
    nativeDpi: Math.round(img.naturalWidth / (cmWidth / 2.54)),
  };
}

function slug(s) {
  return (s || 'estampa').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 40);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Inserta un chunk pHYs en el PNG para fijar la densidad (DPI) real de impresión.
async function injectPhys(blob, dpi) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const ppm = Math.round(dpi / 0.0254); // píxeles por metro

  // pHYs: 4 bytes ppuX, 4 bytes ppuY, 1 byte unit(1=metro)
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppm);
  dv.setUint32(4, ppm);
  data[8] = 1;
  const chunk = buildChunk('pHYs', data);

  // El IHDR ocupa: firma(8) + len(4)+type(4)+data(13)+crc(4) = 8 + 25 = 33
  const insertAt = 33;
  const out = new Uint8Array(buf.length + chunk.length);
  out.set(buf.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(buf.subarray(insertAt), insertAt + chunk.length);
  return new Blob([out], { type: 'image/png' });
}

function buildChunk(type, data) {
  const typeBytes = new Uint8Array([...type].map((c) => c.charCodeAt(0)));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);

  const chunk = new Uint8Array(4 + body.length + 4);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, data.length);
  chunk.set(body, 4);
  dv.setUint32(4 + body.length, crc32(body));
  return chunk;
}

let CRC_TABLE = null;
function crc32(bytes) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
