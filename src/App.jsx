import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Float, 
  MeshDistortMaterial, 
  Sparkles,
  Text,
  useTexture,
  MeshTransmissionMaterial
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  Noise, 
  Vignette,
  Glitch
} from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';

/**
 * ============================================================================
 * THE CORE: LIQUID METAL ARTIFACT
 * ============================================================================
 */
const LiquidCore = ({ active }) => {
  const meshRef = useRef(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Rotate the core
      meshRef.current.rotation.x = Math.sin(t / 2);
      meshRef.current.rotation.y = Math.cos(t / 2);
    }
  });

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} scale={active ? 1.5 : 1}>
        <sphereGeometry args={[1.5, 64, 64]} />
        {/* 
           MeshDistortMaterial creates the "Liquid" effect.
           It displaces vertices based on noise in real-time.
        */}
        <MeshDistortMaterial 
          color={active ? "#ff0055" : "#000000"} 
          envMapIntensity={1} 
          clearcoat={1} 
          clearcoatRoughness={0} 
          metalness={0.9} 
          roughness={0.1}
          distort={0.6} // Strength of the liquid movement
          speed={active ? 4 : 2} // Speed of the flow
        />
      </mesh>
    </Float>
  );
};

/**
 * ============================================================================
 * THE RING: GLASS TRANSMISSION
 * ============================================================================
 */
const GlassRing = () => {
  const ref = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.2;
    ref.current.rotation.z = t * 0.1;
  });

  return (
    <mesh ref={ref} scale={3}>
      <torusGeometry args={[1, 0.02, 16, 100]} />
      <meshStandardMaterial 
        emissive="#ffffff"
        emissiveIntensity={2}
        toneMapped={false}
        color="white"
      />
    </mesh>
  );
};

/**
 * ============================================================================
 * BACKGROUND GRID (RETRO-FUTURISM)
 * ============================================================================
 */
const GridFloor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshStandardMaterial 
        color="#050505" 
        wireframe 
        transparent 
        opacity={0.1} 
      />
    </mesh>
  );
};

/**
 * ============================================================================
 * POST PROCESSING & LIGHTING
 * ============================================================================
 */
const SceneEffects = ({ active }) => {
  return (
    <EffectComposer disableNormalPass>
      {/* Intense Bloom for the "Neon" look */}
      <Bloom 
        luminanceThreshold={0.1} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.5} 
      />
      
      {/* Chromatic Aberration splits colors at edges (Lens effect) */}
      <ChromaticAberration 
        offset={[0.002, 0.002]} // Static offset
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* Noise makes it look like film, not plastic */}
      <Noise opacity={0.1} />
      
      {/* Cinematic darkening of corners */}
      <Vignette eskil={false} offset={0.1} darkness={1.1} />

      {/* GLITCH EFFECT - Triggers when user clicks */}
      <Glitch 
        delay={[0.5, 1.0]} 
        duration={[0.1, 0.3]} 
        strength={[0.2, 0.4]} 
        mode={GlitchMode.CONSTANT_MILD} 
        active={active} 
        ratio={0.85} 
      />
    </EffectComposer>
  );
};

/**
 * ============================================================================
 * UI OVERLAY
 * ============================================================================
 */
const Overlay = ({ active, setActive }) => {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: 10
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{
          fontSize: '5rem', fontWeight: '900', color: '#fff', margin: 0,
          letterSpacing: '-0.05em', lineHeight: 0.9, mixBlendMode: 'difference'
        }}>
          HYPER<br/>REALITY
        </h1>
        <p style={{ color: '#aaa', fontFamily: 'monospace', marginTop: '1rem' }}>
          INTERACTIVE LIQUID ENGINE
        </p>
        
        <button 
          onClick={() => setActive(!active)}
          style={{
            pointerEvents: 'auto',
            marginTop: '2rem',
            background: active ? '#ff0055' : '#fff',
            color: active ? '#fff' : '#000',
            border: 'none',
            padding: '1rem 3rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)',
            transition: 'all 0.2s'
          }}
        >
          {active ? "STABILIZE SYSTEM" : "INITIATE BREACH"}
        </button>
      </motion.div>
    </div>
  );
};

/**
 * ============================================================================
 * MAIN APP
 * ============================================================================
 */
export default function App() {
  const [active, setActive] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        
        {/* Dynamic Lighting */}
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} color="#00f3ff" />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={10} color="#ff0055" />

        {/* The Environment reflects on the liquid metal */}
        <Environment preset="warehouse" />

        {/* 3D Content */}
        <group>
          <LiquidCore active={active} />
          <GlassRing />
          <GridFloor />
          
          {/* Floating particles around the core */}
          <Sparkles 
            count={200} 
            scale={12} 
            size={4} 
            speed={0.4} 
            opacity={0.5} 
            color={active ? "#ff0055" : "#00f3ff"} 
          />
        </group>

        {/* Post Processing Pipeline */}
        <SceneEffects active={active} />

        {/* Camera Movement */}
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={active ? 5 : 0.5} 
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      <Overlay active={active} setActive={setActive} />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}
