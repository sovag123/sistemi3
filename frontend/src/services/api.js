import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

const retryRequest = async (config, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await api.request(config);
    } catch (error) {
      if (i === retries - 1) throw error;
      
   
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

api.interceptors.request.use((config) => {
  const sessionToken = localStorage.getItem('sessionToken');
  const jwtToken = localStorage.getItem('token');
  
  const token = sessionToken || jwtToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    

    if (error.response?.status === 429 && !error.config._retry) {
      error.config._retry = true;
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      return api.request(error.config);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionToken');
      
      if (!error.config.url.includes('/auth/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const getFullModelUrl = (modelPath) => {
  if (!modelPath) return null;
  
  if (modelPath.startsWith('http://') || modelPath.startsWith('https://')) {
    return modelPath;
  }
  
  const cleanPath = modelPath.startsWith('/') ? modelPath.substring(1) : modelPath;
  
  return `${BACKEND_BASE_URL}/${cleanPath}`;
};

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  return `${BACKEND_BASE_URL}/${cleanPath}`;
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  deleteAccount: (password) => api.delete('/auth/profile', { data: { password } }),
  checkSession: () => api.get('/auth/session/status'),
};

export const productsAPI = {
  getAllProducts: (filters = {}) => api.get('/products', { params: filters }),
  getProduct: (id) => api.get(`/products/${id}`),
  getProductStats: (id) => api.get(`/products/${id}/stats`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getUserProducts: (userId) => api.get(`/products/user/${userId}`),
};

export const orderAPI = {
  buyNow: (orderData) => {
    console.log('API: Sending buy now request:', orderData);
    return api.post('/orders/buy-now', orderData);
  },
  getMyOrders: () => api.get('/orders/my-orders'),
  getMySales: () => api.get('/orders/my-sales'),
};

export const commentsAPI = {
  getProductComments: (productId) => api.get(`/comments/product/${productId}`),
  addComment: (productId, commentData) => api.post(`/comments/product/${productId}`, commentData),
  updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

export const favoritesAPI = {
  getUserFavorites: () => api.get('/favorites'),
  addToFavorites: (productId) => api.post('/favorites/add', { productId }),
  removeFromFavorites: (productId) => api.delete(`/favorites/remove/${productId}`),
  checkFavoriteStatus: (productId) => api.get(`/favorites/check/${productId}`),
};

export { BACKEND_BASE_URL };
export default api;