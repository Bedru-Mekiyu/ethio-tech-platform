import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text, Stars } from "@react-three/drei";
import type { Group, Mesh } from "three";
import * as THREE from "three";

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function FloatingCubes() {
  const cubes = useMemo(() => {
    const items: { pos: [number, number, number]; color: string; size: number; speed: number }[] = [];
    const colors = ["#00d2ff", "#7b61ff", "#00ff85"];
    for (let i = 0; i < 6; i++) {
      const s = i * 137.5;
      items.push({
        pos: [
          (seededRandom(s) - 0.5) * 7,
          seededRandom(s + 1) * 2 + 0.2,
          (seededRandom(s + 2) - 0.5) * 6 - 1,
        ],
        color: colors[i % colors.length],
        size: 0.3 + seededRandom(s + 3) * 0.7,
        speed: 0.3 + seededRandom(s + 4) * 0.4,
      });
    }
    return items;
  }, []);

  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => (
        <Float key={i} speed={cube.speed} rotationIntensity={0.6} floatIntensity={0.3}>
          <mesh position={cube.pos} rotation={[i * 0.5, i * 0.3, 0]}>
            <boxGeometry args={[cube.size, cube.size * 0.6, cube.size * 0.4]} />
            <meshStandardMaterial
              color={cube.color}
              emissive={cube.color}
              emissiveIntensity={0.15}
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function SceneContent() {
  const platformRef = useRef<Mesh>(null);
  const sphereRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (platformRef.current) {
      platformRef.current.rotation.y = Math.sin(t * 0.06) * 0.04;
    }
    if (sphereRef.current) {
      sphereRef.current.position.y = 0.8 + Math.sin(t * 0.7) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={platformRef} position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 3.2, 64]} />
        <meshStandardMaterial color="#00d2ff" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.8, 64]} />
        <meshStandardMaterial color="#7b61ff" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[3.8, 4.2, 0.3, 64]} />
        <meshStandardMaterial color="#0f1729" roughness={0.85} metalness={0.12} />
      </mesh>

      <mesh ref={sphereRef} position={[0, 1.2, -2.6]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#00ff85"
          emissive="#00ff85"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <pointLight position={[0, 1.2, -2.6]} intensity={0.4} color="#00ff85" distance={4} />

      <FloatingCubes />

      <Text
        position={[0, 2.8, -2.6]}
        fontSize={0.32}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
        letterSpacing={0.08}
      >
        EthioTech Virtual Lab
      </Text>
    </group>
  );
}

export default function ClassroomScene() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.5, 9], fov: 45 }}
      className="absolute inset-0"
      shadows
      gl={{
        antialias: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <color attach="background" args={["#050a14"]} />
      <fog attach="fog" args={["#050a14", 8, 18]} />

      <ambientLight intensity={0.3} />
      <hemisphereLight intensity={0.25} color="#dbeafe" groundColor="#050a14" />
      <directionalLight position={[6, 10, 6]} intensity={1.2} color="#00d2ff" castShadow shadow-mapSize={[512, 512]} />
      <pointLight position={[-5, 4, -3]} intensity={0.5} color="#7b61ff" />
      <pointLight position={[3, 3, 4]} intensity={0.3} color="#00ff85" />

      <Stars radius={30} depth={40} count={400} factor={3} saturation={0} fade speed={0.5} />

      <SceneContent />
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
