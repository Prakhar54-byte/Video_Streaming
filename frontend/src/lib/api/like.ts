// API functions for likes

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface LikeResponse {
  statusCode: number;
  data: {
    isLiked: boolean;
    likeCount?: number;
  };
  message: string;
  success: boolean;
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFile: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  video: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tweet {
  _id: string;
  content: string;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LikedItemsResponse<T> {
  statusCode: number;
  data: T[];
  message: string;
  success: boolean;
}

// Toggle like/unlike for video
export const toggleVideoLike = async (
  videoId: string,
): Promise<LikeResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/likes/video/${videoId}/toggle`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling video like:", error);
    throw error;
  }
};

// Toggle like/unlike for comment
export const toggleCommentLike = async (
  commentId: string,
): Promise<LikeResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/likes/comment/${commentId}/toggle`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling comment like:", error);
    throw error;
  }
};

// Toggle like/unlike for tweet
export const toggleTweetLike = async (
  tweetId: string,
): Promise<LikeResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/likes/tweet/${tweetId}/toggle`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling tweet like:", error);
    throw error;
  }
};

// Get all liked videos for the logged-in user
export const getLikedVideos = async (): Promise<LikedItemsResponse<Video>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/likes/videos`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching liked videos:", error);
    throw error;
  }
};

// Get all liked comments for the logged-in user
export const getLikedComments = async (): Promise<
  LikedItemsResponse<Comment>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/likes/comments`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching liked comments:", error);
    throw error;
  }
};

// Get all liked tweets for the logged-in user
export const getLikedTweets = async (): Promise<LikedItemsResponse<Tweet>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/likes/tweets`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching liked tweets:", error);
    throw error;
  }
};

// Helper function for error handling
export const handleLikeError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Helper function to check if an item is liked (for optimistic updates)
export const updateLikeStatus = (currentLiked: boolean): boolean => {
  return !currentLiked;
};
