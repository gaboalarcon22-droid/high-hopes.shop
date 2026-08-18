'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useStudio, ZONES, VIEWS } from '@/lib/mockup3d/store';
import { analyzeImage, GENERAL_TIPS } from '@/lib/mockup3d/imageAnalysis';
import { processImage, extractPalette, PRESETS } from '@/lib/mockup3d/imageProcess';
import { composeText } from '@/lib/mockup3d/textComposer';
import { exportDTF } from '@/lib/mockup3d/dtf';
import { GARMENTS, getGarment, sizeMeta, decalCmWidth, printableMaxCm } from '@/lib/mockup3d/garments';
import styles from './mockup3d.module.css';

const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => <div className={styles.sceneFallback}>Inicializando estudio 3D…</div>,
});

const cx = (...parts) => parts.filter(Boolean).join(' ');

export default function Mockup3DStudio({ onUseImage, initialColor }) {
  const {
    garmentId, size, setGarment, setSize,
    shirtColor, setShirtColor,
    zones, activeZone, setActiveZone,
    setDecal, setDecalUrl, clearDecal,
    setMode, setText, setTextVariant, setTracking,
    setTextColor, setOutlineWidth, setOutlineColor,
    setDecalTransform, resetDecalTransform,
    setAdjust, applyPreset, toggleRemoveColor,
    moveMode, toggleMoveMode,
    setAnalysis,
    studioLight, toggleLight, autoRotate, toggleAutoRotate,
    setView,
  } = useStudio();

  const fileInputRef = useRef(null);
  const [dtfInfo, setDtfInfo] = useState(null);
  const [exportMsg, setExportMsg] = useState('');
  const [usedMsg, setUsedMsg] = useState('');

  useEffect(() => {
    if (initialColor) setShirtColor(initialColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El canvas de R3F a veces mide 0 en su primer render dentro de un modal
  // recién montado; forzamos un remeasure para que quede bien dimensionado.
  useEffect(() => {
    const ids = [50, 250, 600].map((ms) => setTimeout(() => window.dispatchEvent(new Event('resize')), ms));
    return () => ids.forEach(clearTimeout);
  }, []);

  const garment = getGarment(garmentId);
  const meta = sizeMeta(garment, size);
  const z = zones[activeZone];
  const adjust = z.adjust;
  const cmWidth = decalCmWidth(z.scale, garment, size);
  const maxCm = printableMaxCm(garment, size);
  const overPrintable = cmWidth > maxCm;
  const liveDpi = z.decalMeta?.width ? Math.round(z.decalMeta.width / (cmWidth / 2.54)) : null;

  const applyImageSource = useCallback(
    async (img, name, fileSize, source) => {
      const st = useStudio.getState();
      const curAdjust = st.zones[st.activeZone].adjust;
      const processed = await processImage(img, curAdjust);
      const palette = extractPalette(img);
      setDecal({
        originalImg: img,
        url: processed,
        name,
        meta: { width: img.naturalWidth, height: img.naturalHeight, fileSize },
        palette,
        source,
      });
      const result = await analyzeImage(img, fileSize, st.shirtColor);
      setAnalysis(result);
    },
    [setDecal, setAnalysis]
  );

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => applyImageSource(img, file.name, file.size, 'image');
      img.src = url;
    },
    [applyImageSource]
  );

  useEffect(() => {
    if (z.mode !== 'text') return;
    if (!z.text.trim()) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await composeText(z.text, {
        fontId: 'kpop1',
        variant: z.textVariant,
        tracking: z.tracking,
        textColor: z.textColor,
        outlineWidth: z.outlineWidth,
        outlineColor: z.outlineColor,
      });
      if (cancelled || !res) return;
      const img = new Image();
      img.onload = () => {
        if (!cancelled) applyImageSource(img, `texto: ${z.text}`, 0, 'text');
      };
      img.src = res.dataUrl;
    }, 160);
    return () => { cancelled = true; clearTimeout(id); };
  }, [z.mode, z.text, z.textVariant, z.tracking, z.textColor, z.outlineWidth, z.outlineColor, activeZone, applyImageSource]);

  useEffect(() => {
    if (!z.originalImg) return;
    const id = setTimeout(async () => {
      const processed = await processImage(z.originalImg, z.adjust);
      setDecalUrl(processed);
    }, 120);
    return () => clearTimeout(id);
  }, [z.originalImg, z.adjust, activeZone, setDecalUrl]);

  const onDrop = useCallback((e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }, [handleFile]);

  const captureCanvasDataUrl = useCallback(() => {
    const canvas = document.querySelector(`.${styles.canvasWrap} canvas`);
    if (!canvas) return null;
    // Si el canvas todavía no fue medido por el ResizeObserver de R3F
    // (p. ej. justo después de abrir el modal), forzar un remeasure.
    if (canvas.width <= 300 && canvas.height <= 150) {
      window.dispatchEvent(new Event('resize'));
    }
    return canvas.toDataURL('image/png');
  }, []);

  const exportRenderPNG = useCallback(() => {
    const dataUrl = captureCanvasDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `mockup-${Date.now()}.png`;
    a.click();
  }, [captureCanvasDataUrl]);

  const useAsProductImage = useCallback(() => {
    const dataUrl = captureCanvasDataUrl();
    if (!dataUrl || !onUseImage) return;
    onUseImage(dataUrl);
    setUsedMsg('✓ Imagen agregada al producto');
    setTimeout(() => setUsedMsg(''), 3000);
  }, [captureCanvasDataUrl, onUseImage]);

  const zoneSlug = (id) => (ZONES.find((x) => x.id === id)?.label || id).toLowerCase().replace(/\s+/g, '-');

  const exportArtwork = useCallback(async () => {
    if (!z.originalImg) return;
    const info = await exportDTF({
      img: z.originalImg, adjust: z.adjust, cmWidth, dpi: 300,
      name: z.decalName, zone: zoneSlug(activeZone),
    });
    setDtfInfo(info);
  }, [z.originalImg, z.adjust, z.decalName, cmWidth, activeZone]);

  const exportAll = useCallback(async () => {
    setExportMsg('Generando archivos DTF…');
    const st = useStudio.getState();
    let count = 0;
    for (const { id } of ZONES) {
      const zz = st.zones[id];
      if (!zz.originalImg) continue;
      const cw = decalCmWidth(zz.scale, garment, size);
      await exportDTF({ img: zz.originalImg, adjust: zz.adjust, cmWidth: cw, dpi: 300, name: zz.decalName || id, zone: zoneSlug(id) });
      count++;
    }
    setExportMsg(count ? `Exportadas ${count} zona(s) en archivos DTF separados (300 DPI).` : 'No hay estampas para exportar.');
  }, [garment, size]);

  return (
    <div className={styles.studio}>
      <section className={styles.canvasWrap} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        <Scene />
        <div className={styles.viewBar}>
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className={styles.viewBtn} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <div className={styles.canvasHint}>
          {moveMode && z.decalUrl
            ? 'Arrastrá sobre la prenda para mover la estampa'
            : 'Arrastrá para rotar · Pellizcá para zoom · Botones de vista arriba'}
        </div>
        {z.decalUrl && (
          <button type="button" className={cx(styles.moveToggle, moveMode && styles.on)} onClick={toggleMoveMode}>
            {moveMode ? '✓ Moviendo estampa' : '✋ Mover estampa'}
          </button>
        )}
        {ZONES.every((zn) => !zones[zn.id].decalUrl) && (
          <div className={styles.dropOverlay}>
            <div>
              <strong>Soltá tu estampa PNG aquí</strong>
              <span>o usá el panel de la derecha</span>
            </div>
          </div>
        )}
      </section>

      <aside className={styles.panel}>
        <header className={styles.panelHead}>
          <h1>Mockup Studio 3D</h1>
          <p>Diseñá la estampa y usala como imagen del producto</p>
        </header>

        <div className={styles.block}>
          <h2>Tipo de prenda</h2>
          <div className={styles.presets}>
            {GARMENTS.map((g) => (
              <button key={g.id} type="button" className={cx(styles.preset, garmentId === g.id && styles.on)} onClick={() => setGarment(g.id)}>
                {g.name}
              </button>
            ))}
          </div>
          <p className={styles.hintLine}>{garment.fit} · {garment.source}</p>
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h2>Talle</h2>
            <span className={styles.sizeMeta}>{meta.ancho} × {meta.largo} cm</span>
          </div>
          <div className={styles.toggles}>
            {Object.keys(garment.sizes).map((sz) => (
              <button key={sz} type="button" className={cx(styles.chip, size === sz && styles.on)} onClick={() => setSize(sz)}>
                {sz}
              </button>
            ))}
          </div>
          <p className={styles.hintLine}>Área útil de estampado: hasta ~{maxCm} cm de ancho</p>
        </div>

        <div className={styles.block}>
          <h2>Color de la prenda</h2>
          <div className={styles.swatches}>
            {garment.colors.map((c) => (
              <button key={c.hex} type="button" title={c.name}
                className={cx(styles.swatch, shirtColor === c.hex && styles.active)}
                style={{ background: c.hex }} onClick={() => setShirtColor(c.hex)} />
            ))}
            <label className={cx(styles.swatch, styles.swatchCustom)} title="Color personalizado">
              <input type="color" value={shirtColor} onChange={(e) => setShirtColor(e.target.value)} />+
            </label>
          </div>
        </div>

        <div className={styles.block}>
          <h2>Zona de estampado</h2>
          <div className={styles.zoneTabs}>
            {ZONES.map((zn) => (
              <button key={zn.id} type="button" className={cx(styles.zoneTab, activeZone === zn.id && styles.on)} onClick={() => setActiveZone(zn.id)}>
                {zn.label}
                {zones[zn.id].decalUrl && <i className={styles.zoneTabDot} />}
              </button>
            ))}
          </div>

          <div className={styles.zoneTabs} style={{ marginBottom: 12 }}>
            <button type="button" className={cx(styles.zoneTab, z.mode === 'image' && styles.on)} onClick={() => setMode('image')}>
              Imagen
            </button>
            <button type="button" className={cx(styles.zoneTab, z.mode === 'text' && styles.on)} onClick={() => setMode('text')}>
              Texto / Letras
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
            onChange={(e) => handleFile(e.target.files?.[0])} />

          {z.mode === 'image' ? (
            !z.decalUrl || z.source !== 'image' ? (
              <button type="button" className={cx(styles.btn, styles.btnPrimary, styles.btnFull)} onClick={() => fileInputRef.current?.click()}>
                Subir imagen ({ZONES.find((x) => x.id === activeZone).label})
              </button>
            ) : (
              <div className={styles.decalInfo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z.decalUrl} alt="estampa" />
                <div>
                  <strong>{z.decalName}</strong>
                  <span>{z.decalMeta?.width}×{z.decalMeta?.height}px · {Math.round((z.decalMeta?.fileSize || 0) / 1024)} KB</span>
                  <div className={styles.rowBtns}>
                    <button type="button" className={cx(styles.btn, styles.btnSmall)} onClick={() => fileInputRef.current?.click()}>Cambiar</button>
                    <button type="button" className={cx(styles.btn, styles.btnSmall, styles.btnGhost)} onClick={clearDecal}>Quitar</button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div>
              <input
                className={styles.textInput}
                type="text"
                value={z.text}
                placeholder="Escribí tu palabra…"
                onChange={(e) => setText(e.target.value)}
              />
              <p className={styles.hintLine} style={{ marginTop: 6 }}>Letras A–Z y números 0–9 (alfabeto Kpop1).</p>
            </div>
          )}
        </div>

        {z.mode === 'text' && (
          <div className={styles.block}>
            <h2>Estilo de las letras</h2>
            <div className={styles.toggles}>
              <button type="button" className={cx(styles.chip, z.textVariant === 'color' && styles.on)} onClick={() => setTextVariant('color')}>
                Color original
              </button>
              <button type="button" className={cx(styles.chip, z.textVariant === 'black' && styles.on)} onClick={() => setTextVariant('black')}>
                Negro
              </button>
            </div>
            <div style={{ height: 10 }} />
            <Slider styles={styles} label="Espaciado" min={0} max={0.2} step={0.005} value={z.tracking} onChange={(v) => setTracking(v)} />

            <div className={styles.colorRow}>
              <span>Color de letra</span>
              <div className={styles.colorPick}>
                <button type="button" className={cx(styles.chip, styles.chipSmall, !z.textColor && styles.on)} onClick={() => setTextColor('')}>Original</button>
                <label className={cx(styles.swatch, styles.swatchCustom)} title="Tinte de letra" style={{ width: 30, height: 30 }}>
                  <input type="color" value={z.textColor || '#ffffff'} onChange={(e) => setTextColor(e.target.value)} />
                  {z.textColor ? '' : '+'}
                </label>
              </div>
            </div>

            <div style={{ height: 6 }} />
            <Slider styles={styles} label="Contorno" min={0} max={0.08} step={0.002} value={z.outlineWidth} onChange={(v) => setOutlineWidth(v)} />
            {z.outlineWidth > 0 && (
              <div className={styles.colorRow}>
                <span>Color contorno</span>
                <label className={cx(styles.swatch, styles.swatchCustom)} title="Color del contorno" style={{ width: 30, height: 30 }}>
                  <input type="color" value={z.outlineColor} onChange={(e) => setOutlineColor(e.target.value)} />
                </label>
              </div>
            )}
            <p className={styles.hintLine}>El contorno ayuda a destacar la palabra sobre la remera.</p>
          </div>
        )}

        {z.decalUrl && (
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <h2>Posición y tamaño</h2>
              <button type="button" className={styles.link} onClick={resetDecalTransform}>Reiniciar</button>
            </div>
            <button type="button" className={cx(styles.btn, styles.btnFull, moveMode && styles.btnPrimary)} onClick={toggleMoveMode}>
              {moveMode ? '✓ Modo mover activo — arrastrá en la prenda' : '✋ Mover estampa arrastrando'}
            </button>
            <div style={{ height: 12 }} />
            <div className={cx(styles.printReadout, overPrintable && styles.warn)}>
              <span>Ancho real de la estampa</span>
              <strong>≈ {cmWidth.toFixed(1)} cm{liveDpi ? ` · ${liveDpi} DPI` : ''}</strong>
              {overPrintable && <em>Supera el área útil del talle {size} (~{maxCm} cm). Reducí el tamaño.</em>}
            </div>
            <Slider styles={styles} label="Tamaño" min={0.05} max={0.35} step={0.005} value={z.scale}
              onChange={(v) => setDecalTransform({ scale: v })} />
            <Slider styles={styles} label="Horizontal" min={-0.15} max={0.15} step={0.005} value={z.offsetX}
              onChange={(v) => setDecalTransform({ offsetX: v })} />
            <Slider styles={styles} label="Vertical" min={-0.12} max={0.18} step={0.005} value={z.offsetY}
              onChange={(v) => setDecalTransform({ offsetY: v })} />
            <Slider styles={styles} label="Rotación" min={-Math.PI} max={Math.PI} step={0.02} value={z.rotation}
              onChange={(v) => setDecalTransform({ rotation: v })} />
          </div>
        )}

        {z.decalUrl && z.mode === 'image' && (
          <div className={styles.block}>
            <h2>Mejorar imagen</h2>
            <div className={styles.presets}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} type="button" className={cx(styles.preset, z.activePreset === key && styles.on)} onClick={() => applyPreset(key, p.adjust)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ height: 8 }} />
            <Slider styles={styles} label="Brillo" min={50} max={150} step={1} value={adjust.brightness}
              onChange={(v) => setAdjust({ brightness: v })} suffix="%" />
            <Slider styles={styles} label="Contraste" min={50} max={180} step={1} value={adjust.contrast}
              onChange={(v) => setAdjust({ contrast: v })} suffix="%" />
            <Slider styles={styles} label="Saturación" min={0} max={200} step={1} value={adjust.saturation}
              onChange={(v) => setAdjust({ saturation: v })} suffix="%" />
            <div className={styles.toggles}>
              <button type="button" className={cx(styles.chip, adjust.removeBg && styles.on)} onClick={() => setAdjust({ removeBg: !adjust.removeBg })}>
                Quitar fondo claro
              </button>
              <button type="button" className={cx(styles.chip, adjust.sharpen && styles.on)} onClick={() => setAdjust({ sharpen: !adjust.sharpen })}>
                Realzar nitidez
              </button>
            </div>
            {adjust.removeBg && (
              <>
                <div style={{ height: 8 }} />
                <Slider styles={styles} label="Umbral fondo" min={180} max={254} step={1} value={adjust.bgThreshold}
                  onChange={(v) => setAdjust({ bgThreshold: v })} />
              </>
            )}
          </div>
        )}

        {z.decalUrl && z.mode === 'image' && z.palette.length > 0 && (
          <div className={styles.block}>
            <h2>Quitar colores del diseño</h2>
            <p className={styles.hintLine} style={{ marginTop: 0, marginBottom: 10 }}>
              Tocá un color para volverlo transparente (no se imprime; queda el color de la remera).
            </p>
            <div className={styles.swatches}>
              {z.palette.map((hex) => {
                const off = adjust.removeColors.includes(hex);
                return (
                  <button key={hex} type="button" title={off ? 'Quitado' : hex}
                    className={cx(styles.swatch, styles.swatchDesign, off && styles.removed)}
                    style={{ background: hex }} onClick={() => toggleRemoveColor(hex)}>
                    {off && <span className={styles.swatchDesignX}>✕</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ height: 10 }} />
            <button type="button" className={cx(styles.chip, adjust.removeColors.includes(shirtColor) && styles.on)}
              onClick={() => toggleRemoveColor(shirtColor)}>
              Quitar color de la remera
            </button>
            <div style={{ height: 8 }} />
            <Slider styles={styles} label="Tolerancia" min={10} max={110} step={1} value={adjust.colorTol}
              onChange={(v) => setAdjust({ colorTol: v })} />
          </div>
        )}

        <div className={styles.block}>
          <h2>Usar en el producto</h2>
          <div className={styles.toggles}>
            <button type="button" className={cx(styles.chip, studioLight && styles.on)} onClick={toggleLight}>Luz de estudio</button>
            <button type="button" className={cx(styles.chip, autoRotate && styles.on)} onClick={toggleAutoRotate}>Giro automático</button>
          </div>
          <button type="button" className={cx(styles.btn, styles.btnPrimary, styles.btnFull)} onClick={useAsProductImage}>
            📸 Usar esta vista como imagen del producto
          </button>
          {usedMsg && <p className={styles.hintLine} style={{ color: 'var(--ok)' }}>{usedMsg}</p>}
          <div style={{ height: 8 }} />
          <button type="button" className={cx(styles.btn, styles.btnFull)} onClick={exportRenderPNG}>Descargar muestra 3D (PNG)</button>
          <div style={{ height: 8 }} />
          <button type="button" className={cx(styles.btn, styles.btnFull)} disabled={!z.decalUrl} onClick={exportArtwork}>
            Exportar estampa para DTF · 300 DPI
          </button>
          {dtfInfo && (
            <div className={styles.dtfInfo}>
              <strong>Listo: {dtfInfo.fileName}</strong>
              <span>{dtfInfo.cm.w} × {dtfInfo.cm.h} cm · {dtfInfo.px.w} × {dtfInfo.px.h} px · {dtfInfo.dpi} DPI · fondo transparente</span>
              {dtfInfo.nativeDpi < 150 && (
                <em>⚠ Resolución original baja ({dtfInfo.nativeDpi} DPI reales a ese tamaño). Para DTF nítido usá un archivo más grande.</em>
              )}
            </div>
          )}
          <div style={{ height: 8 }} />
          <button type="button" className={cx(styles.btn, styles.btnFull)} onClick={exportAll}>Exportar TODAS las zonas (DTF)</button>
          {exportMsg && <p className={styles.hintLine}>{exportMsg}</p>}
        </div>

        {z.analysis && (
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <h2>Calidad de la estampa</h2>
              <ScoreBadge styles={styles} score={z.analysis.score} />
            </div>
            <div className={styles.metrics}>
              <Metric styles={styles} label="Resolución" value={`${z.analysis.metrics.width}×${z.analysis.metrics.height}`} />
              <Metric styles={styles} label="DPI a este tamaño" value={liveDpi ?? z.analysis.metrics.dpi} />
              <Metric styles={styles} label="Contraste" value={z.analysis.metrics.contrast} />
              <Metric styles={styles} label="Nitidez" value={z.analysis.metrics.sharpness} />
              <Metric styles={styles} label="Transparencia" value={z.analysis.metrics.hasAlpha ? 'Sí' : 'No'} />
              <Metric styles={styles} label="Máx. 300dpi" value={`${z.analysis.metrics.maxWidthAt300} cm`} />
            </div>
            <div className={styles.suggestions}>
              {z.analysis.suggestions.map((s, i) => (
                <div key={i} className={cx(styles.suggestion, styles[s.level])}>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                  <em>{s.action}</em>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.block}>
          <h2>Tips para una mejor muestra</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {GENERAL_TIPS.map((t, i) => (<li key={i} style={{ fontSize: 12, color: 'var(--muted)' }}>{t}</li>))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Slider({ styles, label, min, max, step, value, onChange, suffix }) {
  return (
    <label className={styles.slider}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      {suffix && <small className={styles.sliderVal}>{Math.round(value)}{suffix}</small>}
    </label>
  );
}

function Metric({ styles, label, value }) {
  return (<div className={styles.metric}><span>{label}</span><strong>{value}</strong></div>);
}

function ScoreBadge({ styles, score }) {
  const cls = score >= 80 ? styles.ok : score >= 55 ? styles.warn : styles.error;
  return <div className={cx(styles.score, cls)}>{score}/100</div>;
}
