import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, User } from 'lucide-react';

// Mock API function - replace with your actual API call
const fetchVideos = async ({ page = 1, limit = 12, query = '' }) => {
    // In a real app, you'd fetch from your backend API
    // e.g., const response = await fetch(`/api/v1/videos?page=${page}&limit=${limit}&query=${query}`);
    // const data = await response.json();
    // return data.data;

    // For now, here's some mock data to simulate the API response
    const allVideos = Array.from({ length: 50 }, (_, i) => ({
        _id: `video_${i + 1}`,
        thumbnail: `https://placehold.co/400x225/1a1a1a/ffffff?text=Video+${i + 1}`,
        title: `Video Title ${i + 1}: The Adventure Begins`,
        duration: Math.floor(Math.random() * 300) + 60,
        owner: {
            _id: `user_${i % 5 + 1}`,
            username: `Creator ${i % 5 + 1}`,
            avatar: `https://placehold.co/40x40/333/fff?text=C${i % 5 + 1}`,
        },
        views: Math.floor(Math.random() * 1000000),
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
    }));

    const filteredVideos = allVideos.filter(video => video.title.toLowerCase().includes(query.toLowerCase()));
    
    const startIndex = (page - 1) * limit;
    const paginatedVideos = filteredVideos.slice(startIndex, startIndex + limit);
    
    return {
        docs: paginatedVideos,
        hasNextPage: startIndex + limit < filteredVideos.length,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        totalPages: Math.ceil(filteredVideos.length / limit),
    };
};


const VideoCard = ({ video }) => {
    const formatViews = (views) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
        return `${views} views`;
    };

    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)} years ago`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)} months ago`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)} days ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)} hours ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)} minutes ago`;
        return `${Math.floor(seconds)} seconds ago`;
    };
    
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full">
            <a href={`/videos/${video._id}`} className="block group">
                <div className="relative mb-2">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                    </span>
                </div>
            </a>
            <div className="flex items-start">
                <a href={`/channel/${video.owner._id}`} className="mr-3 flex-shrink-0">
                    <img src={video.owner.avatar} alt={video.owner.username} className="w-9 h-9 rounded-full object-cover" />
                </a>
                <div className="flex-grow">
                    <a href={`/videos/${video._id}`} className="block">
                        <h3 className="text-white font-semibold text-base leading-tight group-hover:text-gray-300">{video.title}</h3>
                    </a>
                    <a href={`/channel/${video.owner._id}`} className="text-gray-400 text-sm hover:text-white">{video.owner.username}</a>
                    <p className="text-gray-400 text-sm">{formatViews(video.views)} &bull; {timeSince(video.createdAt)}</p>
                </div>
            </div>
        </div>
    );
};

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchVideos({ page, query: searchTerm });
            setVideos(data.docs);
            setPaginationInfo({
                hasNextPage: data.hasNextPage,
                hasPrevPage: data.hasPrevPage,
                totalPages: data.totalPages,
            });
        } catch (err) {
            setError('Failed to fetch videos. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 500); // Debounce search input
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    const handleNextPage = () => {
        if (paginationInfo.hasNextPage) {
            setPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (paginationInfo.hasPrevPage) {
            setPage(p => p - 1);
        }
    };

    return (
        <div className="bg-[#121212] min-h-screen text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-[#181818] border-b border-gray-800">
                <div className="text-2xl font-bold">StreamVerse</div>
                <div className="flex-1 max-w-2xl mx-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#202020] border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-full hover:bg-gray-700">
                        <Bell size={22} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-700">
                        <User size={22} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-6 py-8">
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="w-full animate-pulse">
                                <div className="w-full h-40 bg-gray-700 rounded-lg mb-2"></div>
                                <div className="flex items-start">
                                    <div className="w-9 h-9 rounded-full bg-gray-700 mr-3"></div>
                                    <div className="flex-grow space-y-2">
                                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-center text-red-500">{error}</p>}

                {!loading && !error && videos.length === 0 && (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold mb-2">No Videos Found</h2>
                        <p className="text-gray-400">Try adjusting your search or check back later.</p>
                    </div>
                )}

                {!loading && !error && videos.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {videos.map(video => (
                                <VideoCard key={video._id} video={video} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center mt-12 space-x-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={!paginationInfo.hasPrevPage || loading}
                                className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                            >
                                Previous
                            </button>
                            <span className="text-gray-400">Page {page} of {paginationInfo.totalPages}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={!paginationInfo.hasNextPage || loading}
                                className="px-4 py-2 bg-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HomePage;