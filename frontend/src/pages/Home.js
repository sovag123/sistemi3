import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: '',
      title: '3D Product Viewing',
      description: 'Inspect products in full 3D before you buy. Rotate, zoom, and explore every detail.'
    },
    {
      icon: '',
      title: 'Wide Selection',
      description: 'From electronics to furniture, find quality used and new products from trusted sellers.'
    },
    {
      icon: '',
      title: 'Secure Trading',
      description: 'Safe and secure transactions with verified sellers and buyer protection.'
    }
  ];

  return (
    <Container fluid>
      <div className="bg-gradient text-white text-center py-5 mb-5" style={{
        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
      }}>
        <Container>
          <h1 className="display-2 mb-4">Welcome to 3D Marketplace</h1>
          <p className="lead mb-4">Experience products like never before with interactive 3D models</p>
          <Button as={Link} to="/products" variant="light" size="lg">
            Start Shopping
          </Button>
        </Container>
      </div>

      <Container>
        <h2 className="text-center mb-5">Why Choose 3D Marketplace?</h2>
        
        <Row className="mb-5">
          {features.map((feature, index) => (
            <Col md={4} key={index} className="mb-4">
              <Card className="h-100 text-center border-0 shadow">
                <Card.Body className="p-4">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>
                    {feature.icon}
                  </div>
                  <Card.Title>{feature.title}</Card.Title>
                  <Card.Text>{feature.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center py-5">
          <h3 className="mb-3">Ready to explore?</h3>
          <p className="mb-4">Browse our collection of products with detailed 3D models</p>
          <Button as={Link} to="/products" variant="primary" size="lg">
            Browse Products
          </Button>
        </div>
      </Container>
    </Container>
  );
};

export default Home;