import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import { Card } from 'react-bootstrap';

const FallbackModel = () => {
  return (
    <group>
      <Box args={[2, 2, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4CAF50" />
      </Box>
      <Text
        position={[0, -2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        3D Model
      </Text>
    </group>
  );
};

const FallbackViewer = ({ title }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">3D Preview</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <div style={{ 
          height: '300px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            
            <FallbackModel />
            
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
          </Canvas>
        </div>
        <div className="p-3 text-center">
          <small className="text-muted">
            This is a placeholder 3D model. The actual model will be loaded from: {title}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FallbackViewer;