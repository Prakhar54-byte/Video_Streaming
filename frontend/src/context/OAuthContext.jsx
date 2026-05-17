'use client';

import { createContext, useState } from 'react';
import axios from 'axios';

export const OAuthContext = createContext();

export const OAuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/oauth/google-login`,
        { idToken: credentialResponse.credential },
        { withCredentials: true }
      );

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async (code) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/oauth/github-exchange`,
        { code },
        { withCredentials: true }
      );

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OAuthContext.Provider value={{ handleGoogleLogin, handleGithubLogin, isLoading, error }}>
      {children}
    </OAuthContext.Provider>
  );
};
