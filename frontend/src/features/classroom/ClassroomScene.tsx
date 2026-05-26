import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Text } from "@react-three/drei";
import type { Group } from "three";

function SceneContent() {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!group.current) return;
    group.current.rotation.y = Math.sin(t * 0.12) * 0.08;
    group.current.position.y = Math.sin(t * 0.45) * 0.05;
  });

  return (
    <group ref={group}>
      <Box args={[8, 0.2, 6]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#111823" roughness={0.92} metalness={0.08} />
      </Box>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.35, 48]} />
        <meshBasicMaterial color="#00d2ff" transparent opacity={0.14} />
      </mesh>
      <Box args={[1.25, 0.82, 0.62]} position={[-2.2, 0.22, -1.15]} rotation={[0, 0.3, 0]}>
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.22} />
      </Box>
      <Box args={[1.05, 0.62, 0.52]} position={[2, 0.15, 0.55]} rotation={[0, -0.4, 0]}>
        <meshStandardMaterial color="#7b61ff" emissive="#7b61ff" emissiveIntensity={0.2} />
      </Box>
      <Sphere args={[0.42, 32, 32]} position={[0, 1.3, -2.1]}>
        <meshStandardMaterial color="#00ff85" emissive="#00ff85" emissiveIntensity={0.35} />
      </Sphere>
      <Text position={[0, 2.55, -2.1]} fontSize={0.36} color="#ffffff" anchorX="center" anchorY="middle">
        EthioTech Virtual Lab
      </Text>
    </group>
  );
}

export default function ClassroomScene() {
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 3, 8], fov: 50 }} className="absolute inset-0">
      <ambientLight intensity={0.38} />
      <hemisphereLight intensity={0.28} color="#dbeafe" groundColor="#050a14" />
      <directionalLight position={[5, 8, 5]} intensity={1.05} color="#00d2ff" />
      <pointLight position={[-4, 3, -2]} intensity={0.6} color="#7b61ff" />
      <pointLight position={[2, 2, 3]} intensity={0.35} color="#00ff85" />
      <SceneContent />
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={4} maxDistance={12} />
    </Canvas>
  );
}
