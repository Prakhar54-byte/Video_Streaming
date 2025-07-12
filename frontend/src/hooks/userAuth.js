"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
          setIsLoading(false);
          return;
        }

        try {
          const res = await fetch("http://localhost:8000/api/v1/users/refresh-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ refreshToken }),
          });

          if (!res.ok) {
            throw new Error("Token verification failed");
          }

          const data = await res.json();

          // Consistent token naming
          if (data.data.accessToken) {
            localStorage.setItem("accessToken", data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem("refreshToken", data.data.refreshToken);
          }
          
          setUser(data.user || data.data.user);
          console.log("Token verification successful"); // Move here after success
          
        } catch (error) {
          console.error("Token verification error:", error);
          // Clean up all token variations
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Add this for cookie support
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      setUser(data.user || data.data.user);

      // Consistent token naming
      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(data.user || data.data.user));
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
        }
        if (data.data?.refreshToken) {
          localStorage.setItem("refreshToken", data.data.refreshToken);
        }
      } else {
        sessionStorage.setItem("user", JSON.stringify(data.user || data.data.user));
        if (data.data?.accessToken) {
          sessionStorage.setItem("accessToken", data.data.accessToken);
        }
        if (data.data?.refreshToken) {
          sessionStorage.setItem("refreshToken", data.data.refreshToken);
        }
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      setUser(data.user || data.data.user);

      // Consistent token naming
      localStorage.setItem("user", JSON.stringify(data.user || data.data.user));
      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }

      toast({
        title: "Success",
        description: "Account created successfully",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("http://localhost:8000/api/v1/users/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      // Clear stored data
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      setUser(null);

      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
