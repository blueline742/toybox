// MagicalBackground.jsx
import React, { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/**
 * MagicalBackground
 *
 * Drop this inside your <Canvas> alongside your board/toys.
 * It intentionally uses very few draw calls:
 *  - 1 big dome mesh (BackSide shader)
 *  - 1 points mesh for sparkles (single buffer attribute)
 *  - 1 big glow sphere (basic material)
 *  - 1 cone mesh for god rays (shader)
 *
 * All animated via `useFrame` (no extra timers).
 */
export default function MagicalBackground({
  // tunable props (good defaults)
  sparkleCount = 400,
  sparkleSize = 0.18,
  domeScale = 100,
  glowSphereRadius = 60,
  godRayColor = "#ffd6ff",
  godRaySpeed = 0.6,
  godRayIntensity = 0.45,
}) {
  // ---- Sparkles: pre-generate positions once ----
  const sparklesRef = useRef(null)
  const positions = useMemo(() => {
    // Float32Array is GPU-friendly and kept stable across renders
    const arr = new Float32Array(sparkleCount * 3)
    for (let i = 0; i < sparkleCount; i++) {
      // Spread them in a box around the table
      arr[i * 3 + 0] = (Math.random() - 0.5) * 40 // x
      arr[i * 3 + 1] = (Math.random() - 0.1) * 25 // y (slightly biased upward)
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40 // z
    }
    return arr
  }, [sparkleCount])

  // ---- God ray material & mesh refs for animation ----
  const godRayMatRef = useRef(null)
  const godRayMeshRef = useRef(null)

  // ---- Animate every frame ----
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // slow rotation for sparkles and rays -> gives continuous motion
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y = t * 0.05
      sparklesRef.current.rotation.x = Math.sin(t * 0.18) * 0.03
    }
    if (godRayMatRef.current) {
      godRayMatRef.current.uniforms.time.value = t * godRaySpeed
    }
    if (godRayMeshRef.current) {
      // rotate cone slowly so rays sweep around the table
      godRayMeshRef.current.rotation.y = t * 0.14
    }
  })

  return (
    <group>
      {/* -----------------------------
          1) Gradient Dome (pastel playroom)
         ----------------------------- */}
      <mesh scale={[domeScale, domeScale, domeScale]} renderOrder={-10}>
        <sphereGeometry args={[1, 28, 28]} />
        {/* shaderMaterial is lightweight and keeps color math on GPU */}
        <shaderMaterial
          side={THREE.BackSide}
          uniforms={{
            colorTop: { value: new THREE.Color("#ffecd2") },   // warm cream
            colorMiddle: { value: new THREE.Color("#fcb69f") },// pink glow
            colorBottom: { value: new THREE.Color("#c2e9fb") } // baby blue
          }}
          vertexShader={`
            varying vec3 vPos;
            void main() {
              // normalized position used for gradient calculation
              vPos = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 colorTop;
            uniform vec3 colorMiddle;
            uniform vec3 colorBottom;
            varying vec3 vPos;
            void main() {
              // vertical gradient (top-to-bottom)
              float h = vPos.y * 0.5 + 0.5; // -1..1 -> 0..1
              vec3 col = mix(colorBottom, colorTop, smoothstep(0.0, 1.0, h));
              // subtle side tint using x coordinate (adds variety left/right)
              float side = smoothstep(-0.6, 0.6, vPos.x);
              col = mix(col, colorMiddle, side * 0.2);
              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>

      {/* -----------------------------
          2) Sparkles / magic dust (GPU-friendly points)
         ----------------------------- */}
      <points ref={sparklesRef} frustumCulled={true} renderOrder={-5}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>

        {/*
          pointsMaterial is very cheap (one draw call).
          sizeAttenuation = true makes sparks scale by distance (fresher look).
        */}
        <pointsMaterial
          size={sparkleSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color={"#ffffff"}
        />
      </points>

      {/* -----------------------------
          3) Soft ambient glow (very cheap mesh)
         ----------------------------- */}
      <mesh renderOrder={-2}>
        <sphereGeometry args={[glowSphereRadius, 20, 20]} />
        <meshBasicMaterial
          color={"#fff0f5"}
          transparent
          opacity={0.12}
          depthWrite={false} // don't obscure toys
          side={THREE.BackSide}
        />
      </mesh>

      {/* -----------------------------
          4) Fake God Rays (cone + shader)
          - openEnded cone (so it doesn't create a flat top)
          - additive + depthWrite=false prevents occlusion of toys
          - fragment shader creates animated vertical streaks and fade
         ----------------------------- */}
      <mesh
        ref={godRayMeshRef}
        position={[0, 10, 0]} // centered above table at [0,0,0]
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-1}
      >
        {/* radius, height, radial segments, height segments, openEnded */}
        <coneGeometry args={[7, 20, 64, 1, true]} />
        <shaderMaterial
          ref={godRayMatRef}
          transparent={true}
          depthWrite={false} // do not write depth so it doesn't block scene
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 },
            color: { value: new THREE.Color(godRayColor) },
            intensity: { value: godRayIntensity }
          }}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
              vUv = uv;      // uv.y = along cone height from base -> tip
              vPos = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform vec3 color;
            uniform float intensity;
            varying vec2 vUv;
            varying vec3 vPos;

            // small helper: pseudo-random
            float hash(float n) { return fract(sin(n)*43758.5453123); }

            void main() {
              // vUv.x cycles around cone circumference (0..1),
              // vUv.y is height (0..1) from base -> tip.
              // Create vertical rays using vUv.x for circular/radial streaks
              float frequency = 40.0; // number of rays
              float speed = 2.0;

              // Use vUv.x directly for vertical rays radiating from center
              float rays = sin((vUv.x * frequency) + time * speed);

              // convert rays into 0..1 and sharpen for defined light shafts
              rays = smoothstep(0.4, 0.95, rays * 0.5 + 0.5);

              // fade with height: stronger near top (where light originates),
              // weaker near the bottom (dissipates toward table)
              float heightFade = pow(1.0 - vUv.y, 1.8); // 1 near base -> 0 near tip

              // final alpha and color
              float alpha = rays * heightFade * intensity;
              vec3 finalColor = color * rays * (0.7 + 0.3 * heightFade);

              // very subtle noise to avoid perfectly banded look
              float n = (hash(vUv.x * 15.0 + time * 0.3) - 0.5) * 0.04;
              alpha = alpha + n;

              gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.85));
            }
          `}
        />
      </mesh>
    </group>
  )
}