import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productsAPI, orderAPI, BACKEND_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Mini3DViewer from '../components/Mini3DViewer';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({
    shippingAddress: '',
    paymentMethod: 'card',
    notes: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: ''
  });

  
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchProducts();
      fetchCategories();
    }
  }, []);

  const fetchProducts = async (searchFilters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await productsAPI.getAllProducts(searchFilters);
      console.log('Fetched products:', response.data);
      
      const productsArray = response.data.products || response.data;
      setProducts(productsArray);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    const searchFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    fetchProducts(searchFilters);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: ''
    });
    fetchProducts();
  };

  const handleBuyNow = (product) => {
    if (!user) {
      alert('Please log in to purchase products');
      return;
    }

    if (product.seller_id === user.id) {
      alert('You cannot buy your own product');
      return;
    }

    setSelectedProduct(product);
    setOrderForm({
      shippingAddress: user.primary_address || '',
      paymentMethod: 'card',
      notes: ''
    });
    setShowBuyModal(true);
  };

  const handleBuyConfirm = async () => {
    if (!orderForm.shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    setBuyLoading(true);
    try {
      const response = await orderAPI.buyNow({
        productId: selectedProduct.id,
        shippingAddress: orderForm.shippingAddress,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      });

      alert(`Order successful! Order ID: ${response.data.orderId}`);
      setShowBuyModal(false);
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && products.length === 0) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading products...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Browse Products</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {/* Filters - same as before */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search products..."
                />
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                >
                  <option value="">Any Condition</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Min Price</Form.Label>
                <Form.Control
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="$0"
                />
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Max Price</Form.Label>
                <Form.Control
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="$999999"
                />
              </Form.Group>
            </Col>
            
            <Col md={1} className="d-flex align-items-end">
              <div className="mb-3">
                <Button variant="primary" onClick={handleSearch} className="me-2">
                  Search
                </Button>
                <Button variant="outline-secondary" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {products.map(product => (
          <Col lg={3} md={4} sm={6} key={product.id} className="mb-4">
            <Card className="h-100 shadow-sm">
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <Card.Img
                  variant="top"
                  src={product.primary_image ? `${BACKEND_BASE_URL}${product.primary_image}` : '/placeholder-image.jpg'}
                  style={{ height: '100%', objectFit: 'cover' }}
                />
                {product.model_3d && (
                  <>
                    {/* Debug the model URL */}
                    {console.log(`Rendering 3D viewer for product ${product.id} with URL: ${product.model_3d}`)}
                    <Mini3DViewer modelUrl={product.model_3d} />
                  </>
                )}
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="text-truncate">{product.title}</Card.Title>
                <Card.Text className="text-muted small">
                  {product.category_name} • {product.condition_type}
                </Card.Text>
                <Card.Text className="flex-grow-1">
                  {product.product_description?.substring(0, 100)}...
                </Card.Text>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="text-primary mb-0">${product.price}</h5>
                    {product.model_3d && <span className="badge bg-success">3D</span>}
                  </div>
                  <div className="d-flex gap-2 mb-2">
                    <Button 
                      as={Link} 
                      to={`/products/${product.id}`} 
                      variant="outline-primary" 
                      size="sm"
                      className="flex-fill"
                    >
                      View Details
                    </Button>
                    {user && user.id !== product.seller_id && (
                      <Button 
                        variant="success" 
                        size="sm"
                        className="flex-fill"
                        onClick={() => handleBuyNow(product)}
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center text-muted small mt-2">
                    <span>
                      <i className="fas fa-eye me-1"></i>
                      {product.views_count || 0} views
                    </span>
                    {product.comment_count > 0 && (
                      <span>
                        <i className="fas fa-comment me-1"></i>
                        {product.comment_count}
                      </span>
                    )}
                  </div>
                  <small className="text-muted">{product.city}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {products.length === 0 && !loading && (
        <div className="text-center py-5">
          <h4>No products found</h4>
          <p>Try adjusting your search filters</p>
        </div>
      )}

      {/* Buy Now Modal */}
      <Modal show={showBuyModal} onHide={() => setShowBuyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complete Your Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <Row className="mb-4">
                <Col md={4}>
                  <img 
                    src={selectedProduct.primary_image ? `${BACKEND_BASE_URL}${selectedProduct.primary_image}` : '/placeholder-image.jpg'}
                    alt={selectedProduct.title}
                    className="img-fluid rounded"
                  />
                </Col>
                <Col md={8}>
                  <h5>{selectedProduct.title}</h5>
                  <p className="text-muted">{selectedProduct.category_name} • {selectedProduct.condition_type}</p>
                  <h4 className="text-success">${selectedProduct.price}</h4>
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
            </>
          )}
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
            {buyLoading ? 'Processing...' : `Buy Now - $${selectedProduct?.price}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Products;