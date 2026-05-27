"use client";

import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Float, AdaptiveDpr, AdaptiveEvents, Html } from "@react-three/drei";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   ATMOSPHERE SHADER — Fresnel edge glow + noise
   ═══════════════════════════════════════════════ */

// Vertex shader shared by atmosphere shells
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Atmosphere fragment: fresnel glow + subtle noise distortion
const atmosphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  uniform float uFresnelPower;
  uniform vec3 uSunDirection;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  // Simplex-style noise for subtle distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Fresnel — edges glow brightest
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), uFresnelPower);

    // Animated noise for organic distortion
    float noise = snoise(vWorldPosition * 2.0 + uTime * 0.08) * 0.12;

    // Depth falloff — fragments facing away from camera dim
    float depthFalloff = smoothstep(0.0, 0.4, max(dot(vViewDir, vNormal), 0.0));
    depthFalloff = mix(1.0, depthFalloff, 0.35); // subtle effect

    float alpha = (uBaseOpacity + fresnel * 0.35 + noise) * depthFalloff;
    alpha = clamp(alpha, 0.0, 1.0);

    // Atmospheric scattering — Rayleigh approximation
    float sunDot = dot(normalize(vWorldPosition), uSunDirection);
    vec3 sunSideColor = vec3(0.3, 0.5, 0.9);
    vec3 shadowSideColor = vec3(0.1, 0.1, 0.3);
    vec3 scatterColor = mix(shadowSideColor, sunSideColor, smoothstep(-0.3, 0.6, sunDot));

    // Soft bloom on illuminated hemisphere
    float bloomGlow = smoothstep(0.0, 0.6, sunDot) * fresnel * 0.3;

    // Combine: base color + scattering + fresnel highlight + bloom
    vec3 col = mix(uColor, scatterColor, 0.5) + fresnel * vec3(0.04, 0.02, 0.08) + vec3(0.3, 0.5, 0.9) * bloomGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════
   WIREFRAME SHADERS — Cinematic globe lines
   ═══════════════════════════════════════════════ */

const wireframeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistortionAmplitude;
  uniform float uDistortionFreq;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;
  varying float vViewZ;
  varying vec3 vLocalPos;
  varying float vLatitude;
  varying vec3 vWorldNormal;

  void main() {
    vec3 pos = position;

    // Subtle waveform distortion — makes lines feel organic
    float wave = sin(pos.x * uDistortionFreq + uTime * 0.25) * uDistortionAmplitude;
    wave += sin(pos.y * uDistortionFreq * 1.3 + uTime * 0.18) * uDistortionAmplitude * 0.6;
    wave += sin(pos.z * uDistortionFreq * 0.7 + uTime * 0.22) * uDistortionAmplitude * 0.4;
    pos += normal * wave;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vLocalPos = position; // original position for hash
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vViewZ = -(modelViewMatrix * vec4(pos, 1.0)).z;

    // Latitude from normalized position
    vLatitude = abs(position.y) / 1.55; // approximate normalized latitude

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const wireframeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLineColor;
  uniform vec3 uHighlightColor;
  uniform float uBaseOpacity;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uIntersectionGlow;
  uniform vec3 uSunDirection;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;
  varying float vViewZ;
  varying vec3 vLocalPos;
  varying float vLatitude;
  varying vec3 vWorldNormal;

  // Simple hash for per-vertex brightness variation
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  // Simple noise for luminosity fluctuation
  float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    // ═══ Day/night shading with softer terminator ═══
    float sunDot = dot(normalize(vWorldNormal), uSunDirection);
    float daylight = smoothstep(-0.2, 0.5, sunDot); // softer terminator transition
    float dayFactor = 0.3 + 0.7 * daylight; // hologram — never fully dark

    // Terminator warm amber tint
    float terminatorMask = smoothstep(-0.05, 0.1, sunDot) * smoothstep(0.2, 0.1, sunDot);
    vec3 terminatorColor = vec3(0.8, 0.4, 0.2) * terminatorMask * 0.08;

    // Ambient blue bounce light from opposite side
    float bounceLight = max(0.0, -sunDot) * 0.08;
    vec3 bounceColor = vec3(0.15, 0.2, 0.4) * bounceLight;

    // ═══ Camera-angle opacity: front lines bright, rear fade ═══
    float facingDot = dot(vNormal, vViewDir);
    float facingAlpha = smoothstep(-0.1, 0.6, facingDot);

    // ═══ Depth fog: distant geometry dissolves ═══
    float depthFactor = smoothstep(uFogNear, uFogFar, vViewZ);
    depthFactor = 1.0 - depthFactor;

    // ═══ Pole fading: lines near poles soften ═══
    float poleFade = 1.0 - smoothstep(0.6, 1.0, vLatitude);

    // ═══ Horizon fading: lines near equator edge soften slightly ═══
    float horizonFade = 1.0 - (1.0 - abs(facingDot)) * 0.3;

    // ═══ Animated luminosity fluctuation ═══
    float luminosity = sin(vLocalPos.x * 10.0 + uTime * 0.3) * 0.06;
    luminosity += sin(vLocalPos.y * 8.0 + uTime * 0.22) * 0.04;
    luminosity += sin(vLocalPos.z * 12.0 + uTime * 0.28) * 0.03;

    // ═══ Randomized per-vertex brightness ═══
    float randomBright = hash(vLocalPos * 100.0) * 0.15 - 0.075;

    // ═══ Line intersection glow ═══
    float gridX = abs(fract(vLocalPos.x * 5.0 + 0.5) - 0.5);
    float gridY = abs(fract(vLocalPos.y * 5.0 + 0.5) - 0.5);
    float gridZ = abs(fract(vLocalPos.z * 5.0 + 0.5) - 0.5);
    float intersectionProximity = 1.0 - min(min(gridX, gridY), gridZ) * 2.0;
    intersectionProximity = pow(max(intersectionProximity, 0.0), 3.0) * uIntersectionGlow;

    // ═══ Combine all factors ═══
    float brightness = 1.0 + luminosity + randomBright + intersectionProximity;
    brightness = max(brightness, 0.0);

    float alpha = uBaseOpacity * facingAlpha * depthFactor * poleFade * horizonFade * brightness * dayFactor;
    alpha = clamp(alpha, 0.0, 1.0);

    // Color: base line color with subtle white highlight at intersections + day/night + terminator
    vec3 col = mix(uLineColor, uHighlightColor, intersectionProximity * 0.6);
    col += vec3(0.02, 0.03, 0.06) * luminosity;
    col += terminatorColor;
    col += bounceColor;
    col *= dayFactor;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════
   CONTINENT SHADER — Earth texture with land detection
   ═══════════════════════════════════════════════ */

const continentVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const continentFragmentShader = /* glsl */ `
  uniform sampler2D uEarthTexture;
  uniform vec3 uSunDirection;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPosition;

  void main() {
    vec4 texColor = texture2D(uEarthTexture, vUv);

    // Detect land vs ocean using luminance and color analysis
    // Blue Marble: oceans are dark blue, land is green/brown
    float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float blueDominance = texColor.b - max(texColor.r, texColor.g);
    float isOcean = step(0.08, blueDominance) * step(lum, 0.35);
    // Also mark very dark areas (deep ocean) as ocean
    float isDarkOcean = step(lum, 0.06);
    float isLand = 1.0 - max(isOcean, isDarkOcean);

    // Coastline detection using texture derivatives
    float landN = isLand; // simplified — use dFdx/dFdy for real edge detection
    float dx = dFdx(isLand);
    float dy = dFdy(isLand);
    float coastline = length(vec2(dx, dy)) * 40.0;
    coastline = min(coastline, 1.0);

    // Day/night shading
    float daylight = max(0.0, dot(vNormal, uSunDirection));
    float dayFactor = 0.25 + 0.75 * daylight; // hologram never goes fully dark

    // Terminator warm tint
    float terminator = 1.0 - smoothstep(0.0, 0.15, abs(daylight - 0.05));
    vec3 terminatorColor = vec3(0.15, 0.08, 0.02) * terminator;

    // Fresnel edge glow
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), 2.5);

    // Base continent color: holographic blue-white
    vec3 landColor = vec3(0.35, 0.55, 0.75);
    // Slight warm tint on sunlit side
    landColor += vec3(0.08, 0.04, 0.0) * daylight;
    // Coastline glow — brighter cyan-white edge
    vec3 coastlineColor = vec3(0.5, 0.75, 0.9);

    // Combine
    vec3 col = landColor * dayFactor + terminatorColor;
    col = mix(col, coastlineColor, coastline * 0.7);
    col += fresnel * vec3(0.08, 0.12, 0.18);

    // Opacity: land is semi-transparent, ocean is transparent, coastlines glow
    float landAlpha = isLand * (0.22 + 0.08 * daylight) * dayFactor;
    float coastAlpha = coastline * 0.55 * dayFactor;
    float alpha = max(landAlpha, coastAlpha);

    // Ocean specular highlights — subtle reflections on sun-facing hemisphere
    float sunDot = dot(vNormal, uSunDirection);
    float oceanSpecular = 0.0;
    if (isOcean > 0.5 && sunDot > 0.0) {
      vec3 reflDir = reflect(-uSunDirection, vNormal);
      oceanSpecular = pow(max(0.0, dot(reflDir, vViewDir)), 32.0) * 0.15 * step(0.0, sunDot);
    }
    col += vec3(0.4, 0.6, 0.8) * oceanSpecular;
    alpha += oceanSpecular * isOcean;

    // Cloud shadows — sample simplified cloud noise to darken surface below clouds
    // Replicate cloud FBM at same UV position (clouds rotate slightly faster)
    vec2 cloudUv = vUv;
    cloudUv.x += uTime * 0.003; // match cloud wind speed
    float cloudDensity = 0.0;
    {
      float cv = 0.0; float ca = 0.5;
      vec2 cp = cloudUv * 8.0 + vec2(uTime * 0.01, 0.0);
      vec2 cshift = vec2(100.0);
      for (int ci = 0; ci < 5; ci++) {
        vec2 ci2 = floor(cp); vec2 cf = fract(cp); cf = cf*cf*(3.0-2.0*cf);
        vec3 cp3 = fract(vec3(ci2.xyx) * vec3(0.1031, 0.1030, 0.0973));
        cp3 += dot(cp3, cp3.yzx + 33.33);
        float ch = fract((cp3.x+cp3.y)*cp3.z);
        float c2 = fract(sin(dot(ci2+vec2(1.0,0.0), vec3(12.9898,78.233,45.164)))) ;
        float c3 = fract(sin(dot(ci2+vec2(0.0,1.0), vec3(12.9898,78.233,45.164)))) ;
        float c4 = fract(sin(dot(ci2+vec2(1.0,1.0), vec3(12.9898,78.233,45.164)))) ;
        float cn = mix(mix(ch, c2, cf.x), mix(c3, c4, cf.x), cf.y);
        cv += ca * cn; cp = cp * 2.0 + cshift; ca *= 0.5;
      }
      cloudDensity = smoothstep(0.45, 0.7, cv);
    }
    float cloudShadow = 1.0 - cloudDensity * 0.15;
    col *= cloudShadow;

    alpha = clamp(alpha, 0.0, 0.6);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════
   CLOUD LAYER SHADER
   ═══════════════════════════════════════════════ */

const cloudVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // Simple hash-based noise for cloud patterns
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    // Animate UVs slightly for wind movement
    uv.x += uTime * 0.003;

    // Multi-octave noise for cloud shapes
    float cloud = fbm(uv * 8.0 + vec2(uTime * 0.01, 0.0));
    cloud = smoothstep(0.45, 0.7, cloud);

    // Day/night: clouds slightly brighter on sun side
    float daylight = max(0.0, dot(vNormal, uSunDirection));
    float dayFactor = 0.4 + 0.6 * daylight;

    vec3 col = vec3(0.7, 0.8, 0.9) * dayFactor;
    float alpha = cloud * 0.09 * dayFactor;

    gl_FragColor = vec4(col, alpha);
  }
`;

// Ionosphere fragment: softer, pulsing outer glow
const ionosphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  uniform float uFresnelPower;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), uFresnelPower);

    // Slow sine pulse on opacity
    float pulse = 1.0 + 0.3 * sin(uTime * 0.2);

    float alpha = (uBaseOpacity + fresnel * 0.15) * pulse;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(uColor, alpha);
  }
