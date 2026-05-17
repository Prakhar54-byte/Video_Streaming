'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [statsRes, logsRes, usersRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { totalUsers: 0, totalVideos: 0, totalRevenue: 0 } })),
          
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/audit-logs?limit=20`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { logs: [] } })),
          
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { users: [] } }))
        ]);

        setStats(statsRes.data);
        setAuditLogs(logsRes.data.logs || []);
        setUsers(usersRes.data.users || []);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/users/${userId}/ban`,
        { reason: 'Admin action' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: true } : u));
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handlePromoteCreator = async (userId) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/users/${userId}/promote-creator`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u._id === userId ? { ...u, isCreator: true } : u));
    } catch (error) {
      alert('Failed to promote user');
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-white/60 mt-2">Manage users, content, and site settings</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32FF7E]"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥' },
                { label: 'Total Videos', value: stats?.totalVideos || 0, icon: '🎬' },
                { label: 'Total Revenue', value: `$${stats?.totalRevenue || 0}`, icon: '💰' },
                { label: 'Active Creators', value: stats?.activeCreators || 0, icon: '✨' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <span className="text-4xl">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
              {['overview', 'users', 'audit'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold capitalize transition ${
                    activeTab === tab
                      ? 'text-[#32FF7E] border-b-2 border-[#32FF7E]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-semibold">{log.action}</p>
                          <p className="text-white/60 text-sm">{log.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-8 h-8 rounded-full"
                              />
                              <span>{user.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-white/60">{user.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {user.isAdmin && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Admin</span>
                              )}
                              {user.isCreator && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">Creator</span>
                              )}
                              {user.isBanned && (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Banned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-white/60">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {!user.isCreator && !user.isAdmin && (
                                <button
                                  onClick={() => handlePromoteCreator(user._id)}
                                  className="px-3 py-1 bg-[#32FF7E]/20 text-[#32FF7E] text-xs rounded hover:bg-[#32FF7E]/30"
                                >
                                  Promote
                                </button>
                              )}
                              {!user.isBanned && (
                                <button
                                  onClick={() => handleBanUser(user._id)}
                                  className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30"
                                >
                                  Ban
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="text-sm py-2 border-b border-white/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{log.action}</p>
                          <p className="text-white/60">{log.description}</p>
                          <p className="text-white/40 text-xs mt-1">{log.ipAddress}</p>
                        </div>
                        <span className="text-white/40">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}