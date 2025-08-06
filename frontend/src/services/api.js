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
  console.log(`Making request to: ${config.url}`);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
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

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

export default api;