`;

/* ═══════════════════════════════════════════════
   HOLOGRAPHIC GLOBE — 3-layer atmospheric system
   ═══════════════════════════════════════════════ */
function HolographicGlobe({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const earthRef = useRef<THREE.Mesh>(null!);
  const atmosphereRef = useRef<THREE.Mesh>(null!);
  const cloudMeshRef = useRef<THREE.Mesh>(null!);
  const scrollOffsetRef = useRef(0);

  // Load textures from local public folder
  const [dayMap, bumpMap, specularMap] = useLoader(THREE.TextureLoader, [
    '/textures/earth-hd.jpg',
    '/textures/earth-topology.png',
    '/textures/earth-water.png',
  ]);

  // Configure textures for sharp rendering (must be after useLoader, inside Canvas)
  const { gl } = useThree();
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    dayMap.colorSpace = THREE.SRGBColorSpace;
    [dayMap, bumpMap, specularMap].forEach((tex) => {
      if (tex) {
        tex.anisotropy = maxAniso;
        tex.needsUpdate = true;
      }
    });
  }, [dayMap, bumpMap, specularMap, gl]);

  // Procedural cloud texture
  const cloudsMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 512);

    // Generate cloud-like patterns using random circles
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 60;
      const alpha = 0.02 + Math.random() * 0.08;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Add some denser cloud bands
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 1024;
      const y = 100 + Math.random() * 312; // tropical band
      const r = 20 + Math.random() * 40;
      const alpha = 0.03 + Math.random() * 0.06;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Smoothly interpolate scroll-driven rotation offset
    const scrollRot = 0;

    const rotY = t * 0.04 + BASE_ROT_Y;
    const rotX = 0.15 + Math.sin(t * 0.025) * 0.04;

    // Earth rotation
    earthRef.current.rotation.y = rotY;
    earthRef.current.rotation.x = rotX;

    // Clouds rotate slightly faster (wind simulation)
    cloudMeshRef.current.rotation.y = rotY + t * 0.0003;
    cloudMeshRef.current.rotation.x = rotX;

    // Atmosphere follows Earth
    atmosphereRef.current.rotation.y = t * 0.065 + BASE_ROT_Y;
    atmosphereRef.current.rotation.x = 0.12 + Math.sin(t * 0.04) * 0.04;
  });

  return (
    <group>
      {/* Realistic Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          bumpMap={bumpMap}
          bumpScale={0.4}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={15}
        />
      </mesh>

      {/* Cloud layer — procedural, slightly larger sphere, faster rotation */}
      <mesh ref={cloudMeshRef} renderOrder={1}>
        <sphereGeometry args={[1.505 * 1.5, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap || undefined}
          transparent
          opacity={cloudsMap ? 0.35 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow — blue tinted shell */}
      <mesh ref={atmosphereRef} renderOrder={2}>
        <sphereGeometry args={[1.01 * 1.5, 64, 64]} />
        <meshPhongMaterial
          color={0x4488ff}
          transparent
          opacity={0.12}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ORBIT RINGS — Layered transparent orbits
   ═══════════════════════════════════════════════ */
function OrbitRings() {
  return (
    <group>
      <Float speed={0.5} rotationIntensity={0} floatIntensity={0}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.008, 16, 128]} />
          <meshStandardMaterial
            color="#6c63ff"
            emissive="#6c63ff"
            emissiveIntensity={1.0}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>

      <Float speed={0.4} rotationIntensity={0} floatIntensity={0}>
        <mesh rotation={[Math.PI / 2.8, 0.4, 0.2]}>
          <torusGeometry args={[2.5, 0.006, 16, 128]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.8}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>

      <Float speed={0.3} rotationIntensity={0} floatIntensity={0}>
        <mesh rotation={[Math.PI / 3.5, -0.3, 0.5]}>
          <torusGeometry args={[2.8, 0.004, 16, 128]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.6}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>

      <Float speed={0.2} rotationIntensity={0} floatIntensity={0}>
        <mesh rotation={[Math.PI / 4.5, 0.6, -0.3]}>
          <torusGeometry args={[3.2, 0.003, 16, 128]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.4}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   FINANCIAL ROUTING NETWORK
   Global financial hub network — 7 major cities
   ═══════════════════════════════════════════════ */

const GLOBE_RADIUS = 1.55;
const HUB_RADIUS = 1.52; // earth sphere radius (1.5) + 0.02 offset to sit flush
const BASE_ROT_Y = Math.PI * 0.65; // Russia/Central Asia visible in globe crop (right-offset viewport)

interface FinancialHub {
  name: string;
  abbr: string;
  lat: number;
  lng: number;
  spawnDelay: number; // ms delay before fade-in starts
}

const FINANCIAL_HUBS: FinancialHub[] = [
  // Americas (base 0ms, +150ms each)
  { name: "New York", abbr: "NYC", lat: 40.7, lng: -74.0, spawnDelay: 0 },
  { name: "São Paulo", abbr: "SAO", lat: -23.5, lng: -46.6, spawnDelay: 150 },
  { name: "Mexico City", abbr: "MEX", lat: 19.4, lng: -99.1, spawnDelay: 300 },
  { name: "Toronto", abbr: "YYZ", lat: 43.7, lng: -79.4, spawnDelay: 450 },
  { name: "Buenos Aires", abbr: "BUE", lat: -34.6, lng: -58.4, spawnDelay: 600 },
  { name: "Bogotá", abbr: "BOG", lat: 4.7, lng: -74.1, spawnDelay: 750 },
  // Europe (base 800ms, +150ms each)
  { name: "London", abbr: "LON", lat: 51.5, lng: -0.1, spawnDelay: 800 },
  { name: "Paris", abbr: "PAR", lat: 48.9, lng: 2.4, spawnDelay: 950 },
  { name: "Frankfurt", abbr: "FRA", lat: 50.1, lng: 8.7, spawnDelay: 1100 },
  { name: "Amsterdam", abbr: "AMS", lat: 52.4, lng: 4.9, spawnDelay: 1250 },
  { name: "Zurich", abbr: "ZUR", lat: 47.4, lng: 8.5, spawnDelay: 1400 },
  { name: "Milan", abbr: "MIL", lat: 45.5, lng: 9.2, spawnDelay: 1550 },
  { name: "Madrid", abbr: "MAD", lat: 40.4, lng: -3.7, spawnDelay: 1700 },
  // Middle East & Africa (base 1600ms, +150ms each)
  { name: "Dubai", abbr: "DXB", lat: 25.2, lng: 55.3, spawnDelay: 1600 },
  { name: "Riyadh", abbr: "RUH", lat: 24.7, lng: 46.7, spawnDelay: 1750 },
  { name: "Lagos", abbr: "LOS", lat: 6.5, lng: 3.4, spawnDelay: 1900 },
  { name: "Nairobi", abbr: "NBO", lat: -1.3, lng: 36.8, spawnDelay: 2050 },
  { name: "Johannesburg", abbr: "JNB", lat: -26.2, lng: 28.0, spawnDelay: 2200 },
  // Asia-Pacific (base 2400ms, +150ms each)
  { name: "Tokyo", abbr: "TYO", lat: 35.7, lng: 139.7, spawnDelay: 2400 },
  { name: "Singapore", abbr: "SGP", lat: 1.3, lng: 103.8, spawnDelay: 2550 },
  { name: "Hong Kong", abbr: "HKG", lat: 22.3, lng: 114.2, spawnDelay: 2700 },
  { name: "Shanghai", abbr: "SHA", lat: 31.2, lng: 121.5, spawnDelay: 2850 },
  { name: "Mumbai", abbr: "BOM", lat: 19.1, lng: 72.9, spawnDelay: 3000 },
  { name: "Seoul", abbr: "ICN", lat: 37.6, lng: 127.0, spawnDelay: 3150 },
  { name: "Sydney", abbr: "SYD", lat: -33.9, lng: 151.2, spawnDelay: 3300 },
  { name: "Bangkok", abbr: "BKK", lat: 13.8, lng: 100.5, spawnDelay: 3450 },
  { name: "Jakarta", abbr: "JKT", lat: -6.2, lng: 106.8, spawnDelay: 3600 },
];

interface RouteDef {
  from: number;
  to: number;
}

const ROUTE_DEFS: RouteDef[] = [
  // Americas corridors
  { from: 0, to: 6 },   // NYC → LON — Atlantic corridor
  { from: 0, to: 3 },   // NYC → TOR — North America
  { from: 0, to: 1 },   // NYC → SAO — Americas South
  { from: 1, to: 5 },   // SAO → BOG — South America
  { from: 1, to: 4 },   // SAO → BUE — Southern cone
  { from: 2, to: 5 },   // MEX → BOG — Central America
  // Europe corridors
  { from: 6, to: 13 },  // LON → DXB — Europe-Middle East
  { from: 6, to: 9 },   // LON → AMS — Northern Europe
  { from: 7, to: 10 },  // PAR → ZUR — Western Europe
  { from: 8, to: 11 },  // FRA → MIL — Central Europe
  { from: 12, to: 0 },  // MAD → NYC — Transatlantic
  // Middle East & Africa corridors
  { from: 13, to: 14 }, // DXB → RUH — Gulf
  { from: 13, to: 19 }, // DXB → BOM — Middle East-Asia
  { from: 15, to: 17 }, // LOS → JNB — West-South Africa
  { from: 16, to: 13 }, // NBO → DXB — East Africa-Gulf
  // Asia-Pacific corridors
  { from: 18, to: 22 }, // TYO → SHA — East Asia
  { from: 19, to: 20 }, // SGP → HKG — Southeast Asia
  { from: 20, to: 21 }, // HKG → SHA — Greater China
  { from: 23, to: 18 }, // ICN → TYO — Northeast Asia
  { from: 24, to: 19 }, // SYD → SGP — Oceania-Asia
  { from: 25, to: 19 }, // BKK → SGP — ASEAN
  { from: 26, to: 25 }, // JKT → BKK — Southeast Asia
  // Cross-regional corridors
  { from: 6, to: 20 },  // LON → HKG — Europe-Asia
  { from: 0, to: 13 },  // NYC → DXB — Cross-Atlantic
  { from: 8, to: 19 },  // FRA → SGP — Europe-Asia
  { from: 7, to: 18 },  // PAR → TYO — Europe-Pacific
  { from: 10, to: 19 }, // ZUR → SGP — Europe-Asia
  { from: 1, to: 6 },   // SAO → LON — South America-Europe
  { from: 24, to: 18 }, // SYD → TYO — Pacific
  { from: 0, to: 18 },  // NYC → TYO — Transpacific
];

// Lat/lng → 3D position on sphere
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Cubic ease-in-out for natural pulse acceleration
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Route state machine
type RouteState = 'inactive' | 'activating' | 'active' | 'deactivating';

interface RouteAnimState {
  state: RouteState;
  progress: number;
  brightness: number;
  pulseT: number;
  cooldown: number;
  cooldownTimer: number;
}

// --- Route line shaders ---
const routeLineVertexShader = /* glsl */ `
  attribute float aOpacity;
  varying float vOpacity;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vOpacity = aOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const routeLineFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlobalBrightness;
  varying float vOpacity;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vec3 surfaceNormal = normalize(vWorldPos);
    float depthFade = smoothstep(-0.3, 0.8, dot(surfaceNormal, vViewDir));
    // Enhanced depth-of-field: back-of-globe routes dimmer
    float depthDOF = smoothstep(-0.5, 0.3, dot(surfaceNormal, vViewDir));
    float routeOpacity = vOpacity * mix(0.15, 1.0, depthDOF);
    float alpha = routeOpacity * uGlobalBrightness * depthFade;
    alpha = clamp(alpha, 0.0, 1.0);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// --- Pulse trail shaders (tight core, minimal halo) ---
