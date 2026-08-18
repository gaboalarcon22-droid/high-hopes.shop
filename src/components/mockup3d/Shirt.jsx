'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { useStudio } from '@/lib/mockup3d/store';
import { getGarment, modelScale, ZONE_ANCHORS } from '@/lib/mockup3d/garments';

useGLTF.preload('/mockup3d/models/tshirt.glb');

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Textura desde data/object URL
function useImageTexture(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) { setTexture(null); return; }
    let active = true;
    new THREE.TextureLoader().load(url, (t) => {
      if (!active) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
      setTexture(t);
    });
    return () => { active = false; };
  }, [url]);
  return texture;
}

// Mapa de normales de tela (micro-trama) generado proceduralmente
function makeFabricNormal() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const nx = Math.sin((x / s) * Math.PI * 2 * 16) * 0.18 + (Math.random() - 0.5) * 0.1;
      const ny = Math.sin((y / s) * Math.PI * 2 * 16) * 0.18 + (Math.random() - 0.5) * 0.1;
      img.data[i] = 128 + nx * 127;
      img.data[i + 1] = 128 + ny * 127;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function DecalLayer({ zoneId, zone, fabricNormal }) {
  const texture = useImageTexture(zone.decalUrl);
  if (!texture) return null;
  const a = ZONE_ANCHORS[zoneId];
  const im = texture.image;
  const aspect = im && im.height ? im.width / im.height : 1;
  const sx = zone.scale;
  const sy = zone.scale / aspect;
  const depth = Math.max(sx, sy, 0.2);
  return (
    <Decal
      position={[a.pos[0] + zone.offsetX, a.pos[1] + zone.offsetY, a.pos[2]]}
      rotation={[0, a.rotY, zone.rotation]}
      scale={[sx, sy, depth]}
    >
      <meshStandardMaterial
        map={texture}
        normalMap={fabricNormal}
        normalScale={[0.18, 0.18]}
        transparent
        alphaTest={0.02}
        roughness={0.92}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-10}
        toneMapped
      />
    </Decal>
  );
}

export default function Shirt() {
  const garmentId = useStudio((s) => s.garmentId);
  const size = useStudio((s) => s.size);
  const garment = getGarment(garmentId);

  const { nodes, materials } = useGLTF(garment.model);
  const meshRef = useRef();

  const shirtColor = useStudio((s) => s.shirtColor);
  const zones = useStudio((s) => s.zones);
  const activeZone = useStudio((s) => s.activeZone);
  const moveMode = useStudio((s) => s.moveMode);
  const setDragging = useStudio((s) => s.setDragging);
  const setDecalTransform = useStudio((s) => s.setDecalTransform);

  const sScale = modelScale(garment, size);
  const draggingRef = useRef(false);
  const fabricNormal = useMemo(() => makeFabricNormal(), []);

  useEffect(() => {
    const mat = materials.lambert1;
    if (mat) {
      const n = fabricNormal.clone();
      n.needsUpdate = true;
      n.repeat.set(6, 6);
      mat.normalMap = n;
      mat.normalScale = new THREE.Vector2(0.25, 0.25);
      mat.needsUpdate = true;
    }
  }, [materials, fabricNormal]);

  const target = useRef(new THREE.Color(shirtColor));
  useEffect(() => { target.current.set(shirtColor); }, [shirtColor]);
  useFrame((_, delta) => {
    const mat = materials.lambert1;
    if (mat?.color) {
      mat.color.lerp(target.current, Math.min(1, delta * 8));
      mat.roughness = 0.85;
      mat.metalness = 0;
    }
  });

  const moveDecalTo = useCallback(
    (point) => {
      if (!meshRef.current) return;
      const a = ZONE_ANCHORS[activeZone];
      const local = meshRef.current.worldToLocal(point.clone());
      const mirror = activeZone === 'back' ? -1 : 1;
      setDecalTransform({
        offsetX: clamp((local.x - a.pos[0]) * mirror, a.range.x[0], a.range.x[1]),
        offsetY: clamp(local.y - a.pos[1], a.range.y[0], a.range.y[1]),
      });
    },
    [setDecalTransform, activeZone]
  );

  const activeHasDecal = !!zones[activeZone]?.decalUrl;
  const onDown = useCallback((e) => {
    if (!moveMode || !activeHasDecal) return;
    e.stopPropagation();
    e.target?.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    moveDecalTo(e.point);
  }, [moveMode, activeHasDecal, moveDecalTo, setDragging]);
  const onMove = useCallback((e) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    moveDecalTo(e.point);
  }, [moveDecalTo]);
  const onUp = useCallback((e) => {
    if (!draggingRef.current) return;
    e.target?.releasePointerCapture?.(e.pointerId);
    draggingRef.current = false;
    setDragging(false);
  }, [setDragging]);

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      geometry={nodes.T_Shirt_male.geometry}
      material={materials.lambert1}
      material-roughness={0.85}
      scale={sScale}
      dispose={null}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOut={onUp}
    >
      <DecalLayer zoneId="front" zone={zones.front} fabricNormal={fabricNormal} />
      <DecalLayer zoneId="back" zone={zones.back} fabricNormal={fabricNormal} />
      <DecalLayer zoneId="sleeveL" zone={zones.sleeveL} fabricNormal={fabricNormal} />
      <DecalLayer zoneId="sleeveR" zone={zones.sleeveR} fabricNormal={fabricNormal} />
    </mesh>
  );
}
