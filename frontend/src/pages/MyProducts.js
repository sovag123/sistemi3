import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Modal, Form, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';

const MyProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'sold'

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
      setProducts(response.data.products || response.data);
    } catch (error) {
      console.error('Error fetching user products:', error);
      setError('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilter = () => {
    let filtered = [...products];
    
    switch (filter) {
      case 'active':
        filtered = products.filter(product => product.is_active === true);
        break;
      case 'sold':
        filtered = products.filter(product => product.is_active === false);
        break;
      default:
        // 'all' - show all products
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product,
      images: [],
      model_3d: null,
      removeImages: [],
      removeModel: false
    });
    setShowEditModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.deleteProduct(productId);
        setMessage('Product deleted successfully');
        fetchUserProducts();
      } catch (error) {
        setError('Failed to delete product');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', editingProduct.title);
      formData.append('product_description', editingProduct.product_description);
      formData.append('price', editingProduct.price);
      formData.append('category_id', editingProduct.category_id);
      formData.append('condition_type', editingProduct.condition_type);
      
      if (editingProduct.removeImages.length > 0) {
        formData.append('removeImages', JSON.stringify(editingProduct.removeImages));
      }
      
      if (editingProduct.removeModel) {
        formData.append('removeModel', 'true');
      }

      if (editingProduct.images.length > 0) {
        editingProduct.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      if (editingProduct.model_3d) {
        formData.append('model_3d', editingProduct.model_3d);
      }

      await productsAPI.updateProduct(editingProduct.id, formData);
      setMessage('Product updated successfully');
      setShowEditModal(false);
      fetchUserProducts();
    } catch (error) {
      setError('Failed to update product');
    } finally {
      setLoading(false);
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
    return isActive ? (
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
                All Products ({products.length})
              </Button>
              <Button 
                variant={filter === 'active' ? 'success' : 'outline-success'}
                onClick={() => setFilter('active')}
              >
                Active ({products.filter(p => p.is_active).length})
              </Button>
              <Button 
                variant={filter === 'sold' ? 'danger' : 'outline-danger'}
                onClick={() => setFilter('sold')}
              >
                Sold ({products.filter(p => !p.is_active).length})
              </Button>
            </ButtonGroup>
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                {products.length === 0 ? (
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
                        <td>${product.price}</td>
                        <td>{getConditionBadge(product.condition_type)}</td>
                        <td>{getStatusBadge(product.is_active)}</td>
                        <td>{product.views_count || 0}</td>
                        <td>{new Date(product.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              as={Link} 
                              to={`/products/${product.id}`}
                              variant="outline-primary" 
                              size="sm"
                            >
                              View
                            </Button>
                            {product.is_active && (
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                Edit
                              </Button>
                            )}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
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

      {/* Edit Modal - same as before */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProduct && (
            <Form onSubmit={handleEditSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Product Title</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct(prev => ({...prev, title: e.target.value}))}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={editingProduct.product_description}
                  onChange={(e) => setEditingProduct(prev => ({...prev, product_description: e.target.value}))}
                  required
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct(prev => ({...prev, price: e.target.value}))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={editingProduct.category_id}
                      onChange={(e) => setEditingProduct(prev => ({...prev, category_id: e.target.value}))}
                      required
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  value={editingProduct.condition_type}
                  onChange={(e) => setEditingProduct(prev => ({...prev, condition_type: e.target.value}))}
                  required
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Add New Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setEditingProduct(prev => ({...prev, images: Array.from(e.target.files)}))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Add New 3D Model</Form.Label>
                <Form.Control
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx"
                  onChange={(e) => setEditingProduct(prev => ({...prev, model_3d: e.target.files[0]}))}
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MyProducts;