const pulseTrailVertexShader = /* glsl */ `
  attribute float aTrailOpacity;
  attribute float aPointSize;
  varying float vTrailOpacity;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vTrailOpacity = aTrailOpacity;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aPointSize * (40.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const pulseTrailFragmentShader = /* glsl */ `
  uniform vec3 uPulseColor;
  uniform float uTime;
  varying float vTrailOpacity;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Tight concentrated core with minimal halo
    float core = 1.0 - smoothstep(0.0, 0.15, d);
    float halo = 1.0 - smoothstep(0.1, 0.35, d);
    float softEdge = core * 0.7 + halo * 0.3;

    vec3 surfaceNormal = normalize(vWorldPos);
    float depthFade = smoothstep(-0.15, 0.6, dot(surfaceNormal, vViewDir));
    // Enhanced depth-of-field: back-of-globe pulses dimmer
    float depthDOF = smoothstep(-0.5, 0.3, dot(surfaceNormal, vViewDir));
    float routeFade = mix(0.15, 1.0, depthDOF);

    float alpha = vTrailOpacity * softEdge * depthFade * routeFade;
    alpha = clamp(alpha, 0.0, 1.0);
    gl_FragColor = vec4(uPulseColor, alpha);
  }
`;

const TRAIL_LENGTH = 18;
const CURVE_SEGMENTS = 120;
const PULSE_COLOR = new THREE.Color("#4ecdc4");
const ROUTE_COLOR = new THREE.Color("#4a6fa5");
const ROUTE_ACTIVE_COLOR = new THREE.Color("#6c63ff");
const CORE_COLOR = "#88ccff";
const RING_COLOR = "#6c63ff";

/* ═══════════════════════════════════════════════
   CityBeacon — Layered beacon for a single hub
   ═══════════════════════════════════════════════ */
function CityBeacon({
  position,
  abbr,
  normal,
  index,
  brightnessRef,
  spawnDelay,
}: {
  position: THREE.Vector3;
  abbr: string;
  normal: THREE.Vector3;
  index: number;
  brightnessRef: Float32Array;
  spawnDelay: number;
}) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const innerRingRef = useRef<THREE.Mesh>(null!);
  const pulseRingRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const pulsePhase = useRef(0);
  const labelOpacityRef = useRef(0);
  const spawnedRef = useRef(false);
  const spawnStartTime = useRef(0);

  // Orient ring to face outward from globe surface
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(up, normal.clone().normalize());
    return q;
  }, [normal]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const elapsedMs = t * 1000;

    // --- Spawn fade-in animation ---
    if (!spawnedRef.current) {
      if (spawnStartTime.current === 0) {
        spawnStartTime.current = elapsedMs;
      }
      const sinceSpawn = elapsedMs - spawnStartTime.current;
      const fadeDuration = 400;
      const progress = Math.min(Math.max((sinceSpawn - spawnDelay) / fadeDuration, 0), 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const group = groupRef.current;
      if (group) {
        group.scale.setScalar(eased);
      }

      // Also fade the core material
      const coreMat = coreRef.current?.material as THREE.MeshStandardMaterial;
      if (coreMat) {
        coreMat.opacity = eased * 0.9;
      }

      if (progress >= 1) {
        spawnedRef.current = true;
      }
    }

    const brightness = brightnessRef[index];

    // --- Horizontal (azimuthal) camera-facing check ---
    const cam = state.camera;
    const nodeWorldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(nodeWorldPos);
    const nx = nodeWorldPos.x;
    const nz = nodeWorldPos.z;
    const nodeLen = Math.sqrt(nx * nx + nz * nz);
    const cx = cam.position.x;
    const cz = cam.position.z;
    const camLen = Math.sqrt(cx * cx + cz * cz);

    let facingOpacity = 1;
    if (nodeLen < 0.001 || camLen < 0.001) {
      // Node at origin or camera at origin — skip angle check
      facingOpacity = 1;
      if (!groupRef.current.visible) groupRef.current.visible = true;
    } else {
      const hDot = Math.min(Math.max((nx * cx + nz * cz) / (nodeLen * camLen), -1), 1);
      const hAngle = Math.acos(hDot) * (180 / Math.PI);

      if (hAngle < 55) {
        facingOpacity = 1;
        if (!groupRef.current.visible) groupRef.current.visible = true;
      } else if (hAngle < 70) {
        facingOpacity = 1 - (hAngle - 55) / 15;
        if (!groupRef.current.visible) groupRef.current.visible = true;
      } else {
        facingOpacity = 0;
        groupRef.current.visible = false;
      }
    }

    // --- Core dot ---
    const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
    const isActive = brightness > 0.1;
    const targetEmissive = isActive ? 1.5 + brightness * 4 : 0.8;
    coreMat.emissiveIntensity = THREE.MathUtils.lerp(coreMat.emissiveIntensity, targetEmissive, dt * 4);
    coreMat.opacity = spawnedRef.current ? 0.9 * facingOpacity : 0;
    const coreScale = isActive ? 1 + brightness * 0.5 : 1;
    coreRef.current.scale.setScalar(THREE.MathUtils.lerp(coreRef.current.scale.x, coreScale, dt * 5));

    // --- Inner ring + pulse ring ---
    const innerRingMat = innerRingRef.current.material as THREE.MeshBasicMaterial;
    innerRingMat.opacity = 0.5 * facingOpacity;

    // --- Inner ring rotation ---
    innerRingRef.current.rotateZ(dt * 0.8);

    // --- Radar pulse ring ---
    pulsePhase.current += dt * 0.3;
    if (pulsePhase.current > 3) pulsePhase.current = 0;
    const pulseScale = 1 + pulsePhase.current * 0.4;
    pulseRingRef.current.scale.setScalar(pulseScale);
    const pulseRingMat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
    pulseRingMat.opacity = 0.6 * (1 - pulsePhase.current / 3) * facingOpacity;

    // --- Label opacity ---
    // Gentle oscillation + front-facing check
    const camera = state.camera;
    const cameraDir = camera.getWorldDirection(new THREE.Vector3());
    const toLabel = position.clone().sub(camera.position).normalize();
    const facing = -toLabel.dot(cameraDir);
    const frontFacing = Math.max(0, (facing - 0.2) / 0.8);
    const oscillate = 0.5 + 0.5 * Math.sin(t * 0.6 + index * 1.3);
    labelOpacityRef.current = frontFacing * oscillate * 0.55 * facingOpacity;
  });

  // Offset label position along surface normal
  const labelOffset = normal.clone().normalize().multiplyScalar(0.1);
  const labelPos = position.clone().add(labelOffset);

  return (
    <group ref={groupRef}>
      {/* Layer 1 — Core dot */}
      <mesh ref={coreRef} position={position}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial
          color={CORE_COLOR}
          emissive={CORE_COLOR}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 2 — Inner ring */}
      <mesh ref={innerRingRef} position={position} quaternion={quaternion}>
        <ringGeometry args={[0.035, 0.045, 32]} />
        <meshBasicMaterial
          color={RING_COLOR}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 3 — Radar pulse ring */}
      <mesh ref={pulseRingRef} position={position} quaternion={quaternion}>
        <ringGeometry args={[0.018, 0.025, 32]} />
        <meshBasicMaterial
          color={CORE_COLOR}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 4 — Floating label */}
      <group position={labelPos}>
        <LabelOverlay abbr={abbr} opacityRef={labelOpacityRef} />
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   LabelOverlay — Thin HTML label for city abbreviation
   ═══════════════════════════════════════════════ */
function LabelOverlay({
  abbr,
  opacityRef,
}: {
  abbr: string;
  opacityRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      // We control visibility via opacity on the container
      // The Html component reads the ref value
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        distanceFactor={8}
        position={[0, 0, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        zIndexRange={[0, 0]}
      >
        <CityLabel abbr={abbr} opacityRef={opacityRef} />
      </Html>
    </group>
  );
}

// Separate component to use the ref in a reactive way via useFrame
function CityLabel({
  abbr,
  opacityRef,
}: {
  abbr: string;
  opacityRef: React.RefObject<number>;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    if (ref.current && opacityRef.current !== undefined) {
      ref.current.style.opacity = String(opacityRef.current);
    }
  });

  return (
    <span
      ref={ref}
      style={{
        fontSize: '8px',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 0 4px rgba(100,200,255,0.3)',
        transition: 'opacity 0.3s',
      }}
    >
      {abbr}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   FinancialUICard — Holographic data tag floating near a city hub
   ═══════════════════════════════════════════════ */
interface FinancialUICardProps {
  cityPosition: THREE.Vector3;
  title: string;
  children: React.ReactNode;
  index: number;
}

function FinancialUICard({ cityPosition, title, children, index }: FinancialUICardProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const cardRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef(0);

  // Compute card position: offset along surface normal + slight tangent
  const { cardPosition, lineObj } = useMemo(() => {
    const normal = cityPosition.clone().normalize();

    // Compute a tangent vector for offset variety
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
    if (tangent.length() < 0.01) {
      tangent.set(1, 0, 0).crossVectors(normal, up).normalize();
    }
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    // Offset: 0.38 units along normal + small tangent offset for variety
    const tangentOffset = ((index % 3) - 1) * 0.08;
    const bitangentOffset = ((index % 2) === 0 ? 1 : -1) * 0.06;
    const cardPos = normal.clone().multiplyScalar(0.38)
      .add(tangent.clone().multiplyScalar(tangentOffset))
      .add(bitangent.clone().multiplyScalar(bitangentOffset))
      .add(cityPosition);

    // Leader line from city to card
    const lineGeo = new THREE.BufferGeometry().setFromPoints([cityPosition.clone(), cardPos.clone()]);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#6c63ff'),
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(lineGeo, lineMat);

    return { cardPosition: cardPos, lineObj: line };
  }, [cityPosition, index]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const camera = state.camera;

    // Float animation: subtle up/down oscillation (±0.015 units)
    const floatY = Math.sin(t * 0.8 + index * 1.5) * 0.015;

    // Mouse parallax: slight positional offset based on cursor
    const mx = state.pointer.x * 0.02;
    const my = state.pointer.y * 0.02;

    groupRef.current.position.y = cardPosition.y + floatY + my;
    groupRef.current.position.x = cardPosition.x + mx;

    // Camera-facing check: fade out when on back side of globe
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    const toCamera = camera.position.clone().sub(worldPos).normalize();
    const surfaceNormal = worldPos.clone().normalize();
    const facingDot = toCamera.dot(surfaceNormal);

    // If the card is on the back of the globe, reduce opacity
    const targetOpacity = facingDot > 0.1 ? Math.min(1, facingDot * 1.5) : 0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.05);

    if (cardRef.current) {
      cardRef.current.style.opacity = String(Math.max(0, opacityRef.current));
    }

    // Update leader line opacity to match card
    const lineMat = lineObj.material as THREE.LineBasicMaterial;
    lineMat.opacity = 0.15 * Math.max(0, opacityRef.current);
  });

  return (
    <group ref={groupRef} position={[cardPosition.x, cardPosition.y, cardPosition.z]}>
      {/* Leader line from city to card */}
      <primitive object={lineObj} />

      {/* Card HTML overlay */}
      <Html
        distanceFactor={undefined}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'scale(1.05)',
          transformOrigin: 'center',
        }}
        zIndexRange={[0, 0]}
      >
        <div
          ref={cardRef}
          style={{
            minWidth: '130px',
            maxWidth: '170px',
            background: 'rgba(8,10,20,0.82)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 0 15px rgba(108,99,255,0.08)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'geometricPrecision',
            willChange: 'opacity',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
            <div style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'rgba(108,99,255,0.5)',
            }} />
            <span style={{
              fontSize: '7px', color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase', letterSpacing: '0.15em',
              fontWeight: 600, fontFamily: 'monospace',
            }}>
              {title}
            </span>
          </div>
          {children}
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   FinancialRoutingNetwork — Full network component
   ═══════════════════════════════════════════════ */
function FinancialRoutingNetwork({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const scrollScaleRef = useRef(1);

  // Synchronized pulse wave state
  const pulseWaveRef = useRef({ timer: 0, intensity: 0, interval: 15 + Math.random() * 5 });
  // Per-node activity spike state
  const spikeStatesRef = useRef<Float32Array>(new Float32Array(FINANCIAL_HUBS.length));
  const spikeTimersRef = useRef<Float32Array>(Float32Array.from({ length: FINANCIAL_HUBS.length }, () => 8 + Math.random() * 12));

  // Build hub positions and route data once
  const { hubPositions, hubNormals, routes, routeStates, hubBrightnesses, pulseGeometries, lineGeometries } = useMemo(() => {
    const hubPos = FINANCIAL_HUBS.map(h => latLngToVec3(h.lat, h.lng, HUB_RADIUS));
    const hubNorm = hubPos.map(p => p.clone().normalize());

    const routeData: {
      curve: THREE.CatmullRomCurve3;
      hubA: number;
      hubB: number;
      minCooldown: number;
      maxCooldown: number;
    }[] = [];

    for (const def of ROUTE_DEFS) {
      const pA = hubPos[def.from];
      const pB = hubPos[def.to];

      const points: THREE.Vector3[] = [pA.clone()];

      // Great circle interpolation for the arc midpoint
      const dist = pA.distanceTo(pB);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      // Elevate midpoint proportional to distance — hugs globe curvature
      const elevation = HUB_RADIUS + dist * 0.3;
      mid.normalize().multiplyScalar(elevation);
      points.push(mid);

      points.push(pB.clone());

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

      // Random activation timing ranges — organic feel
      const minCD = 3 + Math.random() * 4;   // 3-7s
      const maxCD = 10 + Math.random() * 12;  // 10-22s

      routeData.push({ curve, hubA: def.from, hubB: def.to, minCooldown: minCD, maxCooldown: maxCD });
    }

    // Initialize route states — timers pre-charged so they fire right after startup delay
    const states: RouteAnimState[] = routeData.map((r, i) => {
      const cd = r.minCooldown + Math.random() * (r.maxCooldown - r.minCooldown);
      return {
        state: 'inactive' as RouteState,
        progress: 0,
        brightness: 0.05,
        pulseT: 0,
        cooldown: cd,
        // Pre-charge timers: stagger slightly (0-0.8s) so they don't all fire on the exact same frame
        cooldownTimer: cd + Math.random() * 0.8,
      };
    });

    const hubBright = new Float32Array(FINANCIAL_HUBS.length);

    // Create pulse trail geometries (reusable buffers per route)
    const pulseGeoms = routeData.map(() => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(TRAIL_LENGTH * 3);
      const opac = new Float32Array(TRAIL_LENGTH);
      const sizes = new Float32Array(TRAIL_LENGTH);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aTrailOpacity', new THREE.BufferAttribute(opac, 1));
      geo.setAttribute('aPointSize', new THREE.BufferAttribute(sizes, 1));
      return geo;
    });

    // Create line geometries with per-vertex opacity
    const lineGeoms = routeData.map(route => {
      const geo = new THREE.BufferGeometry();
      const linePos = new Float32Array((CURVE_SEGMENTS + 1) * 3);
      const lineOpacity = new Float32Array(CURVE_SEGMENTS + 1);
      const curvePoints = route.curve.getPoints(CURVE_SEGMENTS);
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const p = curvePoints[i];
        linePos[i * 3] = p.x;
        linePos[i * 3 + 1] = p.y;
        linePos[i * 3 + 2] = p.z;
        const t = i / CURVE_SEGMENTS;
        const endpointFade = Math.min(t * 5, 1) * Math.min((1 - t) * 5, 1);
        lineOpacity[i] = endpointFade;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      geo.setAttribute('aOpacity', new THREE.BufferAttribute(lineOpacity, 1));
      return geo;
    });

    return { hubPositions: hubPos, hubNormals: hubNorm, routes: routeData, routeStates: states, hubBrightnesses: hubBright, pulseGeometries: pulseGeoms, lineGeometries: lineGeoms };
  }, []);

  // Refs for mutable animation state
  const routeStatesRef = useRef<RouteAnimState[]>(routeStates);
  const hubBrightnessesRef = useRef<Float32Array>(hubBrightnesses);

  // Materials (created once)
  const lineMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: routeLineVertexShader,
    fragmentShader: routeLineFragmentShader,
    uniforms: { uColor: { value: ROUTE_COLOR.clone() }, uGlobalBrightness: { value: 1.0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const pulseMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pulseTrailVertexShader,
    fragmentShader: pulseTrailFragmentShader,
    uniforms: { uPulseColor: { value: PULSE_COLOR }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // Create mesh objects
  const { lineMeshes, pulseMeshes } = useMemo(() => {
    const lines = lineGeometries.map(geo => {
      const mat = lineMaterial.clone();
      return new THREE.Line(geo, mat);
    });
    const pulses = pulseGeometries.map(geo => new THREE.Points(geo, pulseMaterial));
    return { lineMeshes: lines, pulseMeshes: pulses };
  }, [lineGeometries, pulseMaterial, lineMaterial]);

  // Startup delay — don't activate routes until 1.5s after mount
  const startupTimeRef = useRef<number | null>(null);
  const TRANSACTION_DELAY = 1.5; // seconds

  // Animation loop
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    // Track when we first start animating
    if (startupTimeRef.current === null) startupTimeRef.current = t;
    const elapsed = t - startupTimeRef.current;
    const routesActive = elapsed >= TRANSACTION_DELAY;

    // Smoothly interpolate scale
    scrollScaleRef.current = THREE.MathUtils.lerp(
      scrollScaleRef.current,
      1,
      0.05
    );

    // Globe rotation — matches HolographicGlobe
    groupRef.current.rotation.y = t * 0.04 + BASE_ROT_Y;
    groupRef.current.rotation.x = 0.15 + Math.sin(t * 0.025) * 0.04;
    groupRef.current.scale.setScalar(scrollScaleRef.current);

    // Reset hub brightnesses
    const hubB = hubBrightnessesRef.current;
    for (let h = 0; h < hubB.length; h++) hubB[h] = 0;

    // --- Synchronized pulse wave ---
    const pw = pulseWaveRef.current;
    pw.timer += dt;
    if (pw.timer >= pw.interval) {
      pw.timer = 0;
      pw.intensity = 1.0;
      pw.interval = 15 + Math.random() * 5;
    }
    if (pw.intensity > 0) {
      pw.intensity = THREE.MathUtils.lerp(pw.intensity, 0, dt * 1.2);
      if (pw.intensity < 0.01) pw.intensity = 0;
    }

    // --- Per-node activity spikes ---
    const spikeStates = spikeStatesRef.current;
    const spikeTimers = spikeTimersRef.current;
    for (let h = 0; h < FINANCIAL_HUBS.length; h++) {
      spikeTimers[h] -= dt;
      if (spikeTimers[h] <= 0 && spikeStates[h] < 0.01) {
        spikeStates[h] = 1.0;
        spikeTimers[h] = 8 + Math.random() * 12;
      }
      if (spikeStates[h] > 0) {
        spikeStates[h] = THREE.MathUtils.lerp(spikeStates[h], 0, dt * 2.5);
        if (spikeStates[h] < 0.01) spikeStates[h] = 0;
      }
      // Add spike intensity to hub brightness
      hubB[h] = Math.max(hubB[h], spikeStates[h] * 0.5);
      // Add pulse wave intensity to all hubs
      hubB[h] = Math.max(hubB[h], pw.intensity * 0.6);
    }

    // Count active routes for throttling
    let activeCount = 0;
    for (let i = 0; i < routes.length; i++) {
      const rs = routeStatesRef.current[i];
      if (rs.state === 'active' || rs.state === 'activating') activeCount++;
    }

    // Update each route
    for (let i = 0; i < routes.length; i++) {
      const rs = routeStatesRef.current[i];
      const route = routes[i];

      switch (rs.state) {
        case 'inactive': {
          rs.cooldownTimer += dt;
          rs.brightness = THREE.MathUtils.lerp(rs.brightness, 0.05, dt * 2);
          // Only activate if startup delay has passed AND under concurrent limit
          if (routesActive && rs.cooldownTimer >= rs.cooldown && activeCount < 5) {
            rs.state = 'activating';
            rs.progress = 0;
            rs.cooldownTimer = 0;
            activeCount++;
          }
          break;
        }
        case 'activating': {
          rs.brightness = THREE.MathUtils.lerp(rs.brightness, 0.3, dt * 3);
          rs.progress += dt * 0.08;
          if (rs.progress > 0.03) {
            rs.state = 'active';
          }
          break;
        }
        case 'active': {
          rs.brightness = 0.3 + Math.sin(t * 2 + i) * 0.05;
          // Controlled data-like velocity with easing
          const speed = 0.12 + Math.sin(rs.progress * Math.PI) * 0.02;
          rs.progress += dt * speed * 3;
          rs.pulseT = easeInOutCubic(Math.min(rs.progress, 1));

          // Hub glow from pulse proximity
          hubB[route.hubA] = Math.max(hubB[route.hubA], (1 - rs.pulseT) * 0.7);
          hubB[route.hubB] = Math.max(hubB[route.hubB], rs.pulseT * 0.7);

          if (rs.progress >= 1) {
            rs.state = 'deactivating';
          }
          break;
        }
        case 'deactivating': {
          rs.brightness = THREE.MathUtils.lerp(rs.brightness, 0.05, dt * 2);
          hubB[route.hubA] = Math.max(hubB[route.hubA], rs.brightness * 0.4);
          hubB[route.hubB] = Math.max(hubB[route.hubB], rs.brightness * 0.4);
          if (rs.brightness < 0.06) {
            rs.state = 'inactive';
            rs.progress = 0;
            rs.pulseT = 0;
            rs.cooldown = route.minCooldown + Math.random() * (route.maxCooldown - route.minCooldown);
            rs.cooldownTimer = 0;
          }
          break;
        }
      }

      // Update line material — color lerps from dormant to active
      const lineMat = lineMeshes[i].material as THREE.ShaderMaterial;
      lineMat.uniforms.uGlobalBrightness.value = rs.brightness;
      // Lerp route color toward purple when active
      const activeMix = Math.min(1, rs.brightness * 3);
      const routeCol = ROUTE_COLOR.clone().lerp(ROUTE_ACTIVE_COLOR, activeMix);
      lineMat.uniforms.uColor.value.copy(routeCol);

      // Update pulse material time
      pulseMaterial.uniforms.uTime.value = t;

      // Update pulse trail geometry
      const pulseGeo = pulseGeometries[i];
      const posAttr = pulseGeo.getAttribute('position') as THREE.BufferAttribute;
      const opacAttr = pulseGeo.getAttribute('aTrailOpacity') as THREE.BufferAttribute;
      const sizeAttr = pulseGeo.getAttribute('aPointSize') as THREE.BufferAttribute;

      const isActive = rs.state === 'active' || rs.state === 'activating';
      const curve = route.curve;

      for (let p = 0; p < TRAIL_LENGTH; p++) {
        const trailOffset = (p / TRAIL_LENGTH) * 0.25;
        const rawT = Math.max(0, rs.pulseT - trailOffset);

        if (isActive && rawT > 0.001) {
          const pt = curve.getPointAt(rawT);
          posAttr.setXYZ(p, pt.x, pt.y, pt.z);

          // Aggressive quadratic tail falloff
          const trailFade = Math.pow(1 - (p / TRAIL_LENGTH), 2.0);
          const leading = p === 0 ? 1.0 : trailFade * 0.55;
          opacAttr.setX(p, leading * Math.min(rs.brightness * 2, 0.8));

          // Compact sizes: leading dot ~1.3x beacon, tail compact
          sizeAttr.setX(p, p === 0 ? 1.3 : 0.8 + (1 - p / TRAIL_LENGTH) * 0.5);
        } else {
          posAttr.setXYZ(p, 0, 0, 0);
          opacAttr.setX(p, 0);
          sizeAttr.setX(p, 0);
        }
      }

      posAttr.needsUpdate = true;
      opacAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      pulseMeshes[i].visible = isActive;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Route lines */}
      {lineMeshes.map((mesh, i) => (
        <primitive key={`route-${i}`} object={mesh} />
      ))}

      {/* Pulse trail points */}
      {pulseMeshes.map((mesh, i) => (
        <primitive key={`pulse-${i}`} object={mesh} />
      ))}

      {/* City beacons with layered design + labels */}
      {hubPositions.map((pos, i) => (
        <CityBeacon
          key={`beacon-${i}`}
          position={pos}
          abbr={FINANCIAL_HUBS[i].abbr}
          normal={hubNormals[i]}
          index={i}
          brightnessRef={hubBrightnessesRef.current}
          spawnDelay={FINANCIAL_HUBS[i].spawnDelay}
        />
      ))}

      {/* Financial UI cards — holographic data tags */}
      <FinancialUICard cityPosition={hubPositions[6]} title="FX CONVERSION" index={0}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>EUR → USD</p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontFamily: 'monospace' }}>1.0847</p>
        <p style={{ fontSize: '8px', color: 'rgba(52,211,153,0.7)', fontWeight: 500 }}>+0.12%</p>
      </FinancialUICard>

      <FinancialUICard cityPosition={hubPositions[19]} title="STABLECOIN SETTLEMENT" index={1}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: 'monospace' }}>TRC-20</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>USDT</span>
        </div>
        <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>Est. ~3 min</p>
      </FinancialUICard>

      <FinancialUICard cityPosition={hubPositions[0]} title="TREASURY ROUTING" index={2}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontFamily: 'monospace' }}>$12.4M</p>
        <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>Awaiting Confirmation</p>
      </FinancialUICard>

      <FinancialUICard cityPosition={hubPositions[13]} title="CROSS-BORDER LIQUIDITY" index={3}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Pool:</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontFamily: 'monospace' }}>$8.2M</p>
        </div>
        <p style={{ fontSize: '8px', color: 'rgba(108,99,255,0.7)', fontWeight: 500, marginTop: '1px' }}>APY 4.8%</p>
      </FinancialUICard>

      <FinancialUICard cityPosition={hubPositions[18]} title="INSTITUTIONAL TRANSFER" index={4}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontFamily: 'monospace' }}>$48.2M</p>
        <p style={{ fontSize: '8px', color: 'rgba(52,211,153,0.6)', fontWeight: 500, marginTop: '1px' }}>+12.4% vs avg</p>
      </FinancialUICard>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   FLOATING UI PANELS — Fintech fragments
   ═══════════════════════════════════════════════ */
function FloatingPanel({
  position,
  rotation,
  children,
  floatSpeed = 1,
  floatIntensity = 0.3,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  floatSpeed?: number;
  floatIntensity?: number;
}) {
  return (
    <Float speed={floatSpeed} rotationIntensity={0.1} floatIntensity={floatIntensity}>
      <group position={position} rotation={rotation || [0, 0, 0]}>
        <HtmlContent>{children}</HtmlContent>
      </group>
    </Float>
  );
}

function HtmlContent({ children }: { children: React.ReactNode }) {
  return (
    <mesh>
      <planeGeometry args={[0.01, 0.01]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

/* ─── Cursor Tracker ─── */
function CursorTracker() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 5));

  useFrame((state) => {
    const px = (state.pointer.x * Math.PI) / 14;
    const py = (state.pointer.y * Math.PI) / 14;
    target.current.set(px, py, 5);
    camera.position.lerp(target.current, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ═══════════════════════════════════════════════
   VOLUMETRIC HAZE — Soft radial glow behind globe
   ═══════════════════════════════════════════════ */
function VolumetricHaze() {
  const spriteRef = useRef<THREE.Sprite>(null!);

  const hazeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(100, 140, 200, 0.08)');
    gradient.addColorStop(0.3, 'rgba(80, 120, 180, 0.05)');
    gradient.addColorStop(0.6, 'rgba(60, 100, 160, 0.02)');
    gradient.addColorStop(1, 'rgba(40, 80, 140, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(() => {
    // Haze stays behind the globe, slight pulse
    const scale = 5.5 + Math.sin(Date.now() * 0.0003) * 0.15;
    spriteRef.current.scale.set(scale, scale, 1);
  });

  return (
    <sprite ref={spriteRef} renderOrder={-10}>
      <spriteMaterial
        map={hazeTexture}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════
   ATMOSPHERIC PARTICLES — Floating dust/ice crystals
   ═══════════════════════════════════════════════ */
function AtmosphericParticles({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const PARTICLE_COUNT = 40;

  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random position on shell between radius 1.6-1.9
      const radius = 1.6 + Math.random() * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Slow orbital velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, phases: ph };
  }, []);

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color("#aaccff"),
      size: 0.006,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Slow brownian drift + orbital motion
      posAttr.array[idx] += Math.sin(t * 0.1 + phases[i]) * 0.0003 + velocities[idx] * 0.016;
      posAttr.array[idx + 1] += Math.cos(t * 0.08 + phases[i] * 1.3) * 0.0002 + velocities[idx + 1] * 0.016;
      posAttr.array[idx + 2] += Math.sin(t * 0.12 + phases[i] * 0.7) * 0.0003 + velocities[idx + 2] * 0.016;

      // Keep particles on shell (radius 1.6-1.9)
      const x = posAttr.array[idx];
      const y = posAttr.array[idx + 1];
      const z = posAttr.array[idx + 2];
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > 1.9 || r < 1.6) {
        const targetR = 1.6 + Math.random() * 0.3;
        const scale = targetR / Math.max(r, 0.001);
        posAttr.array[idx] *= scale;
        posAttr.array[idx + 1] *= scale;
        posAttr.array[idx + 2] *= scale;
      }
    }
    posAttr.needsUpdate = true;

    // Match globe rotation
    pointsRef.current.rotation.y = t * 0.04 + BASE_ROT_Y;
    pointsRef.current.rotation.x = 0.15 + Math.sin(t * 0.025) * 0.04;

    // Subtle opacity pulse
    particleMaterial.opacity = 0.15 + Math.sin(t * 0.3) * 0.05;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={particleMaterial} renderOrder={7} />
  );
}

/* ═══════════════════════════════════════════════
   SATELLITE STREAKS — Orbiting thin lines with trails
   ═══════════════════════════════════════════════ */
const SATELLITE_COUNT = 4;

interface SatelliteData {
  radius: number;
  inclination: number;
  phase: number;
  speed: number;
  fadeCycle: number;
  fadeOffset: number;
}

function SatelliteStreaks() {
  const groupRef = useRef<THREE.Group>(null!);

  const satelliteData = useMemo<SatelliteData[]>(() => [
    { radius: 1.8, inclination: 0.4, phase: 0, speed: 0.031, fadeCycle: 25, fadeOffset: 0 },
    { radius: 2.0, inclination: 1.1, phase: 2.1, speed: 0.025, fadeCycle: 35, fadeOffset: 10 },
    { radius: 1.9, inclination: 0.7, phase: 4.2, speed: 0.04, fadeCycle: 20, fadeOffset: 5 },
    { radius: 2.2, inclination: 1.5, phase: 1.0, speed: 0.02, fadeCycle: 30, fadeOffset: 15 },
  ], []);

  const { lineGeometries, lineMaterials, lines } = useMemo(() => {
    const TRAIL_POINTS = 30;
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.LineBasicMaterial[] = [];
    const lns: THREE.Line[] = [];

    for (let s = 0; s < SATELLITE_COUNT; s++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(TRAIL_POINTS * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color("#aaccff"),
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geo, mat);
      geos.push(geo);
      mats.push(mat);
      lns.push(line);
    }

    return { lineGeometries: geos, lineMaterials: mats, lines: lns };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    for (let s = 0; s < SATELLITE_COUNT; s++) {
      const sd = satelliteData[s];
      const TRAIL_POINTS = 30;

      // Calculate satellite position
      const angle = t * sd.speed + sd.phase;
      const x = sd.radius * Math.cos(angle) * Math.cos(sd.inclination);
      const y = sd.radius * Math.sin(angle);
      const z = sd.radius * Math.cos(angle) * Math.sin(sd.inclination);

      // Fade in/out periodically
      const fadeCycle = sd.fadeCycle;
      const fadeT = ((t + sd.fadeOffset) % fadeCycle) / fadeCycle;
      const opacity = fadeT < 0.3 ? fadeT / 0.3 : fadeT > 0.7 ? (1 - fadeT) / 0.3 : 1.0;
      lineMaterials[s].opacity = opacity * 0.2;
      lines[s].visible = opacity > 0.05;

      // Update trail positions
      const posAttr = lineGeometries[s].getAttribute('position') as THREE.BufferAttribute;
      for (let p = 0; p < TRAIL_POINTS; p++) {
        const trailAngle = angle - p * 0.015; // short trail behind
        const px = sd.radius * Math.cos(trailAngle) * Math.cos(sd.inclination);
        const py = sd.radius * Math.sin(trailAngle);
        const pz = sd.radius * Math.cos(trailAngle) * Math.sin(sd.inclination);
        posAttr.setXYZ(p, px, py, pz);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} renderOrder={8}>
      {lines.map((line, i) => (
        <primitive key={`sat-${i}`} object={line} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   AURORA EFFECT — Subtle gradients near poles
   ═══════════════════════════════════════════════ */
const auroraVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auroraFragmentShader = /* glsl */ `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPos;

  void main() {
    // Polar mask — only visible near poles (within ~20°)
    float polarAngle = abs(vLocalPos.y) / 2.1; // normalized to ~1 at poles
    float polarMask = smoothstep(0.6, 1.0, polarAngle);

    // Fresnel — stronger at edges
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    // Shifting aurora color
    vec3 auroraColor = vec3(0.1, 0.8, 0.4) * (0.7 + 0.3 * sin(uTime * 0.1 + vLocalPos.x * 3.0));
    auroraColor += vec3(0.0, 0.3, 0.6) * sin(uTime * 0.07 + vLocalPos.z * 2.5) * 0.3;

    float alpha = polarMask * fresnel * 0.04; // extremely subtle
    alpha *= (0.8 + 0.2 * sin(uTime * 0.15 + vLocalPos.z * 2.0));

    gl_FragColor = vec4(auroraColor, alpha);
  }
