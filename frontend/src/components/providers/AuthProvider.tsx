"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check on auth pages to avoid redirect loops
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
        setLoading(false);
        return;
      }

      console.log("[AuthProvider] Checking authentication...");
      try {
        const response = await apiClient.get("/users/current-user");
        console.log("[AuthProvider] Auth check successful for user:", response.data.data.username);
        setUser(response.data.data);
        setAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setLoading, setAuthenticated]);

  return <>{children}</>;
}
