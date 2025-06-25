import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
// Remove the Sphere import
import * as THREE from "three";

const FloatingNode = React.memo(({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color="#4CD4B0"
        emissive="#4CD4B0"
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
});

FloatingNode.displayName = 'FloatingNode';

// ...existing code...
const ThreeBackground = React.memo(() => {
  const nodes = useMemo(() => 
    Array.from(
      { length: 20 },
      (_, i) =>
        [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ] as [number, number, number]
    ), []
  );

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#4CD4B0" />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.3}
          color="#FF6E7F"
        />

        {nodes.map((position, index) => (
          <FloatingNode key={index} position={position} />
        ))}
      </Canvas>
    </div>
  );
});

ThreeBackground.displayName = 'ThreeBackground';

export default ThreeBackground;
