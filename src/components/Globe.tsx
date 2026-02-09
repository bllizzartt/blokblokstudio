'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import landData from 'world-atlas/land-50m.json';

// --- Data ---

interface ClientLocation {
  name: string;
  lat: number;
  lng: number;
}

const clientLocations: ClientLocation[] = [
  { name: 'Berlin', lat: 52.52, lng: 13.405 },
  { name: 'Texas', lat: 31.0, lng: -100.0 },
  { name: 'Minnesota', lat: 46.73, lng: -94.69 },
  { name: 'New Mexico', lat: 34.52, lng: -105.87 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landData as any, (landData as any).objects.land);

// --- Helpers ---

function latLngToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function getLandPolygons(): number[][][][] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geom = land.geometry as any;
  return geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
}

// --- Texture generation ---

function buildTexture(): THREE.CanvasTexture {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Ocean
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(0, 0, W, H);

  // Grid lines baked into texture
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let lng = -150; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Draw landmasses
  const polygons = getLandPolygons();

  const toXY = (coord: number[]): [number, number] => {
    const x = ((coord[0] + 180) / 360) * W;
    const y = ((90 - coord[1]) / 180) * H;
    return [x, y];
  };

  // Filled continents — grey
  for (const polygon of polygons) {
    // First ring is exterior, rest are holes
    const [exterior, ...holes] = polygon;

    ctx.beginPath();
    exterior.forEach((c: number[], i: number) => {
      const [x, y] = toXY(c);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Cut out holes (lakes, etc.)
    for (const hole of holes) {
      hole.forEach((c: number[], i: number) => {
        const [x, y] = toXY(c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }

    ctx.fillStyle = '#7a7a7a';
    ctx.fill('evenodd');
  }

  // Add noise texture for natural terrain feel
  const imageData = ctx.getImageData(0, 0, W, H);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > 30) {
      // Land pixel — add grain
      const n = (Math.random() - 0.5) * 30;
      px[i] = Math.max(50, Math.min(160, px[i] + n));
      px[i + 1] = Math.max(50, Math.min(160, px[i + 1] + n));
      px[i + 2] = Math.max(50, Math.min(158, px[i + 2] + n));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Coastline stroke
  ctx.strokeStyle = 'rgba(180,180,180,0.35)';
  ctx.lineWidth = 1.5;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ctx.beginPath();
      ring.forEach((c: number[], i: number) => {
        const [x, y] = toXY(c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Grid lines as 3D curves on sphere ---

function useGridLines() {
  return useMemo(() => {
    const R = 2.003;
    const lines: [number, number, number][][] = [];

    // Latitude circles
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: [number, number, number][] = [];
      for (let lng = -180; lng <= 180; lng += 2) {
        pts.push(latLngToVec3(lat, lng, R));
      }
      lines.push(pts);
    }

    // Longitude semicircles
    for (let lng = -150; lng <= 180; lng += 30) {
      const pts: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        pts.push(latLngToVec3(lat, lng, R));
      }
      lines.push(pts);
    }

    return lines;
  }, []);
}

// --- Scene components ---

function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const gridLines = useGridLines();

  useEffect(() => {
    if (!matRef.current) return;
    const tex = buildTexture();
    matRef.current.map = tex;
    matRef.current.needsUpdate = true;
    return () => { tex.dispose(); };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Globe sphere with continent texture */}
      <mesh>
        <sphereGeometry args={[2, 96, 64]} />
        <meshBasicMaterial ref={matRef} color="#ffffff" />
      </mesh>

      {/* 3D grid lines on sphere surface */}
      {gridLines.map((pts, i) => (
        <Line key={`g${i}`} points={pts} color="#ffffff" transparent opacity={0.08} lineWidth={0.5} />
      ))}

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.05, 64, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.15, 64, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.012} side={THREE.BackSide} />
      </mesh>

      {/* Client markers */}
      {clientLocations.map((loc, i) => (
        <GlowingMarker key={i} lat={loc.lat} lng={loc.lng} />
      ))}

      {/* Connection arcs from Berlin to each US location */}
      {clientLocations.slice(1).map((loc, i) => (
        <ConnectionArc key={`a${i}`} from={clientLocations[0]} to={loc} />
      ))}
    </group>
  );
}

function GlowingMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, 2.02), [lat, lng]);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) coreRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.25);
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 - Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function ConnectionArc({ from, to }: { from: ClientLocation; to: ClientLocation }) {
  const points = useMemo(() => {
    const R = 2;
    const [sx, sy, sz] = latLngToVec3(from.lat, from.lng, R);
    const [ex, ey, ez] = latLngToVec3(to.lat, to.lng, R);
    const start = new THREE.Vector3(sx, sy, sz);
    const end = new THREE.Vector3(ex, ey, ez);
    const dist = start.distanceTo(end);
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(R + dist * 0.3);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(80).map((p): [number, number, number] => [p.x, p.y, p.z]);
  }, [from, to]);

  return <Line points={points} color="#22c55e" transparent opacity={0.3} lineWidth={1.5} />;
}

// --- Export ---

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <EarthGlobe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.3}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
        />
      </Canvas>
    </div>
  );
}
