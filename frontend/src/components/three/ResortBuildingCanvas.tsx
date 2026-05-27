"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Tree } from "@dgreenheck/ez-tree";

/* ═══════════════════════════════════════════════
   PALM TREE BUILDER (EZ-Tree)
   ═══════════════════════════════════════════════ */

function makePalm(seed: number) {
  const tree = new Tree();

  // Guard: ensure options exist
  if (!tree.options) {
    console.error('EZ-Tree options undefined');
    return new THREE.Group();
  }

  const o = tree.options as any;
  o.seed = seed;
  o.trunk = o.trunk || {};
  o.trunk.length = 20;
  o.trunk.radius = 0.22;
  o.trunk.sections = 12;
  o.trunk.curvature = 0.2;
  o.trunk.color = 0x8b7355;
  o.branch = o.branch || {};
  o.branch.levels = 1;
  o.branch.children = 0;
  o.leaves = o.leaves || {};
  o.leaves.enabled = true;
  o.leaves.count = 18;
  o.leaves.start = 0.92;
  o.leaves.size = 3.2;
  o.leaves.sizeVariance = 0.2;
  o.leaves.color = 0x4a9e3f;
  o.leaves.angle = 62;
  o.leaves.angleVariance = 8;
  tree.generate();

  // Apply vertex color gradient to leaf meshes
  tree.traverse((child: any) => {
    if (child.isMesh) {
      const name = child.name.toLowerCase();
      if (!name.includes('leaf') &&
          !name.includes('leave')) return;

      const geo = child.geometry;
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      const darkG = new THREE.Color(0x2a5002);
      const lightG = new THREE.Color(0x9abb61);

      // Find Y bounds of this mesh
      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      // Assign color per vertex based on Y
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = maxY > minY ? (y - minY) / (maxY - minY) : 0;
        const c = darkG.clone().lerp(lightG, t);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      geo.setAttribute('color',
        new THREE.BufferAttribute(colors, 3));

      child.material.vertexColors = true;
      child.material.color.set(0xffffff);
      child.material.needsUpdate = true;
    }
  });

  return tree;
}

/* ═══════════════════════════════════════════════
   RESORT BUILDING — Three.js Mesh Group
   ═══════════════════════════════════════════════ */