`;

function AuroraEffect({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const auroraUniforms = useRef({
    uTime: { value: 0 },
  });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    auroraUniforms.current.uTime.value = t;

    meshRef.current.rotation.y = t * 0.04 + BASE_ROT_Y;
    meshRef.current.rotation.x = 0.15 + Math.sin(t * 0.025) * 0.04;
  });

  return (
    <mesh ref={meshRef} renderOrder={9}>
      <sphereGeometry args={[1.9, 48, 48]} />
      <shaderMaterial
        vertexShader={auroraVertexShader}
        fragmentShader={auroraFragmentShader}
        uniforms={auroraUniforms.current}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════ */
function HeroScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  return (
    <>
      {/* Lighting — Sun + ambient for realistic Earth */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      {/* Accent fills — keep subtle color fills for orbit rings and UI cards */}
      <pointLight position={[0, 5, -4]} intensity={0.4} color="#8b5cf6" distance={10} />
      <pointLight position={[3, -5, 2]} intensity={0.3} color="#06b6d4" distance={8} />

      {/* Globe centerpiece */}
      <Suspense fallback={null}>
        <HolographicGlobe scrollProgress={scrollProgress} />
      </Suspense>

      {/* Volumetric haze — soft glow behind globe */}
      <VolumetricHaze />

      {/* Floating atmospheric particles */}
      <AtmosphericParticles scrollProgress={scrollProgress} />

      {/* Satellite streaks */}
      <SatelliteStreaks />

      {/* Aurora gradients near poles */}
      <AuroraEffect scrollProgress={scrollProgress} />

      {/* Financial routing network — replaces old nodes, paths, particles, orbs */}
      <FinancialRoutingNetwork scrollProgress={scrollProgress} />

      {/* <OrbitRings /> */}

      <CursorTracker />
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED CANVAS
   ═══════════════════════════════════════════════ */
export default function HeroCanvas({ scrollProgress = 0 }: { scrollProgress?: number } = {}) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: "transparent" }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <HeroScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
