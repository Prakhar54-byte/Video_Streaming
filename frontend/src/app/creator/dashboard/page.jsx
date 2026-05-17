'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreatorDashboard() {
  const [creatorStats, setCreatorStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [statsRes, videosRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/creator/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { totalViews: 0, videoCount: 0, totalEarnings: 0, subscribers: 0 } })),
          
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/creator/videos`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { videos: [] } }))
        ]);

        setCreatorStats(statsRes.data);
        setVideos(videosRes.data.videos || []);
      } catch (error) {
        console.error('Failed to fetch creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/creator/videos/${videoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos(videos.filter(v => v._id !== videoId));
    } catch (error) {
      alert('Failed to delete video');
    }
  };

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Creator Studio</h1>
            <p className="text-white/60 mt-2">Manage your videos and earnings</p>
          </div>
          <a
            href="/creator/upload"
            className="px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition"
          >
            ➕ Upload Video
          </a>
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
                { label: 'Total Views', value: creatorStats?.totalViews || 0, icon: '👁️' },
                { label: 'Videos', value: creatorStats?.videoCount || 0, icon: '🎬' },
                { label: 'Earnings', value: `$${creatorStats?.totalEarnings || 0}`, icon: '💵' },
                { label: 'Subscribers', value: creatorStats?.subscribers || 0, icon: '👥' }
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
              {['videos', 'analytics', 'earnings'].map(tab => (
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

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {videos.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                    <p className="text-white/60 mb-4">No videos uploaded yet</p>
                    <a
                      href="/creator/upload"
                      className="inline-block px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition"
                    >
                      Upload Your First Video
                    </a>
                  </div>
                ) : (
                  videos.map((video) => (
                    <div
                      key={video._id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex gap-4 hover:bg-white/10 transition"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">{video.title}</h3>
                        <p className="text-white/60 text-sm mb-3">{video.description?.substring(0, 100)}...</p>
                        <div className="flex gap-6 text-sm text-white/60 mb-4">
                          <span>👁️ {video.views || 0} views</span>
                          <span>❤️ {video.likes || 0} likes</span>
                          <span>💬 {video.comments || 0} comments</span>
                        </div>
                        <p className="text-xs text-white/40">
                          Uploaded {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a
                          href={`/creator/videos/${video._id}/edit`}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDeleteVideo(video._id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Watch Time (Last 30 Days)</h3>
                  <div className="h-64 bg-white/5 rounded flex items-center justify-center text-white/40">
                    Chart placeholder (integrate Chart.js)
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Top Videos</h3>
                  <div className="space-y-3">
                    {videos.slice(0, 5).map((video, i) => (
                      <div key={video._id} className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-sm">{i + 1}. {video.title.substring(0, 30)}...</span>
                        <span className="text-[#32FF7E] font-bold">{video.views || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-6">Earnings Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'From Tips', amount: '$245.50' },
                    { label: 'From Paid Videos', amount: '$1,234.00' },
                    { label: 'This Month', amount: '$1,479.50' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/60 text-sm mb-2">{item.label}</p>
                      <p className="text-3xl font-bold text-[#32FF7E]">{item.amount}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <button className="px-6 py-3 bg-[#32FF7E]/20 text-[#32FF7E] font-bold rounded-lg hover:bg-[#32FF7E]/30">
                    Withdraw Earnings
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}