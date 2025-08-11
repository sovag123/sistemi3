import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const savedToken = localStorage.getItem('token');
    const savedSessionToken = localStorage.getItem('sessionToken');
    const activeToken = savedSessionToken || savedToken;
    
    console.log('AuthContext: Checking auth status with token:', activeToken ? 'Present' : 'None');
    
    if (activeToken) {
      setToken(activeToken);
      try {
        const response = await authAPI.getProfile();
        console.log('AuthContext: Profile loaded:', response.data.user);
        setUser(response.data.user);
      } catch (error) {
        console.error('AuthContext: Auth check failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    console.log('AuthContext: Starting login process');
    setLoading(true);
    
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, sessionToken, user: newUser } = response.data;
      
      console.log('AuthContext: Login response received', { 
        newUser, 
        hasToken: !!newToken,
        hasSessionToken: !!sessionToken 
      });
      
      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
        setToken(sessionToken); 
      } else {
        setToken(newToken);
      }
      
      setUser(newUser);
      setLoading(false);
      
      console.log('AuthContext: State updated immediately, user is now:', newUser);
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    console.log('AuthContext: Starting registration process');
    setLoading(true);
    
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, sessionToken, user: newUser } = response.data;
      
      console.log('AuthContext: Registration response received', { 
        newUser, 
        hasToken: !!newToken,
        hasSessionToken: !!sessionToken 
      });
      
      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
        setToken(sessionToken); 
      } else {
        setToken(newToken);
      }
      
      setUser(newUser);
      setLoading(false);
      
      console.log('AuthContext: Registration successful, user is now:', newUser);
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('sessionToken');
    setToken(null);
    setUser(null);
    
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      authAPI.logout().catch(console.error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await authAPI.updateProfile(profileData);
      
      setUser(prev => ({
        ...prev,
        ...profileData
      }));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  console.log('AuthContext: Current state:', { 
    user: user ? user.username : 'None', 
    hasToken: !!token, 
    loading,
    isAuthenticated: !!user 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};