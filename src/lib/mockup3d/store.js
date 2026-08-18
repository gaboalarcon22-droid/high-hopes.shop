'use client';
import { create } from 'zustand';
import { DEFAULT_ADJUST } from '@/lib/mockup3d/imageProcess';
import { GARMENTS, getGarment, ZONE_ANCHORS } from '@/lib/mockup3d/garments';

// Estado por zona de estampado (frente / dorso / mangas)
const emptyZone = (zoneId = 'front') => ({
  mode: 'image', // 'image' | 'text' — tipo de estampa que se está editando
  source: null, // 'image' | 'text' — origen del decal actual
  originalImg: null,
  decalUrl: null,
  decalName: null,
  decalMeta: null,
  palette: [],
  // Texto (alfabeto Kpop1) + mejoras propias de texto
  text: '',
  textVariant: 'color',
  tracking: 0.05,
  textColor: '', // '' = colores originales del alfabeto
  outlineWidth: 0, // contorno (fracción de la altura)
  outlineColor: '#ffffff',
  // Transformación = desplazamiento del usuario respecto del ancla de la zona
  scale: ZONE_ANCHORS[zoneId]?.defScale ?? 0.16,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  adjust: { ...DEFAULT_ADJUST, removeColors: [] },
  activePreset: 'original',
  analysis: null,
});

export const ZONES = [
  { id: 'front', label: 'Frente' },
  { id: 'back', label: 'Dorso' },
  { id: 'sleeveL', label: 'Manga Izq' },
  { id: 'sleeveR', label: 'Manga Der' },
];

export const useStudio = create((set, get) => ({
  // Prenda y talle
  garmentId: GARMENTS[0].id,
  size: GARMENTS[0].baseSize,
  setGarment: (garmentId) =>
    set((s) => {
      const g = getGarment(garmentId);
      const palette = g.colors.map((c) => c.hex);
      const size = g.sizes[s.size] ? s.size : g.baseSize;
      const shirtColor = palette.includes(s.shirtColor) ? s.shirtColor : palette[0];
      return { garmentId, size, shirtColor };
    }),
  setSize: (size) => set({ size }),

  // Color de la prenda
  shirtColor: GARMENTS[0].colors[0].hex,
  setShirtColor: (shirtColor) => set({ shirtColor }),

  // Zonas de estampado
  zones: { front: emptyZone('front'), back: emptyZone('back'), sleeveL: emptyZone('sleeveL'), sleeveR: emptyZone('sleeveR') },
  activeZone: 'front',
  setActiveZone: (activeZone) => set({ activeZone }),

  // Helpers de mutación sobre la zona activa
  patchZone: (patch) =>
    set((s) => ({ zones: { ...s.zones, [s.activeZone]: { ...s.zones[s.activeZone], ...patch } } })),
  patchZoneById: (id, patch) =>
    set((s) => ({ zones: { ...s.zones, [id]: { ...s.zones[id], ...patch } } })),

  setDecal: ({ originalImg, url, name, meta, palette, source }) =>
    get().patchZone({ originalImg, decalUrl: url, decalName: name, decalMeta: meta, palette, ...(source ? { source } : {}) }),

  // Modo de estampa (Imagen / Texto)
  setMode: (mode) => get().patchZone({ mode }),

  // Texto (alfabeto Kpop1) — sobre la zona activa
  setText: (text) => get().patchZone({ text, source: 'text' }),
  setTextVariant: (textVariant) => get().patchZone({ textVariant }),
  setTracking: (tracking) => get().patchZone({ tracking }),
  setTextColor: (textColor) => get().patchZone({ textColor }),
  setOutlineWidth: (outlineWidth) => get().patchZone({ outlineWidth }),
  setOutlineColor: (outlineColor) => get().patchZone({ outlineColor }),
  setDecalUrl: (decalUrl) => get().patchZone({ decalUrl }),
  clearDecal: () =>
    set((s) => ({ zones: { ...s.zones, [s.activeZone]: emptyZone(s.activeZone) } })),

  // Transformación (keys: scale, offsetX, offsetY, rotation)
  setDecalTransform: (patch) => get().patchZone(patch),
  resetDecalTransform: () =>
    get().patchZone({ scale: ZONE_ANCHORS[get().activeZone]?.defScale ?? 0.16, offsetX: 0, offsetY: 0, rotation: 0 }),

  // Ajustes de imagen
  setAdjust: (patch) =>
    set((s) => {
      const z = s.zones[s.activeZone];
      return {
        zones: { ...s.zones, [s.activeZone]: { ...z, adjust: { ...z.adjust, ...patch }, activePreset: 'custom' } },
      };
    }),
  applyPreset: (key, presetAdjust) =>
    set((s) => {
      const z = s.zones[s.activeZone];
      const removeColors = z.adjust.removeColors || [];
      const colorTol = z.adjust.colorTol ?? 46;
      return {
        zones: { ...s.zones, [s.activeZone]: { ...z, adjust: { ...presetAdjust, removeColors, colorTol }, activePreset: key } },
      };
    }),
  toggleRemoveColor: (hex) =>
    set((s) => {
      const z = s.zones[s.activeZone];
      const list = z.adjust.removeColors || [];
      const next = list.includes(hex) ? list.filter((c) => c !== hex) : [...list, hex];
      return {
        zones: { ...s.zones, [s.activeZone]: { ...z, adjust: { ...z.adjust, removeColors: next }, activePreset: 'custom' } },
      };
    }),
  setAnalysis: (analysis) => get().patchZone({ analysis }),

  // Interacción directa con la estampa
  moveMode: false,
  toggleMoveMode: () => set((s) => ({ moveMode: !s.moveMode })),
  dragging: false,
  setDragging: (dragging) => set({ dragging }),

  // Escena
  studioLight: true,
  toggleLight: () => set((s) => ({ studioLight: !s.studioLight })),
  autoRotate: false,
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),

  // Vistas de cámara (azimut objetivo)
  viewTarget: null,
  setView: (name) => set({ viewTarget: VIEW_AZIMUTH[name] ?? 0 }),
  clearView: () => set({ viewTarget: null }),
}));

export const VIEWS = [
  { id: 'front', label: 'Frente' },
  { id: '34', label: '3/4' },
  { id: 'right', label: 'Lado' },
  { id: 'back', label: 'Dorso' },
];

const VIEW_AZIMUTH = {
  front: 0,
  '34': Math.PI / 6,
  right: Math.PI / 2,
  left: -Math.PI / 2,
  back: Math.PI,
};
