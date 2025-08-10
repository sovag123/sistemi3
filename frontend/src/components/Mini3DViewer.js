import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import ErrorBoundary from './ErrorBoundary';

const Mini3DModel = ({ modelUrl }) => {
  console.log('Loading 3D model from:', modelUrl);
  
  const { scene } = useGLTF(modelUrl);
  const clonedScene = scene.clone();
  clonedScene.scale.setScalar(0.5);
  
  return <primitive object={clonedScene} />;
};

const LoadingFallback = () => (
  <div style={{ 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px'
  }}>
    Loading...
  </div>
);

const ErrorFallback = () => (
  <div style={{ 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px'
  }}>
    3D Error
  </div>
);

const Mini3DViewer = ({ modelUrl }) => {
  if (!modelUrl) {
    return null;
  }
  let fullModelUrl;
  if (modelUrl.startsWith('http')) {
    fullModelUrl = modelUrl;
  } else if (modelUrl.startsWith('/uploads/models/')) {
    const filename = modelUrl.split('/').pop();
    fullModelUrl = `http://localhost:3001/api/model/${filename}`;
  } else {
    fullModelUrl = `http://localhost:3001${modelUrl}`;
  }

  console.log('Mini3DViewer - Full model URL:', fullModelUrl);

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '80px',
        height: '80px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        border: '2px solid #007bff'
      }}
    >
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingFallback />}>
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ 
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: false
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Mini3DModel modelUrl={fullModelUrl} />
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={2}
            />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default Mini3DViewer;