"use client"

import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

// jwtDecode is no longer needed, as we can't read httpOnly cookies
// import { jwtDecode } from 'jwt-decode' 

const AuthContext = createContext()

// *** IMPORTANT ***
// Configure axios to send cookies with all requests
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated  = !!user

  useEffect(() => {
    // On mount, check if the user has a valid session cookie
    // We do this by asking our backend for the user's data
    const checkUserSession = async () => {
      try {
        // The browser will AUTOMATICALLY send the cookie
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/current-user`)
        
        // If we get data, the user is logged in
        setUser(response.data)
      } catch (error) {
        // If it fails (e.g., 401 Unauthorized), the user is not logged in
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUserSession()
  }, [])

  // This function is no longer needed as part of the initial load
  // const fetchUserData = async (token) => { ... }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`, {
        email,
        password
      })
      
      // The backend should set the httpOnly cookie in its response headers.
      // The response.data should be the user object.
      
      // We no longer get a 'token' in the body
      // const { token, user } = response.data 
      
      // We just get the user data
      const user = response.data 
      
      // We DO NOT save the token in localStorage
      // localStorage.setItem('token', token)
      
      // We DO NOT set the auth header. The browser does it.
      // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Set user in state
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`, {
        username,
        email,
        password
      })
      
      // Same as login: backend sets cookie, response is user data
      const user = response.data
      
      // No localStorage or axios header manipulation needed
      
      // Set user in state
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = async () => {
    try {
      // We must tell the backend to clear the cookie
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/logout`)
    } catch (error) {
      // Even if the backend call fails, log the user out on the client
      console.error("Server logout failed:", error)
    }
    
    // We DO NOT need to remove from localStorage
    // localStorage.removeItem('token')
    
    // We DO NOT need to remove the header
    // delete axios.defaults.headers.common['Authorization']
    
    // Clear user from state
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}