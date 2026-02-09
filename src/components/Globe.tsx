'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

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

function GlobeWireframe() {
  const globeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  const gridLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    const radius = 2;

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: [number, number, number][] = [];
      for (let lng = 0; lng <= 360; lng += 4) {
        points.push(latLngToVector3(lat, lng, radius));
      }
      lines.push(points);
    }

    for (let lng = 0; lng < 360; lng += 30) {
      const points: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 4) {
        points.push(latLngToVector3(lat, lng, radius));
      }
      lines.push(points);
    }

    return lines;
  }, []);

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 64, 64]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.02} />
      </Sphere>

      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#ffffff"
          transparent
          opacity={0.06}
          lineWidth={1}
        />
      ))}

      {clientLocations.map((loc, i) => {
        const pos = latLngToVector3(loc.lat, loc.lng, 2.02);
        return (
          <group key={i} position={pos}>
            <GlowingMarker />
          </group>
        );
      })}

      {clientLocations.map((loc, i) => {
        if (i === 0) return null;
        return (
          <ConnectionArc
            key={`arc-${i}`}
            from={clientLocations[0]}
            to={loc}
            radius={2}
          />
        );
      })}
    </group>
  );
}

function GlowingMarker() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.5;
      ringRef.current.scale.setScalar(scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 - Math.sin(clock.getElapsedTime() * 2) * 0.15;
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

function ConnectionArc({
  from,
  to,
  radius,
}: {
  from: ClientLocation;
  to: ClientLocation;
  radius: number;
}) {
  const points = useMemo(() => {
    const [sx, sy, sz] = latLngToVector3(from.lat, from.lng, radius);
    const [ex, ey, ez] = latLngToVector3(to.lat, to.lng, radius);
    const start = new THREE.Vector3(sx, sy, sz);
    const end = new THREE.Vector3(ex, ey, ez);
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(radius * 1.3);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(50).map((p): [number, number, number] => [p.x, p.y, p.z]);
  }, [from, to, radius]);

  return (
    <Line
      points={points}
      color="#22c55e"
      transparent
      opacity={0.2}
      lineWidth={1}
    />
  );
}

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <GlobeWireframe />
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
