import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '', 
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); 
    setLockoutInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLockoutInfo(null);
    
    try {
      console.log('Login: Attempting login with:', { identifier: formData.identifier });
      
      const result = await login(formData);
      
      if (result.success) {
        console.log('Login: Success, navigating to:', from);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 423) {
        setLockoutInfo({
          message: err.response.data.message,
          remainingTime: err.response.data.lockedUntil
        });
        setError('');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierPlaceholder = () => {
    return 'Email or Username';
  };

  const getIdentifierLabel = () => {
    return 'Email or Username';
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="text-center">
              <h3>Login</h3>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              
              {lockoutInfo && (
                <Alert variant="warning">
                  <h6>Account Temporarily Locked</h6>
                  <p>{lockoutInfo.message}</p>
                  <small>This is a security measure to protect your account from unauthorized access.</small>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>{getIdentifierLabel()}</Form.Label>
                  <Form.Control
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder={getIdentifierPlaceholder()}
                    required
                    disabled={loading || lockoutInfo}
                  />
                  <Form.Text className="text-muted">
                    You can use either your email address or username to log in.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading || lockoutInfo}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || lockoutInfo}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </div>
              </Form>

              <hr />
              
              <div className="text-center">
                <p className="mb-0">
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>
              </div>
              
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Security Notice:</strong> Your account will be temporarily locked after 5 failed login attempts within 15 minutes.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;