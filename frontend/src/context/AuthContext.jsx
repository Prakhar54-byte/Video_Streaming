"use client"

import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        // Verify token hasn't expired
        const decodedToken = jwtDecode(token)
        const currentTime = Date.now() / 1000
        
        if (decodedToken.exp > currentTime) {
          // Set auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Get user data
          fetchUserData(token)
        } else {
          // Token expired
          localStorage.removeItem('token')
          setLoading(false)
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`)
      setUser(response.data)
      setLoading(false)
    } catch (error) {
      localStorage.removeItem('token')
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password
      })
      
      const { token, user } = response.data
      
      // Save token to localStorage
      localStorage.setItem('token', token)
      
      // Set auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        username,
        email,
        password
      })
      
      const { token, user } = response.data
      
      // Save token to localStorage
      localStorage.setItem('token', token)
      
      // Set auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
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

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token')
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization']
    
    // Clear user from state
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
