import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  console.log('AuthProvider render - user:', user, 'loading:', loading, 'token:', token ? 'exists' : 'null');

  const logout = useCallback(() => {
    console.log('Logout called');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      console.log('No token, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('Fetching user profile...');
    try {
      const response = await authAPI.getProfile();
      console.log('Profile response:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error.response?.status === 401) {
        console.log('Token invalid, logging out');
        logout();
      } else {
        // For other errors, still set loading to false
        setUser(null);
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    console.log('AuthProvider useEffect triggered - token:', token ? 'exists' : 'null');
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      console.log('Login attempt for:', email);
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;
      
      console.log('Login successful:', newUser);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Register attempt for:', userData.email);
      setLoading(true);
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data;
      
      console.log('Registration successful:', newUser);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await authAPI.updateProfile(profileData);
      await fetchUserProfile(); 
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateProfile
  };

  console.log('AuthProvider providing:', { 
    hasUser: !!user, 
    loading, 
    isAuthenticated: !!user && !!token,
    token: token ? 'exists' : 'null'
  });

  return ( 
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};