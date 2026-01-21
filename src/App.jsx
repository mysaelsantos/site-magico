import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useScroll, 
  ScrollControls, 
  Scroll, 
  Environment, 
  Float, 
  PerspectiveCamera,
  Stars,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * ============================================================================
 * CONFIGURAÇÃO E DADOS
 * ============================================================================
 */
const THEME = {
  primary: '#00f3ff',
  secondary: '#ff0055',
  bg: '#050505'
};

/**
 * ============================================================================
 * COMPONENTES 3D COMPLEXOS
 * ============================================================================
 */

// Gera uma "peça" mecânica aleatória para compor o motor
const TechPart = ({ index, z }) => {
  const ref = useRef();
  const scroll = useScroll();
  
  // Aleatoriedade determinística baseada no index
  const random = (seed) => Math.sin(seed * 123.45) * 0.5 + 0.5;
  
  const initialPos = useMemo(() => {
    const angle = (index / 10) * Math.PI * 2;
    const radius = 1 + random(index) * 2;
    return [
      Math.cos(angle) * radius, 
      Math.sin(angle) * radius, 
      z
    ];
  }, [index, z]);

  useFrame((state, delta) => {
    // A MÁGICA DO SCROLL:
    // r1 é um valor de 0 a 1 baseado na posição do scroll
    const r1 = scroll.range(0, 1); 
    const r2 = scroll.range(0.2, 0.5); // Fase de explosão
    
    if (ref.current) {
      // 1. Rotação constante + Aceleração com scroll
      ref.current.rotation.z += delta * 0.2 + r1 * 0.5;
      ref.current.rotation.x += delta * 0.1;

      // 2. Efeito "Exploded View" (As peças se afastam do centro)
      const explosionFactor = r2 * 5; 
      ref.current.position.x = initialPos[0] * (1 + explosionFactor);
      ref.current.position.y = initialPos[1] * (1 + explosionFactor);
      ref.current.position.z = initialPos[2] + scroll.scroll.current * 5; // Avança em direção à câmera
    }
  });

  // Geometria aleatória (Caixa ou Toro)
  const isRing = index % 3 === 0;

  return (
    <mesh ref={ref} position={initialPos}>
      {isRing ? (
        <torusGeometry args={[random(index) * 0.5, 0.05, 16, 32]} />
      ) : (
        <boxGeometry args={[random(index), random(index), random(index)]} />
      )}
      <meshStandardMaterial 
        color={index % 2 === 0 ? THEME.primary : '#ffffff'}
        emissive={index % 2 === 0 ? THEME.primary : '#000'}
        emissiveIntensity={index % 2 === 0 ? 2 : 0}
        roughness={0.2}
        metalness={1}
        wireframe={index % 5 === 0} // Algumas peças em wireframe para estilo técnico
      />
    </mesh>
  );
};

// O Motor Principal
const HyperEngine = () => {
  // Cria 50 peças
  const parts = useMemo(() => new Array(50).fill(0).map((_, i) => i), []);

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {parts.map((i) => (
        <TechPart key={i} index={i} z={(i - 25) / 5} />
      ))}
      {/* Núcleo Central */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={THEME.secondary} 
          emissive={THEME.secondary}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={THEME.secondary} intensity={10} distance={10} />
    </group>
  );
};

