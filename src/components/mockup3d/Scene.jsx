'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Center, Html } from '@react-three/drei';
import Shirt from './Shirt';
import { useStudio } from '@/lib/mockup3d/store';

function Loader() {
  return (
    <Html center>
      <div style={{ color: '#93a0ad', fontSize: 13, whiteSpace: 'nowrap' }}>Cargando modelo 3D…</div>
    </Html>
  );
}

// Anima la cámara hacia el azimut objetivo cuando se elige una vista
function ViewAnimator({ controlsRef }) {
  const viewTarget = useStudio((s) => s.viewTarget);
  const clearView = useStudio((s) => s.clearView);
  useFrame((_, delta) => {
    const c = controlsRef.current;
    if (c == null || viewTarget == null) return;
    let cur = c.getAzimuthalAngle();
    let diff = viewTarget - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 0.02) {
      c.setAzimuthalAngle(viewTarget);
      c.update();
      clearView();
      return;
    }
    c.setAzimuthalAngle(cur + diff * Math.min(1, delta * 6));
    c.update();
  });
  return null;
}

export default function Scene() {
  const studioLight = useStudio((s) => s.studioLight);
  const autoRotate = useStudio((s) => s.autoRotate);
  const dragging = useStudio((s) => s.dragging);
  const controlsRef = useRef();

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 2.6], fov: 25 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      dpr={[1, 2]}
    >
      {/* Fondo tipo estudio fotográfico (claro) para que la prenda resalte sobre cualquier color */}
      <color attach="background" args={['#e9e9e9']} />

      <ambientLight intensity={studioLight ? 0.55 : 0.3} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={studioLight ? 1.4 : 0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={studioLight ? 0.7 : 0.4} />
      <directionalLight position={[0, 3, -5]} intensity={studioLight ? 0.6 : 0.3} />

      <Suspense fallback={<Loader />}>
        <Center>
          <Shirt />
        </Center>
      </Suspense>

      <ContactShadows
        position={[0, -0.62, 0]}
        opacity={0.5}
        scale={4}
        blur={2.4}
        far={1.2}
        resolution={512}
        color="#000000"
      />

      <OrbitControls
        ref={controlsRef}
        enabled={!dragging}
        enablePan={false}
        minDistance={1.6}
        maxDistance={4}
        autoRotate={autoRotate && !dragging}
        autoRotateSpeed={2}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
      <ViewAnimator controlsRef={controlsRef} />
    </Canvas>
  );
}