function ResortBuilding() {
  const groupRef = useRef<THREE.Group>(null);

  // Materials (memoized)
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf5e6c8,
        roughness: 0.3,
        metalness: 0.1,
      }),
    []
  );

  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xd4a853,
        roughness: 0.4,
        metalness: 0.3,
      }),
    []
  );

  // Window materials — each window gets its own for individual animation
  const windowMats = useMemo(
    () =>
      Array.from({ length: 19 }, () =>
        new THREE.MeshStandardMaterial({
          color: 0xffe4a0,
          emissive: 0xffe4a0,
          emissiveIntensity: 0.8,
        })
      ),
    []
  );

  // Track tick for window animation
  const tickRef = useRef(0);

  // Collect window mesh refs so we can attach dollar planes
  const windowMeshes = useRef<THREE.Mesh[]>([]);

  const columnMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf5e6c8,
        roughness: 0.2,
        metalness: 0.2,
      }),
    []
  );

  const doorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        roughness: 0.5,
        metalness: 0.4,
      }),
    []
  );

  const railingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xd4a853,
        metalness: 0.5,
        roughness: 0.3,
      }),
    []
  );

  // Window positions — main tower: 3 rows × 5 cols
  const mainWindows = useMemo(() => {
    const positions: [number, number, number][] = [];
    const yValues = [1.5, 3.0, 4.5];
    for (const y of yValues) {
      for (let x = -2.4; x <= 2.4; x += 1.2) {
        positions.push([x, y, 2.03]);
      }
    }
    return positions;
  }, []);

  // Window positions — side wings: 2 rows × 2 cols each
  const wingWindows = useMemo(() => {
    const positions: { pos: [number, number, number] }[] = [];
    const yValues = [1.5, 3.0];
    for (const y of yValues) {
      for (const xOff of [-0.6, 0.6]) {
        positions.push({ pos: [-5.5 + xOff, y, 2.03] });
        positions.push({ pos: [5.5 + xOff, y, 2.03] });
      }
    }
    return positions;
  }, []);

  // Dollar sign texture — dark green $ on bright green background (avoids SSR)
  const dollarTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    // Solid bright green background to match window flash
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0, 0, 128, 128);
    // Dark green dollar sign
    ctx.fillStyle = '#0a3d1a';
    ctx.font = '900 88px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#062e10';
    ctx.strokeText('$', 64, 66);
    ctx.fillText('$', 64, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Attach dollar sign planes to every window (once meshes are mounted)
  useEffect(() => {
    windowMeshes.current.forEach((w) => {
      // Skip if already attached
      if (w.getObjectByName('dollarSign')) return;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.45, 0.4),
        new THREE.MeshBasicMaterial({
          map: dollarTex,
          transparent: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.FrontSide,
        })
      );
      // Default hidden — positioned just in front of window
      plane.position.set(0, 0, 0.04);
      plane.name = 'dollarSign';
      plane.visible = false;
      w.add(plane);
    });
  }, [dollarTex]);

  // Track which mat index belongs to which mesh for safe reset
  const windowIndexMap = useRef<Map<THREE.Mesh, number>>(new Map());

  // Reset all windows to default state on mount (fixes stale green from HMR)
  useEffect(() => {
    windowMats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.8;
      m.color.setHex(0xffe4a0);
      m.emissive.setHex(0xffe4a0);
    });
  }, []);

  // Animate windows — random ownership flash with dollar sign pulse
  useFrame(() => {
    tickRef.current++;
    if (tickRef.current % 40 === 0) {
      const meshes = windowMeshes.current;
      const idx = Math.floor(Math.random() * meshes.length);
      const w = meshes[idx];
      if (!w) return;
      const mat = windowMats[idx] as THREE.MeshStandardMaterial;

      // Flash window green
      mat.emissiveIntensity = 2.5;
      mat.color.setHex(0x00ff88);
      mat.emissive.setHex(0x00ff88);

      // Show dollar sign
      const dollar = w.getObjectByName('dollarSign') as THREE.Mesh | undefined;
      if (dollar) {
        dollar.visible = true;
        // Animate scale pulse
        dollar.scale.set(0.5, 0.5, 0.5);
        let pulse = 0;
        const grow = setInterval(() => {
          pulse++;
          const s = 0.5 + pulse * 0.08;
          dollar.scale.set(s, s, s);
          if (pulse >= 8) clearInterval(grow);
        }, 30);
      }

      // Reset after 900ms — use material by index to avoid stale ref
      setTimeout(() => {
        mat.emissiveIntensity = 0.8;
        mat.color.setHex(0xffe4a0);
        mat.emissive.setHex(0xffe4a0);
        const dollar = w.getObjectByName('dollarSign') as THREE.Mesh | undefined;
        if (dollar) {
          dollar.visible = false;
          dollar.scale.set(1, 1, 1);
        }
      }, 900);
    }
  });

  return (
    <group ref={groupRef}>
      {/* ═══ MAIN TOWER ═══ */}
      <mesh position={[0, 3, 0]} material={wallMat} castShadow>
        <boxGeometry args={[8, 6, 4]} />
      </mesh>

      {/* ═══ SIDE WINGS ═══ */}
      <mesh position={[-5.5, 2, 0]} material={wallMat} castShadow>
        <boxGeometry args={[3, 4, 4]} />
      </mesh>
      <mesh position={[5.5, 2, 0]} material={wallMat} castShadow>
        <boxGeometry args={[3, 4, 4]} />
      </mesh>

      {/* ═══ ROOFS ═══ */}
      <mesh position={[0, 6.15, 0]} material={roofMat} castShadow>
        <boxGeometry args={[8.4, 0.3, 4.4]} />
      </mesh>
      <mesh position={[-5.5, 4.15, 0]} material={roofMat} castShadow>
        <boxGeometry args={[3.4, 0.3, 4.4]} />
      </mesh>
      <mesh position={[5.5, 4.15, 0]} material={roofMat} castShadow>
        <boxGeometry args={[3.4, 0.3, 4.4]} />
      </mesh>

      {/* ═══ WINDOWS — MAIN TOWER (3 rows × 5 cols) ═══ */}
      {mainWindows.map((pos, i) => (
        <mesh
          key={`mw-${i}`}
          ref={(el) => { if (el) windowMeshes.current[i] = el; }}
          position={pos}
          material={windowMats[i]}
          castShadow
        >
          <boxGeometry args={[0.6, 0.5, 0.05]} />
        </mesh>
      ))}

      {/* ═══ WINDOWS — SIDE WINGS (2 rows × 2 cols each) ═══ */}
      {wingWindows.map((w, i) => (
        <mesh
          key={`ww-${i}`}
          ref={(el) => { if (el) windowMeshes.current[15 + i] = el; }}
          position={w.pos}
          material={windowMats[15 + i]}
          castShadow
        >
          <boxGeometry args={[0.6, 0.5, 0.05]} />
        </mesh>
      ))}

      {/* ═══ ENTRANCE PORTICO ═══ */}
      <mesh position={[0, 1.8, 2.75]} material={roofMat} castShadow>
        <boxGeometry args={[3, 0.2, 1.5]} />
      </mesh>
      <mesh position={[-1.2, 0.9, 2.75]} material={columnMat} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.8, 8]} />
      </mesh>
      <mesh position={[1.2, 0.9, 2.75]} material={columnMat} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.8, 8]} />
      </mesh>

      {/* ═══ ENTRANCE DOOR ═══ */}
      <mesh position={[0, 0.6, 2.03]} material={doorMat} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.05]} />
      </mesh>

      {/* ═══ ROOFTOP RAILING ═══ */}
      <mesh position={[0, 6.5, 2.2]} material={railingMat} castShadow>
        <boxGeometry args={[8.4, 0.4, 0.08]} />
      </mesh>
      <mesh position={[0, 6.5, -2.2]} material={railingMat} castShadow>
        <boxGeometry args={[8.4, 0.4, 0.08]} />
      </mesh>
      <mesh position={[-4.2, 6.5, 0]} material={railingMat} castShadow>
        <boxGeometry args={[0.08, 0.4, 4.4]} />
      </mesh>
      <mesh position={[4.2, 6.5, 0]} material={railingMat} castShadow>
        <boxGeometry args={[0.08, 0.4, 4.4]} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   GOLDEN PULSE RING — ownership token animation
   ═══════════════════════════════════════════════ */

function PulseRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const state = useRef({ scale: 1, opacity: 0.8 });

  const ringGeo = useMemo(() => new THREE.RingGeometry(0.1, 0.3, 64), []);

  useFrame(() => {
    const s = state.current;
    s.scale += 0.04;
    s.opacity -= 0.008;
    if (s.opacity <= 0) {
      s.scale = 1;
      s.opacity = 0.8;
    }
    if (ringRef.current) {
      ringRef.current.scale.set(s.scale, s.scale, 1);
    }
    if (matRef.current) {
      matRef.current.opacity = s.opacity;
    }
  });

  return (
    <mesh
      ref={ringRef}
      geometry={ringGeo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.9, 0]}
    >
      <meshBasicMaterial
        ref={matRef}
        color={0xd4a853}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   TOKEN ORBS — floating investor tokens
   ═══════════════════════════════════════════════ */

function TokenOrbs() {
  const groupRef = useRef<THREE.Group>(null);
  const tokenData = useRef<{
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    speed: number;
    startY: number;
    xDrift: number;
  }[]>([]);

  useMemo(() => {
    const orbGeo = new THREE.SphereGeometry(0.12, 8, 8);
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd4a853,
        emissive: 0xd4a853,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.9,
      });
      const orb = new THREE.Mesh(orbGeo, mat);
      orb.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 6,
        (Math.random() - 0.5) * 2
      );
      tokenData.current.push({
        mesh: orb,
        mat,
        speed: 0.01 + Math.random() * 0.02,
        startY: orb.position.y,
        xDrift: (Math.random() - 0.5) * 0.008,
      });
    }
  }, []);

  useFrame(() => {
    if (!groupRef.current && tokenData.current.length > 0) {
      // Mount orbs on first frame
      // (done in useFrame because we need the group ref)
    }
    tokenData.current.forEach((t) => {
      t.mesh.position.y += t.speed;
      t.mesh.position.x += t.xDrift;
      t.mat.opacity = Math.max(0, 1 - (t.mesh.position.y - t.startY) / 8);
      if (t.mesh.position.y > t.startY + 8) {
        t.mesh.position.y = t.startY;
        t.mat.opacity = 0.9;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {tokenData.current.map((t, i) => (
        <primitive key={i} object={t.mesh} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   CANVAS WRAPPER
   ═══════════════════════════════════════════════ */

export default function ResortBuildingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      id="resort-canvas-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "block",
      }}
    >
    <Canvas
      camera={{ position: [0, 5, 32], fov: 52, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      shadows
      onCreated={({ gl, scene, camera }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        scene.fog = new THREE.Fog(0x1a0a2e, 40, 120);

        // Camera lookAt + update
        camera.lookAt(0, 3, 0);

        // Fix canvas positioning — relative, not absolute
        const container = document.getElementById('resort-canvas-container')!;
        gl.domElement.style.position = 'relative';
        gl.domElement.style.display = 'block';
        gl.domElement.style.width = '100%';
        gl.domElement.style.height = '100%';
        gl.domElement.style.top = '';
        gl.domElement.style.left = '';

        // Size renderer to actual container dimensions
        gl.setSize(container.offsetWidth, container.offsetHeight, false);
        gl.setPixelRatio(window.devicePixelRatio);
        const pc = camera as THREE.PerspectiveCamera;
        pc.aspect = container.offsetWidth / container.offsetHeight;
        pc.updateProjectionMatrix();

        // Responsive resize — read actual container size
        const onResize = () => {
          const w = container.offsetWidth;
          const h = container.offsetHeight;
          gl.setSize(w, h, false);
          const cam = camera as THREE.PerspectiveCamera;
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);
        (container as any).__resizeCleanup = () => {
          window.removeEventListener("resize", onResize);
        };

        // Palm trees — EZ-Tree (must run after renderer/scene init)
        const L1 = makePalm(44);
        L1.position.set(-13, -1, 0);
        L1.scale.setScalar(0.45);
        L1.rotation.y = 0.1;
        scene.add(L1);

        const L2 = makePalm(55);
        L2.position.set(-11, -1, -2);
        L2.scale.setScalar(0.38);
        L2.rotation.y = 0.2;
        scene.add(L2);

        const L3 = makePalm(66);
        L3.position.set(-15, -1, -1.5);
        L3.scale.setScalar(0.35);
        L3.rotation.y = -0.1;
        scene.add(L3);

        const R1 = makePalm(44);
        R1.position.set(13, -1, 0);
        R1.scale.setScalar(0.45);
        scene.add(R1);

        const R2 = makePalm(55);
        R2.position.set(11, -1, -2);
        R2.scale.setScalar(0.38);
        scene.add(R2);

        const R3 = makePalm(66);
        R3.position.set(15, -1, -1.5);
        R3.scale.setScalar(0.35);
        scene.add(R3);

        [L1, L2, L3, R1, R2, R3].forEach((t) => {
          t.traverse((c: any) => {
            if (c.isMesh) c.castShadow = true;
          });
        });
      }}
    >
      {/* 1. Hemisphere Light — warm sky / cool ground */}
      <hemisphereLight args={[0xff6b35, 0x1a0a2e, 0.6]} />

      {/* 2. Directional Light (sun) */}
      <directionalLight
        color={0xff8c42}
        intensity={1.8}
        position={[20, 30, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* 3. Directional Light (fill/cool) */}
      <directionalLight
        color={0x7b9cbf}
        intensity={0.4}
        position={[-15, 10, -5]}
      />

      {/* 4. Point Light (window glow, inside building) */}
      <pointLight
        color={0xffe4a0}
        intensity={1.2}
        distance={8}
        decay={2}
        position={[0, 3, 1.5]}
      />

      {/* Building — scaled up */}
      <group position={[0, -1, 0]} scale={[1.8, 1.8, 1.8]}>
        <ResortBuilding />
      </group>

      {/* Golden ownership pulse ring */}
      <PulseRing />

      {/* Token orbs floating upward */}
      <TokenOrbs />

    </Canvas>
    </div>
  );
}
