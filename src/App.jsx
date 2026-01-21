import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Text } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ============================================================================
 * UTILITIES & MATH HELPER
 * ============================================================================
 */

const randomRange = (min, max) => Math.random() * (max - min) + min;

/**
 * ============================================================================
 * SHADERS (The Magic)
 * ============================================================================
 */

const particleVertexShader = `
  uniform float uTime;
  uniform float uMouseX;
  uniform float uMouseY;
  attribute float aScale;
  attribute vec3 aRandomness;
  
  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    
    // Base position
    vec3 pos = position;
    
    // Organic movement based on time and randomness
    float time = uTime * 0.5;
    pos.x += sin(time * aRandomness.x) * 0.2;
    pos.y += cos(time * aRandomness.y) * 0.2;
    pos.z += sin(time * aRandomness.z) * 0.2;

    // Mouse interaction (Repulsion effect)
    float dist = distance(vec2(pos.x, pos.y), vec2(uMouseX, uMouseY));
    float force = max(0.0, 5.0 - dist); // Radius of influence
    vec3 dir = normalize(vec3(pos.x - uMouseX, pos.y - uMouseY, pos.z));
    pos += dir * force * 0.5;

    // Instance positioning
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    
    // Size attenuation based on depth
    gl_PointSize = (30.0 * aScale) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Dynamic Color based on position and speed
    vColor = vec3(0.1, 0.5, 1.0) + pos.z * 0.1; 
  }
`;

/**
 * ============================================================================
 * 3D COMPONENTS
 * ============================================================================
 */

const QuantumField = ({ count = 3000 }) => {
  const meshRef = useRef(null);
  const { viewport, mouse } = useThree();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouseX: { value: 0 },
    uMouseY: { value: 0 }
  }), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const x = randomRange(-50, 50);
      const y = randomRange(-50, 50);
      const z = randomRange(-50, 50);

      temp.push({ t, factor, speed, x, y, z, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uMouseX.value = THREE.MathUtils.lerp(uniforms.uMouseX.value, mouse.x * viewport.width / 2, 0.1);
    uniforms.uMouseY.value = THREE.MathUtils.lerp(uniforms.uMouseY.value, mouse.y * viewport.height / 2, 0.1);

    particles.forEach((particle, i) => {
      let { t, factor, speed, x, y, z } = particle;
      
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);

      particle.mx += (mouse.x * viewport.width - particle.mx) * 0.01;
      particle.my += (mouse.y * viewport.height - particle.my) * 0.01;

      dummy.position.set(
        (particle.x + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10),
        (particle.y + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10),
        (particle.z + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10)
      );
      
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial 
        color="#00f3ff"
        emissive="#ff00aa"
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.9}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
};

const HeroText = () => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Text
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        fontSize={4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0]}
        maxWidth={20}
        textAlign="center"
      >
        THE FUTURE
        <meshStandardMaterial 
            color="white" 
            emissive="#00f3ff" 
            emissiveIntensity={0.2} 
            toneMapped={false} 
        />
      </Text>
    </Float>
  );
};

const SceneEffects = () => {
  return (
    <EffectComposer disableNormalPass>
      <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
      <ChromaticAberration 
        blendFunction={BlendFunction.NORMAL} 
        offset={[0.002, 0.002]} 
      />
    </EffectComposer>
  );
};

/**
 * ============================================================================
 * UI COMPONENTS
 * ============================================================================
 */

const Overlay = () => {
  return (
    <main style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem',
      boxSizing: 'border-box',
      zIndex: 10
    }}>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ 
          color: '#fff', 
          fontFamily: "'Inter', sans-serif", 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          letterSpacing: '-0.05em' 
        }}>
          NEXUS<span style={{ color: '#00f3ff' }}>.AI</span>
        </h1>
        <nav style={{ pointerEvents: 'auto' }}>
          <button style={buttonStyle}>Connect</button>
        </nav>
      </motion.header>

      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          SYSTEM STATUS: <span style={{ color: '#00ff00' }}>ONLINE</span><br/>
          RENDER: WEBGL 2.0<br/>
          FPS: 60
        </div>
        
        <div style={{ pointerEvents: 'auto' }}>
           <GlassCard title="Neural Link" value="98%" />
        </div>
      </motion.footer>
    </main>
  );
};

const GlassCard = ({ title, value }) => (
  <motion.div
    whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '1.5rem',
      width: '200px',
      cursor: 'pointer'
    }}
  >
    <h3 style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>{title}</h3>
    <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{value}</div>
    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '1rem', borderRadius: '2px' }}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: value }}
        transition={{ duration: 2, delay: 1 }}
        style={{ height: '100%', background: '#00f3ff', borderRadius: '2px' }} 
      />
    </div>
  </motion.div>
);

const buttonStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  padding: '10px 24px',
  borderRadius: '30px',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.9rem',
  transition: 'all 0.3s ease'
};

/**
 * ============================================================================
 * MAIN APPLICATION
 * ============================================================================
 */

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 30], fov: 45 }}
        gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      >
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00aa" />
        
        <Environment preset="city" />

        <Suspense fallback={null}>
          <group>
             <QuantumField count={4000} />
             <HeroText />
          </group>
        </Suspense>

        <SceneEffects />

        <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.5} 
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      <Overlay />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        ::selection { background: #00f3ff; color: #000; }
      `}</style>
    </div>
  );
}
