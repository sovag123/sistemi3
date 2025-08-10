import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei';
import { Card, Button, Spinner } from 'react-bootstrap';
import { getFullModelUrl } from '../services/api';
import ErrorBoundary from './ErrorBoundary';

const Model = ({ url }) => {
  const fullUrl = getFullModelUrl(url);
  console.log('Loading 3D model from:', fullUrl);
  const { scene } = useGLTF(fullUrl);
  
  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    );
  }
  
  return <primitive object={scene} />;
};

const ErrorModel = () => {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
};

const LoadingFallback = () => (
  <Html center>
    <div style={{
      color: 'white',
      textAlign: 'center',
      background: 'rgba(0,0,0,0.5)',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <Spinner animation="border" />
      <div className="mt-2">Loading 3D Model...</div>
    </div>
  </Html>
);

const ThreeDViewer = ({ modelUrl, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {

    setError(null);
  }, [modelUrl]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!modelUrl) {
    return (
      <Card>
        <Card.Body className="text-center p-4">

          <h5>No 3D Model Available</h5>
          <p className="text-muted">This product doesn't have a 3D model yet.</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">3D Model Viewer</h5>
        </Card.Header>
        <Card.Body className="text-center p-4">
         
          <h5>Unable to Load 3D Model</h5>
          <p className="text-muted">There was an error loading the 3D model.</p>
          <Button variant="primary" onClick={() => setError(null)}>
            Try Again
          </Button>
        </Card.Body>
      </Card>
    );
  }

  console.log('ThreeDViewer received modelUrl:', modelUrl);

  const renderCanvas = (isFullscreenCanvas = false) => (
    <Canvas
      ref={isFullscreenCanvas ? undefined : canvasRef}
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      onError={(error) => {
        console.error('Canvas error:', error);
        setError(error);
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <ErrorBoundary fallback={<ErrorModel />}>
          <Model url={modelUrl} />
        </ErrorBoundary>
        
        <Environment preset="studio" />
        <ContactShadows position={[0, -1.4, 0]} opacity={0.75} scale={10} blur={2.5} far={4} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />
      </Suspense>
    </Canvas>
  );

  return (
    <ErrorBoundary>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">3D Model Viewer</h5>
          <Button variant="outline-primary" size="sm" onClick={handleFullscreen}>
            {isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen'}
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div style={{ 
            height: isFullscreen ? '80vh' : '400px', 
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            {renderCanvas()}
            
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Click and drag to rotate, Scroll to zoom, Pinch to zoom
            </div>
          </div>
        </Card.Body>
      </Card>

      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4>{title} - 3D Model</h4>
            <Button variant="light" onClick={handleFullscreen}>
               Close
            </Button>
          </div>
          
          <div style={{ flex: 1 }}>
            {renderCanvas(true)}
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default ThreeDViewer;