// Controlador da Câmera e Luzes baseado no Scroll
const SceneDirector = () => {
  const scroll = useScroll();
  const { camera } = useThree();
  const lightRef = useRef();

  useFrame((state) => {
    const offset = scroll.offset; // 0 (topo) a 1 (fundo)

    // Movimento de Câmera Cinematográfico
    // A câmera começa longe e vai entrando no motor
    camera.position.z = 15 - offset * 10;
    camera.position.x = Math.sin(offset * Math.PI) * 2;
    camera.lookAt(0, 0, 0);

    // Luzes piscando com a velocidade
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.random() * offset * 5;
      lightRef.current.position.z = camera.position.z - 2;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color="white" distance={5} />
    </group>
  );
};

/**
 * ============================================================================
 * INTERFACE HTML (OVERLAY)
 * ============================================================================
 */
const HtmlContent = () => {
  return (
    <Scroll html style={{ width: '100%', color: 'white' }}>
      
      {/* SEÇÃO 1: HERO */}
      <section style={{ ...sectionStyle, alignItems: 'flex-start' }}>
        <div style={textContainerStyle}>
          <h1 style={h1Style}>HYPER<br/>DRIVE</h1>
          <p style={pStyle}>A próxima geração de propulsão web.</p>
          <div style={scrollIndicatorStyle}>ROLE PARA INICIAR ↓</div>
        </div>
      </section>

      {/* SEÇÃO 2: EXPLODED VIEW */}
      <section style={{ ...sectionStyle, alignItems: 'flex-end' }}>
        <div style={{ ...textContainerStyle, textAlign: 'right' }}>
          <h2 style={h2Style}>ENGENHARIA<br/>DE PRECISÃO</h2>
          <p style={pStyle}>
            Cada componente renderizado em tempo real.<br/>
            Sem vídeos. Sem imagens estáticas.<br/>
            Pura matemática.
          </p>
        </div>
      </section>

      {/* SEÇÃO 3: VELOCIDADE */}
      <section style={{ ...sectionStyle, justifyContent: 'center' }}>
        <div style={{ ...textContainerStyle, textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '40px', backdropFilter: 'blur(10px)', border: '1px solid #333' }}>
          <h2 style={{ ...h2Style, color: THEME.secondary }}>VELOCIDADE DA LUZ</h2>
          <p style={pStyle}>O futuro da web é imersivo.</p>
          <button style={buttonStyle}>ACESSAR SISTEMA</button>
        </div>
      </section>

    </Scroll>
  );
};

/**
 * ============================================================================
 * APP PRINCIPAL
 * ============================================================================
 */
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas gl={{ antialias: false }}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <color attach="background" args={[THEME.bg]} />
        
        {/* Iluminação Ambiente */}
        <ambientLight intensity={0.2} />
        <Environment preset="city" />
        
        {/* Partículas de fundo (Estrelas) */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* CONTROLE DE SCROLL: O coração da página */}
        <ScrollControls pages={3} damping={0.2}>
          
          {/* Camada 3D */}
          <group>
            <SceneDirector />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <HyperEngine />
            </Float>
            <Sparkles count={100} scale={10} size={5} speed={0.4} opacity={0.5} color={THEME.primary} />
          </group>

          {/* Camada HTML */}
          <HtmlContent />
          
        </ScrollControls>

        {/* Pós-processamento */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

      </Canvas>
      
      {/* Estilos Globais */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap');
        body { margin: 0; font-family: 'Rajdhani', sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}

/**
 * ============================================================================
 * ESTILOS CSS-IN-JS
 * ============================================================================
 */
const sectionStyle = {
  height: '100vh',
  width: '100vw',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '10vw',
  boxSizing: 'border-box'
};

const textContainerStyle = {
  zIndex: 10,
  maxWidth: '600px'
};

const h1Style = {
  fontSize: '8rem',
  lineHeight: '0.8',
  margin: 0,
  fontWeight: '700',
  letterSpacing: '-0.02em',
  color: '#fff'
};

const h2Style = {
  fontSize: '4rem',
  margin: '0 0 20px 0',
  fontWeight: '700',
  color: '#fff'
};

const pStyle = {
  fontSize: '1.5rem',
  color: '#aaa',
  margin: '20px 0'
};

const scrollIndicatorStyle = {
  marginTop: '50px',
  fontSize: '1rem',
  letterSpacing: '0.2em',
  color: THEME.primary,
  animation: 'pulse 2s infinite'
};

const buttonStyle = {
  padding: '15px 40px',
  fontSize: '1.2rem',
  background: THEME.secondary,
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 'bold',
  marginTop: '20px',
  clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)',
  transition: 'transform 0.2s'
};
