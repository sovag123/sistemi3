import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const BACKEND_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Token sent with request:', token.substring(0, 20) + '...');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getFullModelUrl = (modelPath) => {
  if (!modelPath) return null;
  if (modelPath.startsWith('http')) return modelPath;
  
  console.log('Converting model path:', modelPath);
  
  if (modelPath.startsWith('/uploads/models/')) {
    const fullUrl = `${BACKEND_BASE_URL}${modelPath}`;
    console.log('Full URL for uploads/models:', fullUrl);
    return fullUrl;
  }
  if (modelPath.startsWith('/models/')) {
    const fullUrl = `${BACKEND_BASE_URL}${modelPath}`;
    console.log('Full URL for models:', fullUrl);
    return fullUrl;
  }
  if (modelPath.startsWith('models/')) {
    const fullUrl = `${BACKEND_BASE_URL}/${modelPath}`;
    console.log('Full URL for models (no slash):', fullUrl);
    return fullUrl;
  }
  
  const fullUrl = `${BACKEND_BASE_URL}${modelPath}`;
  console.log('Default full URL:', fullUrl);
  return fullUrl;
};

export const orderAPI = {
  buyNow: (orderData) => api.post('/orders/buy-now', orderData),
  getMyOrders: () => api.get('/orders/my-orders'),
  getMySales: () => api.get('/orders/my-sales'),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const productsAPI = {
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getUserProducts: (userId) => api.get(`/products/user/${userId}`),
  createProduct: (productData) => api.post('/products', productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  addToFavorites: (productId) => api.post('/favorites/add', { productId }),
  removeFromFavorites: (productId) => api.delete(`/favorites/remove/${productId}`),
  checkFavoriteStatus: (productId) => api.get(`/favorites/check/${productId}`),
};

export const commentsAPI = {
  getProductComments: (productId) => api.get(`/comments/product/${productId}`),
  addComment: (productId, commentData) => api.post(`/comments/product/${productId}`, commentData),
  updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

export { BACKEND_BASE_URL };
export default api;