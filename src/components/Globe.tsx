'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import landData from 'world-atlas/land-50m.json';

// --- Data ---

const clientLocations = [
  { name: 'Berlin', lat: 52.52, lng: 13.405 },
  { name: 'Texas', lat: 31.0, lng: -100.0 },
  { name: 'Minnesota', lat: 46.73, lng: -94.69 },
  { name: 'New Mexico', lat: 34.52, lng: -105.87 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landData as any, (landData as any).objects.land);

// --- Helpers ---

function toVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function getPolygons(): number[][][][] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = land.geometry as any;
  return g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
}

// --- Canvas texture ---

function buildTexture(): THREE.CanvasTexture {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const toXY = (c: number[]): [number, number] => [
    ((c[0] + 180) / 360) * W,
    ((90 - c[1]) / 180) * H,
  ];

  // Deep dark ocean
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, W, H);

  const polygons = getPolygons();

  // Filled landmasses — dark grey, subtle
  for (const polygon of polygons) {
    const [exterior, ...holes] = polygon;
    ctx.beginPath();
    exterior.forEach((c: number[], i: number) => {
      const [x, y] = toXY(c);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    for (const hole of holes) {
      hole.forEach((c: number[], i: number) => {
        const [x, y] = toXY(c);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.fill('evenodd');
  }

  // Coastline outlines — the primary visual element
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.2;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ctx.beginPath();
      ring.forEach((c: number[], i: number) => {
        const [x, y] = toXY(c);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

// --- 3D Grid lines ---

function useGridLines() {
  return useMemo(() => {
    const R = 2.002;
    const lines: [number, number, number][][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: [number, number, number][] = [];
      for (let lng = -180; lng <= 180; lng += 2) pts.push(toVec3(lat, lng, R));
      lines.push(pts);
    }
    for (let lng = -150; lng <= 180; lng += 30) {
      const pts: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(toVec3(lat, lng, R));
      lines.push(pts);
    }
    return lines;
  }, []);
}

// --- Scene ---

function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const gridLines = useGridLines();

  useEffect(() => {
    const tex = buildTexture();
    setTexture(tex);
    return () => { tex.dispose(); };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Globe */}
      <mesh>
        <sphereGeometry args={[2, 128, 64]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#080808" />
        )}
      </mesh>

      {/* Grid lines */}
      {gridLines.map((pts, i) => (
        <Line
          key={`g${i}`}
          points={pts}
          color="#ffffff"
          transparent
          opacity={0.04}
          lineWidth={0.5}
        />
      ))}

      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[2.04, 64, 48]} />
        <meshBasicMaterial
          color="#334155"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.12, 64, 48]} />
        <meshBasicMaterial
          color="#1e293b"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Markers */}
      {clientLocations.map((loc, i) => (
        <Marker key={i} lat={loc.lat} lng={loc.lng} />
      ))}

      {/* Arcs from Berlin to US locations */}
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
      {/* Bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color="#4ade80" toneMapped={false} />
      </mesh>
      {/* Expanding pulse ring */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.03, 0.04, 32]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Soft glow */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Arc({
  from,
  to,
}: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
}) {
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

  return (
    <Line
      points={points}
      color="#22c55e"
      transparent
      opacity={0.2}
      lineWidth={1.2}
    />
  );
}

// --- Export ---

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.4, 5], fov: 42 }}
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
