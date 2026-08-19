'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Center, Html, useGLTF, Decal } from '@react-three/drei';
import * as THREE from 'three';
import { getGarment, ZONE_ANCHORS } from '@/lib/mockup3d/garments';

useGLTF.preload('/mockup3d/models/tshirt.glb');

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

function Loader() {
  return (
    <Html center>
      <div style={{ color: '#888', fontSize: 13, whiteSpace: 'nowrap' }}>Cargando vista 3D…</div>
    </Html>
  );
}

// Cuando el usuario suelta el arrastre, la prenda vuelve sola al frente (azimut 0).
function RecenterOnRelease({ controlsRef }) {
  const recentering = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onEnd = () => { recentering.current = true; };
    const onStart = () => { recentering.current = false; };
    controls.addEventListener('end', onEnd);
    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('end', onEnd);
      controls.removeEventListener('start', onStart);
    };
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !recentering.current) return;
    const cur = controls.getAzimuthalAngle();
    let diff = -cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 0.01) {
      controls.setAzimuthalAngle(0);
      controls.update();
      recentering.current = false;
      return;
    }
    controls.setAzimuthalAngle(cur + diff * Math.min(1, delta * 4));
    controls.update();
  });

  return null;
}

// Reconstruye el mockup exactamente como quedó en el estudio: misma prenda,
// mismo color, misma estampa (ya procesada/transparente) y mismo
// transform (scale/offset/rotation) dentro de la zona donde se armó.
function ProductShirt({ config }) {
  const garment = getGarment(config.garmentId);
  const { nodes, materials } = useGLTF(garment.model);
  const texture = useImageTexture(config.decalUrl);
  const target = useRef(new THREE.Color(config.shirtColor));

  useEffect(() => { target.current.set(config.shirtColor); }, [config.shirtColor]);
  useFrame((_, delta) => {
    const mat = materials.lambert1;
    if (mat?.color) {
      mat.color.lerp(target.current, Math.min(1, delta * 8));
      mat.roughness = 0.85;
      mat.metalness = 0;
    }
  });

  const a = ZONE_ANCHORS[config.zone] ?? ZONE_ANCHORS.front;
  const im = texture?.image;
  const aspect = im && im.height ? im.width / im.height : 1;
  const sx = config.scale;
  const sy = config.scale / aspect;
  const depth = Math.max(sx, sy, 0.2);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={nodes.T_Shirt_male.geometry}
      material={materials.lambert1}
      material-roughness={0.85}
      dispose={null}
    >
      {texture && (
        <Decal
          position={[a.pos[0] + config.offsetX, a.pos[1] + config.offsetY, a.pos[2]]}
          rotation={[0, a.rotY, config.rotation]}
          scale={[sx, sy, depth]}
        >
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.02}
            roughness={0.92}
            metalness={0}
            polygonOffset
            polygonOffsetFactor={-10}
            toneMapped
          />
        </Decal>
      )}
    </mesh>
  );
}

export default function ProductMockupScene({ config }) {
  const controlsRef = useRef();

  // El canvas de R3F a veces mide 0 en su primer render (recién montado en un
  // contenedor que todavía no tiene layout final); forzamos un remeasure.
  useEffect(() => {
    const ids = [50, 250, 600].map((ms) => setTimeout(() => window.dispatchEvent(new Event('resize')), ms));
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 1.85], fov: 25 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#e9e9e9']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      <directionalLight position={[0, 3, -5]} intensity={0.5} />

      <Suspense fallback={<Loader />}>
        <Center>
          <ProductShirt config={config} />
        </Center>
      </Suspense>

      <ContactShadows position={[0, -0.62, 0]} opacity={0.35} scale={4} blur={2.4} far={1.2} resolution={512} color="#000000" />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.2}
        maxDistance={2.8}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
      />
      <RecenterOnRelease controlsRef={controlsRef} />
    </Canvas>
  );
}
