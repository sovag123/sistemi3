import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { getFullModelUrl } from '../services/api';

const Mini3DModel = ({ url }) => {
  const fullUrl = getFullModelUrl(url);
  console.log('Mini3DViewer loading:', fullUrl); 
  const { scene } = useGLTF(fullUrl);
  return <primitive object={scene} scale={0.5} />;
};

const FallbackModel = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
  );
};


const LoadingModel = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffa500" />
    </mesh>
  );
};

const Mini3DViewer = ({ modelUrl }) => {
  if (!modelUrl) return null;

  console.log('Mini3DViewer received modelUrl:', modelUrl); 

  return (
    <div 
      style={{ 
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '80px',
        height: '80px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 2, 2]} />
        <Suspense fallback={<LoadingModel />}>
          <Mini3DModel url={modelUrl} />
        </Suspense>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
};

export default Mini3DViewer;