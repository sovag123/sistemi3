import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';

const SellProduct = () => {
  console.log('ovdje smo');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState([]);
  const [model3D, setModel3D] = useState(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    product_description: '',
    price: '',
    category_id: '',
    condition_type: 'used',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 10) {
      setError('You can upload maximum 10 images');
      return;
    }

    setImages(files);
    setThumbnailIndex(0); // Set first image as thumbnail by default
    setError('');
  };

  const handleModel3DChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('3D model file size should be less than 50MB');
        return;
      }
      const allowedTypes = ['.glb', '.gltf', '.obj', '.fbx'];
      const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please upload a valid 3D model file (.glb, .gltf, .obj, .fbx)');
        return;
      }
      
      setModel3D(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Product title is required');
      return;
    }
    
    if (!formData.product_description.trim()) {
      setError('Product description is required');
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      submitData.append('seller_id', user.id);
      images.forEach((image, index) => {
        submitData.append('images', image);
        if (index === thumbnailIndex) {
          submitData.append('thumbnail_index', index);
        }
      });
      if (model3D) {
        submitData.append('model_3d', model3D);
      }

      const response = await productsAPI.createProduct(submitData);
      
      setSuccess('Product listed successfully!');
      setFormData({
        title: '',
        product_description: '',
        price: '',
        category_id: '',
        condition_type: 'used',
      });
      setImages([]);
      setModel3D(null);
      setThumbnailIndex(0);
      setTimeout(() => {
        navigate('/my-products');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to sell products</h3>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Log In
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h3>Create New Product Listing</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter product title..."
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="product_description"
                    value={formData.product_description}
                    onChange={handleInputChange}
                    placeholder="Describe your product in detail..."
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($) *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a category</option>
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
                  <Form.Label>Condition *</Form.Label>
                  <Form.Select
                    name="condition_type"
                    value={formData.condition_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Product Images * (Max 10 images)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Upload at least one image. The first image will be set as thumbnail by default.
                  </Form.Text>
                </Form.Group>

                {images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select Thumbnail Image</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'cover',
                              border: thumbnailIndex === index ? '3px solid #007bff' : '1px solid #ddd',
                              cursor: 'pointer'
                            }}
                            onClick={() => setThumbnailIndex(index)}
                          />
                          {thumbnailIndex === index && (
                            <div className="position-absolute top-0 start-0 bg-primary text-white px-1 small">
                              Thumbnail
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>3D Model (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx"
                    onChange={handleModel3DChange}
                  />
                  <Form.Text className="text-muted">
                    Upload a 3D model file (.glb, .gltf, .obj, .fbx) - Max 50MB
                  </Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/my-products')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Listing'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellProduct;