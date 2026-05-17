'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Redirect based on role
    if (userData.isAdmin) {
      router.push('/admin/dashboard');
    } else if (userData.isCreator) {
      router.push('/creator/dashboard');
    }
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <h1 className="text-4xl font-bold">Welcome, {user?.fullName || user?.username}</h1>
        <p className="text-white/60 mt-4">Redirecting to your dashboard...</p>
      </div>
    </ProtectedRoute>
  );
}