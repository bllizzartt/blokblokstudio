'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import landData from 'world-atlas/land-50m.json';

interface ClientLocation {
  name: string;
  lat: number;
  lng: number;
}

const clientLocations: ClientLocation[] = [
  { name: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
  { name: 'Texas, USA', lat: 31.0, lng: -100.0 },
  { name: 'Minnesota, USA', lat: 46.73, lng: -94.69 },
  { name: 'New Mexico, USA', lat: 34.52, lng: -105.87 },
];

function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landData as any, (landData as any).objects.land);

function createEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const W = 2048;
  const H = 1024;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Ocean - solid dark
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Draw real landmasses from GeoJSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geom = land.geometry as any;
  const polygons: number[][][][] =
    geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        const x = ((lng + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#8a8a8a';
      ctx.fill();
    }
  }

  // Add noise texture over the landmasses for a natural look
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    // Only add noise to land pixels (grey areas, not dark ocean)
    if (r > 30) {
      const noise = (Math.random() - 0.5) * 40;
      data[i] = Math.max(60, Math.min(180, r + noise));     // R
      data[i + 1] = Math.max(60, Math.min(180, r + noise)); // G
      data[i + 2] = Math.max(60, Math.min(178, r + noise)); // B (slightly less for warmth)
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Add subtle coastline borders
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        const x = ((lng + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  return canvas;
}

function EarthGlobe() {
  const globeRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!materialRef.current) return;
    const canvas = createEarthCanvas();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    materialRef.current.map = texture;
    materialRef.current.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.06;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Main globe */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial ref={materialRef} color="#ffffff" />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.06, 64, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.18, 64, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.015} side={THREE.BackSide} />
      </mesh>

      {/* Client markers */}
      {clientLocations.map((loc, i) => {
        const pos = latLngToVector3(loc.lat, loc.lng, 2.02);
        return (
          <group key={i} position={pos}>
            <GlowingMarker />
          </group>
        );
      })}

      {/* Connection arcs */}
      {clientLocations.map((loc, i) => {
        if (i === 0) return null;
        return <ConnectionArc key={`arc-${i}`} from={clientLocations[0]} to={loc} radius={2} />;
      })}
    </group>
  );
}

function GlowingMarker() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.3);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 - Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.08} />
      </mesh>
    </>
  );
}

function ConnectionArc({ from, to, radius }: { from: ClientLocation; to: ClientLocation; radius: number }) {
  const points = useMemo(() => {
    const [sx, sy, sz] = latLngToVector3(from.lat, from.lng, radius);
    const [ex, ey, ez] = latLngToVector3(to.lat, to.lng, radius);
    const start = new THREE.Vector3(sx, sy, sz);
    const end = new THREE.Vector3(ex, ey, ez);
    const dist = start.distanceTo(end);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(radius + dist * 0.35);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(60).map((p): [number, number, number] => [p.x, p.y, p.z]);
  }, [from, to, radius]);

  return <Line points={points} color="#22c55e" transparent opacity={0.35} lineWidth={1.5} />;
}

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <EarthGlobe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} rotateSpeed={0.3} minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.7} />
      </Canvas>
    </div>
  );
}
