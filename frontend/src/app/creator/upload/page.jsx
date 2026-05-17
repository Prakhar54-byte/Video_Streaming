'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState } from 'react';
import axios from 'axios';

export default function VideoUploadPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'programming',
    isPublic: true
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
        setError('File size must be less than 2GB');
        return;
      }
      setFile(selectedFile);
      setError('');
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const submitData = new FormData();
      submitData.append('videoFile', file);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('tags', formData.tags);
      submitData.append('categories', formData.category);
      submitData.append('isPublished', formData.isPublic);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/videos`,
        submitData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
          }
        }
      );

      setSuccess('Video uploaded successfully! It will be available soon.');
      setFormData({ title: '', description: '', tags: '', category: 'programming', isPublic: true });
      setFile(null);
      setPreview(null);
      setProgress(0);

      // Redirect after 2 seconds
      setTimeout(() => window.location.href = '/creator/dashboard', 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Upload Video</h1>
          <p className="text-white/60 mb-8">Share your knowledge with the community</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* File Upload */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-8">
              <label htmlFor="video-file" className="block mb-4">
                <p className="text-lg font-bold mb-2">Video File *</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#32FF7E] transition cursor-pointer">
                  <input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="video-file" className="cursor-pointer block">
                    <p className="text-white/60 mb-2">
                      {file ? '✓ ' + file.name : '📁 Drag & drop or click to select'}
                    </p>
                    <p className="text-sm text-white/40">MP4, MKV, MOV (Max 2GB)</p>
                  </label>
                </div>
              </label>

              {preview && (
                <video src={preview} className="w-full max-h-96 rounded-lg mt-4" controls />
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-lg font-bold mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none text-white placeholder-white/40"
                placeholder="e.g., React Hooks Tutorial for Beginners"
                maxLength={100}
                required
              />
              <p className="text-xs text-white/40 mt-1">{formData.title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-lg font-bold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none text-white placeholder-white/40"
                placeholder="Describe what this video is about..."
                rows="4"
                maxLength={500}
              />
              <p className="text-xs text-white/40 mt-1">{formData.description.length}/500</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-lg font-bold mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none text-white placeholder-white/40"
                placeholder="e.g., react, hooks, javascript, tutorial"
              />
              <p className="text-xs text-white/40 mt-1">Separate with commas</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-lg font-bold mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[#32FF7E] focus:outline-none text-white"
              >
                <option value="programming">Programming</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="machine-learning">Machine Learning</option>
                <option value="devops">DevOps</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-semibold">Make this video public</span>
              </label>
              <p className="text-sm text-white/40 mt-2">
                {formData.isPublic ? 'Anyone can watch this video' : 'Only you can see this video'}
              </p>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#32FF7E] h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full px-6 py-3 bg-[#32FF7E] text-black font-bold rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {uploading ? `Uploading... ${progress}%` : 'Upload Video'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}