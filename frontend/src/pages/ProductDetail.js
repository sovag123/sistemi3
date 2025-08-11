import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, orderAPI, favoritesAPI, getFullImageUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ThreeDViewer from '../components/ThreeDViewer';
import FallbackViewer from '../components/FallbackViewer';
import ProductComments from '../components/ProductComments';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({
    shippingAddress: '',
    paymentMethod: 'card',
    notes: ''
  });

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      
      if (!response.data.is_active) {
        setError('This product is no longer available (already sold)');
        return;
      }
      
      setProduct(response.data);
      
      if (user) {
        checkFavoriteStatus();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Product not found or no longer available');
      } else {
        setError('Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.checkFavoriteStatus(id);
      setIsFavorited(response.data.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please log in to add favorites');
      navigate('/login');
      return;
    }

    if (product.seller_id === user.id) {
      alert('You cannot favorite your own product');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await favoritesAPI.removeFromFavorites(product.id);
        setIsFavorited(false);
      } else {
        await favoritesAPI.addToFavorites(product.id);
        setIsFavorited(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      alert('Please log in to purchase this product');
      navigate('/login');
      return;
    }

    if (product.seller_id === user.id) {
      alert('You cannot buy your own product');
      return;
    }

    setOrderForm({
      shippingAddress: user.primary_address || '',
      paymentMethod: 'card',
      notes: ''
    });
    setShowBuyModal(true);
  };

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBuyConfirm = async () => {
    if (!orderForm.shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    setBuyLoading(true);
    try {
      const response = await orderAPI.buyNow({
        productId: product.id,
        shippingAddress: orderForm.shippingAddress,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      });

      alert(`Order successful! Order ID: ${response.data.orderId}`);
      setShowBuyModal(false);
      
      navigate('/products');
      
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setBuyLoading(false);
    }
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toString();
    }
  };

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
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/products')}>
              Browse Other Products
            </Button>
          </div>
        </Alert>
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
                src={getFullImageUrl(product.images?.[selectedImage]?.image_url) || '/placeholder-image.jpg'}
                style={{ height: '100%', objectFit: 'cover' }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <Card.Body>
                <div className="d-flex gap-2 flex-wrap">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={getFullImageUrl(image.image_url)}
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
            )}now 
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
            
            <div className="text-muted small mb-3">
              <i className="fas fa-eye me-1"></i>
              {formatViewCount(product.views_count)} views
              {product.comment_count > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <i className="fas fa-comment me-1"></i>
                  {product.comment_count} comment{product.comment_count !== 1 ? 's' : ''}
                </>
              )}
              <span className="mx-2">•</span>
              <i className="fas fa-calendar me-1"></i>
              Listed {new Date(product.created_at).toLocaleDateString()}
            </div>
          </div>

          <Card className="mb-3">
            <Card.Body>
              <h2 className="text-primary">${product.price}</h2>
              <div className="d-grid gap-2">
                {user && user.id !== product.seller_id ? (
                  <Button variant="success" size="lg" onClick={handleBuyNow}>
                    Buy Now
                  </Button>
                ) : user && user.id === product.seller_id ? (
                  <Button variant="secondary" size="lg" disabled>
                    Your Product
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                    Login to Purchase
                  </Button>
                )}
                {user && user.id !== product.seller_id ? (
                <Button variant="outline-secondary">
                  Message Seller
                </Button>
                ) : user && user.id == product.seller_id ?(
                  <Button variant="secondary" size="lg" disabled>
                    Your Product
                  </Button>
                ):( <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                    Login to Message
                  </Button>
                )}
                {user && user.id !== product.seller_id && (
                  <Button 
                    variant={isFavorited ? "danger" : "outline-danger"}
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                  >
                    {favoriteLoading ? 'Loading...' : isFavorited ? '♥ Remove from Favorites' : '♡ Add to Favorites'}
                  </Button>
                )}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <ProductComments productId={product.id} />
        </Col>
      </Row>

      <Modal show={showBuyModal} onHide={() => setShowBuyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complete Your Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={4}>
              <img 
                src={getFullImageUrl(product.images?.[0]?.image_url) || '/placeholder-image.jpg'}
                alt={product.title}
                className="img-fluid rounded"
              />
            </Col>
            <Col md={8}>
              <h5>{product.title}</h5>
              <p className="text-muted">{product.category_name} • {product.condition_type}</p>
              <h4 className="text-success">${product.price}</h4>
            </Col>
          </Row>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Shipping Address *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="shippingAddress"
                value={orderForm.shippingAddress}
                onChange={handleOrderFormChange}
                placeholder="Enter your complete shipping address..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                name="paymentMethod"
                value={orderForm.paymentMethod}
                onChange={handleOrderFormChange}
              >
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash on Delivery</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={orderForm.notes}
                onChange={handleOrderFormChange}
                placeholder="Any special instructions..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBuyModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleBuyConfirm}
            disabled={buyLoading}
          >
            {buyLoading ? 'Processing...' : `Buy Now - $${product.price}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductDetail;