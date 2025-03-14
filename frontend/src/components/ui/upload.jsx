import { useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'

export default function UploadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">You need to be logged in to upload videos</h1>
        <button 
          onClick={() => router.push('/login')}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    )
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!videoFile) {
      setError('Please select a video file')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('video', videoFile)
    
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile)
    }
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/videos`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setProgress(percentCompleted)
          }
        }
      )
      
      router.push(`/video/${response.data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload video')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows="4"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Thumbnail (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full"
          />
        </div>
        
        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Uploading: {progress}%
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`bg-primary text-white px-4 py-2 rounded ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  )
}
