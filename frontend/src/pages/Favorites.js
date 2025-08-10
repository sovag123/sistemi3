import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { favoritesAPI, BACKEND_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Mini3DViewer from '../components/Mini3DViewer';

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  console.log('ovdje smo');
  console.log('Favorites component - user:', user);

  useEffect(() => {
    console.log('Favorites useEffect - user changed:', user);
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      console.log('Fetching favorites...');
      setLoading(true);
      setError('');
      
      const response = await favoritesAPI.getFavorites();
      console.log('Favorites API response:', response);
      console.log('Favorites data:', response.data);
      
      if (response.data && response.data.favorites) {
        setFavorites(response.data.favorites);
        console.log('Set favorites:', response.data.favorites);
      } else {
        console.log('No favorites data found in response');
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      console.error('Error response:', err.response);
      setError(`Failed to load favorites: ${err.message}`);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this product from favorites?')) {
      return;
    }

    try {
      await favoritesAPI.removeFromFavorites(productId);
      setFavorites(favorites.filter(fav => fav.product_id !== productId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites');
    }
  };

  console.log('Render state - loading:', loading, 'error:', error, 'favorites:', favorites);

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to view your favorites</h3>
        <Link to="/login" className="btn btn-primary">Log In</Link>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading your favorites...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          My Favorites 
          {favorites.length > 0 && (
            <Badge bg="primary" className="ms-2">{favorites.length} items</Badge>
          )}
        </h2>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {favorites.length === 0 && !loading && !error ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h4>No favorites yet</h4>
            <p className="text-muted">Start browsing and add products you like to your favorites!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {favorites.map((favorite) => (
            <Col lg={3} md={4} sm={6} key={favorite.favorite_id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <Card.Img
                    variant="top"
                    src={favorite.primary_image ? `${BACKEND_BASE_URL}${favorite.primary_image}` : '/placeholder-image.jpg'}
                    style={{ height: '100%', objectFit: 'cover' }}
                    alt={favorite.title}
                  />
                  {favorite.model_3d && (
                    <Mini3DViewer modelUrl={`${BACKEND_BASE_URL}${favorite.model_3d}`} />
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-truncate">{favorite.title}</Card.Title>
                  <Card.Text className="text-muted small">
                    {favorite.category_name} • {favorite.condition_type}
                  </Card.Text>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="text-primary mb-0">${favorite.price}</h5>
                      {favorite.model_3d && <Badge bg="success">3D</Badge>}
                    </div>
                    <div className="d-flex gap-2 mb-2">
                      <Button 
                        as={Link} 
                        to={`/products/${favorite.product_id}`} 
                        variant="outline-primary" 
                        size="sm"
                        className="flex-fill"
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemoveFromFavorites(favorite.product_id)}
                        title="Remove from favorites"
                      >
                
                      </Button>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">by {favorite.seller_name}</small>
                      <small className="text-muted">{favorite.city}</small>
                    </div>
                    <small className="text-muted">
                      Added {new Date(favorite.favorited_at).toLocaleDateString()}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Favorites;