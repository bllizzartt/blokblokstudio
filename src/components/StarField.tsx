'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  const positions = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }

    return pos;
  }, []);

  useEffect(() => {
    if (geoRef.current) {
      geoRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
    }
  }, [positions]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.005;
      ref.current.rotation.x = clock.getElapsedTime() * 0.002;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial
        color="#ffffff"
        size={0.8}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.5 + Math.random() * 1.5, []);
  const startDelay = useMemo(() => Math.random() * 30, []);
  const startX = useMemo(() => (Math.random() - 0.5) * 100, []);
  const startY = useMemo(() => 20 + Math.random() * 40, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() - startDelay;
    if (t < 0) {
      ref.current.visible = false;
      return;
    }
    const cycle = t % 20;
    if (cycle > 2) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.x = startX + cycle * speed * 30;
    ref.current.position.y = startY - cycle * speed * 15;
    ref.current.position.z = -50;
    const fade = cycle < 0.3 ? cycle / 0.3 : cycle > 1.5 ? (2 - cycle) / 0.5 : 1;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.8;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

export function StarField() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Stars />
        {Array.from({ length: 3 }).map((_, i) => (
          <ShootingStar key={i} />
        ))}
      </Canvas>
    </div>
  );
}
