import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ThreeDViewer from '../components/ThreeDViewer';
import FallbackViewer from '../components/FallbackViewer';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setProduct(response.data);
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={6}>
          <Card className="mb-3">
            <div style={{ height: '400px', overflow: 'hidden' }}>
              <Card.Img
                variant="top"
                src={product.images?.[selectedImage]?.image_url || '/placeholder-image.jpg'}
                style={{ height: '100%', objectFit: 'cover' }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <Card.Body>
                <div className="d-flex gap-2 flex-wrap">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.image_url}
                      alt={image.alt_text}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: selectedImage === index ? '2px solid #007bff' : '1px solid #ddd'
                      }}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              </Card.Body>
            )}
          </Card>

          {product.model_3d ? (
            <ThreeDViewer 
              modelUrl={product.model_3d.model_url} 
              title={product.title}
            />
          ) : (
            <FallbackViewer title={product.title} />
          )}
        </Col>

        <Col lg={6}>
          <div className="mb-3">
            <h1>{product.title}</h1>
            <div className="mb-2">
              <Badge bg="secondary" className="me-2">{product.category_name}</Badge>
              <Badge bg={product.condition_type === 'new' ? 'success' : 'warning'}>
                {product.condition_type}
              </Badge>
              {product.model_3d && (
                <Badge bg="info" className="ms-2">
                   3D Model Available
                </Badge>
              )}
            </div>
          </div>

          <Card className="mb-3">
            <Card.Body>
              <h2 className="text-primary">${product.price}</h2>
              <div className="d-grid gap-2">
                <Button variant="primary" size="lg">
                   Add to Cart
                </Button>
                <Button variant="outline-secondary">
                   Message Seller
                </Button>
                <Button variant="outline-danger">
                   Add to Favorites
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <h5>Description</h5>
            </Card.Header>
            <Card.Body>
              <p>{product.product_description}</p>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <h5>Seller Information</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Seller:</strong> {product.seller_name}</p>
              <p><strong>Location:</strong> {product.city}, {product.country}</p>
              <Button variant="outline-primary" size="sm">
                View Seller Profile
              </Button>
            </Card.Body>
          </Card>

          {product.reviews && product.reviews.length > 0 && (
            <Card>
              <Card.Header>
                <h5>Reviews ({product.reviews.length})</h5>
              </Card.Header>
              <Card.Body>
                {product.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between">
                      <strong>{review.reviewer_name}</strong>
                      <div>
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <p className="mb-0">{review.comment_text}</p>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;