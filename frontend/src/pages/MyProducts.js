import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';

const MyProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); 

  useEffect(() => {
    if (user) {
      fetchUserProducts();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [products, filter]);

  const fetchUserProducts = async () => {
    try {
      const response = await productsAPI.getUserProducts(user.id);
      console.log('API Response:', response.data); 
      
      
      const productsData = response.data.products || response.data || [];
      
      
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        console.error('Products data is not an array:', productsData);
        setProducts([]);
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching user products:', error);
      setError('Failed to load your products');
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilter = () => {
    
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];
    
    switch (filter) {
      case 'active':
        filtered = products.filter(product => product.is_active === true || product.is_active === 1);
        break;
      case 'sold':
        filtered = products.filter(product => product.is_active === false || product.is_active === 0);
        break;
      default:
        filtered = products;
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const handleDelete = async (productId, productTitle) => {
    if (window.confirm(`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`)) {
      try {
        console.log('Attempting to delete product:', productId);
        
        await productsAPI.deleteProduct(productId);
        
        setMessage('Product deleted successfully');
        
      
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        
        setTimeout(() => setMessage(''), 5000); 
        
      } catch (error) {
        console.error('Error deleting product:', error);
        console.error('Error response:', error.response);
        
        let errorMessage = 'Failed to delete product';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.response?.status === 403) {
          errorMessage = 'You are not authorized to delete this product';
        } else if (error.response?.status === 401) {
          errorMessage = 'Please log in to delete products';
        }
        
        setError(errorMessage);
        setTimeout(() => setError(''), 5000); 
      }
    }
  };

  const getConditionBadge = (condition) => {
    const variants = {
      new: 'success',
      used: 'warning',
      refurbished: 'info'
    };
    return <Badge bg={variants[condition] || 'secondary'}>{condition}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return (isActive === true || isActive === 1) ? (
      <Badge bg="success">Active</Badge>
    ) : (
      <Badge bg="danger">Sold</Badge>
    );
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to view your products</h3>
        <Link to="/login" className="btn btn-primary">Log In</Link>
      </Container>
    );
  }

  if (loading && products.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const activeProducts = Array.isArray(products) ? products.filter(p => p.is_active === true || p.is_active === 1).length : 0;
  const soldProducts = Array.isArray(products) ? products.filter(p => p.is_active === false || p.is_active === 0).length : 0;

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>My Products</h2>
            <Button as={Link} to="/sell" variant="primary">
              Add New Product
            </Button>
          </div>

          {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          {/* Filter Buttons */}
          <div className="mb-4">
            <ButtonGroup>
              <Button 
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('all')}
              >
                All Products ({totalProducts})
              </Button>
              <Button 
                variant={filter === 'active' ? 'success' : 'outline-success'}
                onClick={() => setFilter('active')}
              >
                Active ({activeProducts})
              </Button>
              <Button 
                variant={filter === 'sold' ? 'danger' : 'outline-danger'}
                onClick={() => setFilter('sold')}
              >
                Sold ({soldProducts})
              </Button>
            </ButtonGroup>
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                {totalProducts === 0 ? (
                  <>
                    <h5>No products listed yet</h5>
                    <p className="text-muted">Start selling by creating your first product listing.</p>
                    <Button as={Link} to="/sell" variant="primary">
                      List Your First Product
                    </Button>
                  </>
                ) : (
                  <>
                    <h5>No {filter} products found</h5>
                    <p className="text-muted">
                      {filter === 'active' && 'All your products have been sold.'}
                      {filter === 'sold' && 'You haven\'t sold any products yet.'}
                    </p>
                  </>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Comments</th>
                      <th>Favorites</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {product.primary_image && (
                              <img 
                                src={`http://localhost:3001${product.primary_image}`}
                                alt={product.title}
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                className="me-3 rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <strong>{product.title}</strong>
                              <br />
                              <small className="text-muted">
                                {product.product_description?.substring(0, 50)}...
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{product.category_name}</td>
                        <td>${parseFloat(product.price).toFixed(2)}</td>
                        <td>{getConditionBadge(product.condition_type)}</td>
                        <td>{getStatusBadge(product.is_active)}</td>
                        <td>
                          <Badge bg="info">{product.views_count || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="secondary">{product.comment_count || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="warning">{product.favorite_count || 0}</Badge>
                        </td>
                        <td>{new Date(product.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              as={Link} 
                              to={`/products/${product.id}`}
                              variant="outline-primary" 
                              size="sm"
                              title="View product details"
                            >
                              <i className="fas fa-eye"></i> View
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(product.id, product.title)}
                              disabled={loading}
                              title="Delete product permanently"
                            >
                              <i className="fas fa-trash"></i> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MyProducts;