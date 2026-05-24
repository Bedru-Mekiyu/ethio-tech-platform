import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Text } from "@react-three/drei";

export default function ClassroomScene() {
  return (
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 3, 8], fov: 50 }} className="absolute inset-0">
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#00d2ff" />
      <pointLight position={[-4, 3, -2]} intensity={0.65} color="#7b61ff" />
      <pointLight position={[2, 2, 3]} intensity={0.4} color="#00ff85" />

      <Box args={[8, 0.2, 6]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#111823" roughness={0.9} metalness={0.1} />
      </Box>

      <Box args={[1.2, 0.8, 0.6]} position={[-2.2, 0.2, -1.1]} rotation={[0, 0.3, 0]}>
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.22} />
      </Box>
      <Box args={[1, 0.6, 0.5]} position={[2, 0.15, 0.5]} rotation={[0, -0.4, 0]}>
        <meshStandardMaterial color="#7b61ff" emissive="#7b61ff" emissiveIntensity={0.2} />
      </Box>
      <Sphere args={[0.42, 32, 32]} position={[0, 1.3, -2.1]}>
        <meshStandardMaterial color="#00ff85" emissive="#00ff85" emissiveIntensity={0.35} />
      </Sphere>

      <Text position={[0, 2.55, -2.1]} fontSize={0.36} color="#ffffff" anchorX="center" anchorY="middle">
        EthioTech Virtual Lab
      </Text>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={4} maxDistance={12} />
    </Canvas>
  );
}
