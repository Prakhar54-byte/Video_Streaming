// API functions for comments

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

export interface CommentResponse {
  statusCode: number;
  data: Comment[];
  message: string;
  success: boolean;
}

export interface SingleCommentResponse {
  statusCode: number;
  data: Comment;
  message: string;
  success: boolean;
}

// Get comments for a video
export const getVideoComments = async (videoId: string, page: number): Promise<CommentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}`, {
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
    console.error("Error fetching video comments:", error);
    throw error;
  }
};

// Create a new comment
export const addComment = async (
  videoId: string,
  content: string
): Promise<SingleCommentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Update a comment
export const updateComment = async (
  videoId: string,
  commentId: string,
  content: string
): Promise<SingleCommentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}/${commentId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (
  videoId: string,
  commentId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${videoId}/${commentId}`, {
      method: "DELETE",
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
    console.error("Error deleting comment:", error);
    throw error;
  }
};

// Helper function for error handling
export const handleCommentError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};