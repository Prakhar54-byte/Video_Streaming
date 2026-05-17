'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Check role if required
    if (requiredRole === 'admin' && !user.isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (requiredRole === 'creator' && !user.isCreator) {
      router.push('/dashboard');
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0e14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E] mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? children : null;
};