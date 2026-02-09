'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
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

// Continent outlines as [lng, lat] pairs
const continents: number[][][] = [
  // North America
  [[-130,50],[-125,55],[-122,58],[-120,60],[-117,63],[-115,65],[-110,68],[-105,70],[-100,72],[-95,70],[-90,68],[-85,66],[-80,65],[-75,62],[-70,58],[-68,52],[-65,48],[-67,44],[-70,42],[-72,40],[-75,38],[-78,35],[-80,32],[-82,30],[-85,29],[-88,28],[-90,28],[-92,27],[-95,26],[-97,26],[-100,28],[-103,30],[-105,31],[-108,32],[-110,32],[-113,31],[-115,32],[-117,33],[-118,34],[-120,35],[-122,38],[-124,40],[-125,42],[-126,45],[-128,48],[-130,50]],
  // Central America
  [[-100,22],[-98,20],[-96,18],[-94,16],[-92,15],[-90,14],[-88,14],[-86,12],[-84,10],[-82,8],[-80,8],[-80,10],[-82,12],[-84,14],[-86,15],[-88,16],[-90,16],[-92,17],[-94,18],[-96,20],[-98,22],[-100,22]],
  // South America
  [[-80,10],[-77,12],[-74,12],[-72,11],[-70,12],[-68,10],[-65,10],[-62,8],[-60,5],[-55,3],[-52,2],[-50,0],[-48,-2],[-46,-5],[-44,-8],[-40,-10],[-38,-12],[-36,-15],[-35,-18],[-36,-20],[-38,-22],[-40,-23],[-42,-24],[-44,-23],[-46,-24],[-48,-26],[-50,-28],[-52,-30],[-53,-32],[-55,-35],[-57,-38],[-62,-40],[-65,-42],[-66,-46],[-68,-50],[-70,-52],[-72,-50],[-74,-46],[-74,-42],[-73,-38],[-72,-35],[-71,-30],[-70,-25],[-70,-20],[-70,-18],[-72,-16],[-74,-14],[-76,-12],[-78,-5],[-79,0],[-78,3],[-78,6],[-80,8],[-80,10]],
  // Europe
  [[-10,36],[-8,38],[-6,43],[-4,44],[-2,44],[0,44],[2,46],[3,48],[5,50],[6,52],[8,54],[8,56],[10,58],[12,60],[14,62],[16,64],[18,66],[20,68],[22,70],[25,71],[28,70],[30,70],[32,68],[35,66],[38,64],[40,60],[42,56],[40,52],[36,48],[32,46],[30,44],[28,42],[26,40],[24,38],[22,36],[20,36],[18,38],[16,40],[14,42],[12,44],[10,46],[8,48],[6,50],[4,48],[2,46],[0,44],[-2,42],[-4,40],[-6,38],[-8,36],[-10,36]],
  // Africa
  [[-15,12],[-17,14],[-16,18],[-14,22],[-10,26],[-8,30],[-5,33],[-2,35],[0,36],[5,37],[10,37],[12,36],[15,34],[18,32],[22,32],[25,32],[28,30],[30,32],[32,30],[34,28],[36,25],[38,22],[40,18],[42,15],[44,12],[46,8],[48,5],[50,2],[48,0],[45,-4],[42,-8],[40,-12],[38,-18],[36,-22],[34,-26],[32,-28],[30,-30],[28,-32],[26,-34],[24,-33],[22,-30],[20,-28],[18,-25],[16,-22],[14,-18],[13,-14],[12,-10],[10,-5],[8,0],[5,4],[2,6],[0,8],[-3,10],[-6,12],[-8,14],[-10,14],[-12,12],[-15,12]],
  // Asia
  [[28,42],[32,42],[36,40],[40,38],[45,38],[50,38],[55,35],[58,34],[60,35],[62,38],[65,40],[68,42],[70,40],[72,38],[75,35],[78,32],[80,30],[82,28],[85,25],[88,22],[90,22],[92,20],[95,16],[98,14],[100,14],[102,16],[104,18],[106,20],[108,22],[110,20],[112,18],[114,16],[116,14],[118,16],[120,18],[122,22],[124,28],[126,32],[128,35],[130,38],[132,40],[134,42],[136,44],[138,42],[140,44],[142,46],[145,50],[148,54],[152,58],[156,60],[160,62],[165,65],[170,68],[175,70],[180,70],[180,65],[175,60],[170,55],[165,52],[160,50],[155,48],[150,45],[145,42],[142,40],[140,38],[138,36],[136,34],[134,32],[132,28],[130,24],[128,20],[126,16],[124,14],[122,12],[120,10],[118,6],[116,4],[114,2],[112,0],[110,-4],[108,-6],[106,-8],[108,-8],[110,-6],[112,-4],[110,-6],[108,-8],[105,-8],[102,-4],[100,0],[96,6],[92,12],[88,18],[84,22],[80,28],[76,32],[72,36],[68,40],[65,38],[62,35],[58,30],[55,32],[52,35],[48,38],[44,40],[40,42],[36,42],[32,42],[28,42]],
  // Australia (fixed: was -115, should be 115)
  [[115,-15],[118,-18],[120,-20],[123,-22],[126,-25],[128,-28],[130,-30],[132,-32],[135,-34],[138,-35],[140,-38],[142,-38],[145,-38],[148,-36],[150,-34],[152,-30],[154,-28],[153,-25],[150,-22],[148,-18],[146,-16],[144,-14],[142,-12],[140,-12],[138,-14],[136,-14],[134,-14],[132,-13],[130,-14],[128,-16],[126,-15],[124,-16],[122,-18],[120,-20],[118,-22],[116,-24],[115,-28],[116,-32],[118,-34],[120,-36],[122,-35],[125,-34],[128,-32],[130,-30],[115,-15]],
  // Greenland
  [[-55,60],[-50,62],[-48,64],[-45,66],[-42,68],[-38,70],[-35,72],[-30,74],[-25,76],[-20,78],[-18,80],[-22,82],[-28,83],[-35,83],[-42,82],[-48,80],[-52,78],[-54,75],[-56,72],[-58,68],[-58,65],[-55,60]],
  // Japan
  [[130,31],[132,33],[134,35],[136,37],[138,36],[140,38],[141,40],[142,43],[141,45],[140,44],[138,42],[136,38],[134,36],[132,34],[130,32],[130,31]],
  // UK/Ireland
  [[-10,51],[-8,52],[-6,53],[-5,55],[-4,57],[-3,58],[-2,57],[-1,55],[0,53],[1,52],[0,51],[-2,50],[-4,50],[-6,51],[-8,52],[-10,51]],
  // Iceland
  [[-24,64],[-22,65],[-18,66],[-15,66],[-14,65],[-16,64],[-18,63],[-20,63],[-22,63],[-24,64]],
  // Madagascar
  [[44,-12],[46,-15],[48,-18],[49,-21],[49,-24],[48,-26],[46,-25],[44,-22],[43,-19],[43,-16],[44,-12]],
  // New Zealand
  [[166,-34],[168,-36],[170,-38],[172,-40],[174,-42],[176,-44],[176,-46],[174,-46],[172,-44],[170,-42],[168,-40],[167,-38],[166,-36],[166,-34]],
  // Indonesia
  [[96,6],[98,4],[100,2],[102,0],[104,-2],[106,-4],[106,-6],[108,-7],[110,-7],[112,-7],[114,-8],[116,-8],[118,-8],[120,-8],[118,-6],[116,-4],[114,-2],[112,0],[110,2],[108,2],[106,2],[104,2],[102,2],[100,4],[98,6],[96,6]],
  // Philippines
  [[118,8],[120,10],[122,12],[124,14],[126,16],[126,18],[124,18],[122,16],[120,14],[118,12],[118,8]],
];

function createEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Ocean - solid dark
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 2048, 1024);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * 1024;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * 2048;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // Draw continents — pure white filled polygons
  for (const continent of continents) {
    ctx.beginPath();
    for (let i = 0; i < continent.length; i++) {
      const [lng, lat] = continent[i];
      const x = ((lng + 180) / 360) * 2048;
      const y = ((90 - lat) / 180) * 1024;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
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
