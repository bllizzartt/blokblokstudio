'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

const clientLocations = [
  { name: 'Berlin', lat: 52.52, lng: 13.405 },
  { name: 'Texas', lat: 31.0, lng: -100.0 },
  { name: 'Minnesota', lat: 46.73, lng: -94.69 },
  { name: 'New Mexico', lat: 34.52, lng: -105.87 },
];

function toVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function useGridLines() {
  return useMemo(() => {
    const R = 2.005;
    const lines: [number, number, number][][] = [];
    for (let lat = -60; lat <= 60; lat += 20) {
      const pts: [number, number, number][] = [];
      for (let lng = -180; lng <= 180; lng += 2) pts.push(toVec3(lat, lng, R));
      lines.push(pts);
    }
    for (let lng = -180; lng < 180; lng += 20) {
      const pts: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(toVec3(lat, lng, R));
      lines.push(pts);
    }
    return lines;
  }, []);
}

function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const gridLines = useGridLines();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {gridLines.map((pts, i) => (
        <Line
          key={`g${i}`}
          points={pts}
          color="#22c55e"
          transparent
          opacity={0.1}
          lineWidth={0.5}
        />
      ))}

      <mesh>
        <sphereGeometry args={[2.06, 64, 48]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>

      {clientLocations.map((loc, i) => (
        <Marker key={i} lat={loc.lat} lng={loc.lng} />
      ))}

      {clientLocations.slice(1).map((loc, i) => (
        <Arc key={`a${i}`} from={clientLocations[0]} to={loc} />
      ))}
    </group>
  );
}

function Marker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => toVec3(lat, lng, 2.01), [lat, lng]);
  const coreRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.15);
    }
    if (pulseRef.current) {
      const s = 1 + ((t * 0.8) % 1) * 2;
      pulseRef.current.scale.setScalar(s);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.4 * (1 - ((t * 0.8) % 1));
    }
  });

  return (
    <group position={pos}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#4ade80" toneMapped={false} />
      </mesh>
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.04, 0.05, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.08} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Arc({ from, to }: { from: { lat: number; lng: number }; to: { lat: number; lng: number } }) {
  const points = useMemo(() => {
    const R = 2;
    const s = new THREE.Vector3(...toVec3(from.lat, from.lng, R));
    const e = new THREE.Vector3(...toVec3(to.lat, to.lng, R));
    const dist = s.distanceTo(e);
    const mid = new THREE.Vector3()
      .addVectors(s, e)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(R + dist * 0.25);
    return new THREE.QuadraticBezierCurve3(s, mid, e)
      .getPoints(100)
      .map((p): [number, number, number] => [p.x, p.y, p.z]);
  }, [from, to]);

  return <Line points={points} color="#22c55e" transparent opacity={0.25} lineWidth={1.2} />;
}

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.2, 8], fov: 32 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        style={{ background: 'transparent' }}
      >
        <EarthGlobe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.25}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  );
}
