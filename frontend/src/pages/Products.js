import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import Mini3DViewer from '../components/Mini3DViewer';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async (searchFilters = {}) => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(searchFilters);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories');
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

  if (loading && products.length === 0) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Browse Products</h1>
      
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

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {products.map(product => (
          <Col lg={3} md={4} sm={6} key={product.id} className="mb-4">
            <Card className="h-100 shadow-sm">
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <Card.Img
                  variant="top"
                  src={product.primary_image || '/placeholder-image.jpg'}
                  style={{ height: '100%', objectFit: 'cover' }}
                />
                {product.model_3d && (
                  <Mini3DViewer modelUrl={product.model_3d} />
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
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted"> {product.city}</small>
                    <Button as={Link} to={`/products/${product.id}`} variant="primary" size="sm">
                      View Details
                    </Button>
                  </div>
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
    </Container>
  );
};

export default Products;