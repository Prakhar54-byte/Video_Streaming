// Playlist API service for managing playlists

interface CreatePlaylistData {
  name: string;
  description?: string;
  videoId?: string[];
}

interface UpdatePlaylistData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

interface PlaylistFilters {
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

class PlaylistService {
  private baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/playlists`;

  private async makeRequest(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Unauthorized: No access token found");
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    return response.json();
  }
  // Create new playlist
  async createPlaylist(data: CreatePlaylistData) {
    return this.makeRequest("/playlist", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get user's playlists
  async getUserPlaylists(userId: string, filters: PlaylistFilters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    const url = `/playlist/user/${userId}${queryParams.toString() ? `?${queryParams}` : ""}`;
    return this.makeRequest(url);
  }

  // Get single playlist by ID
  async getPlaylistById(playlistId: string) {
    return this.makeRequest(`/playlist/${playlistId}`);
  }

  // Update playlist
  async updatePlaylist(playlistId: string, data: UpdatePlaylistData) {
    return this.makeRequest(`/playlist/${playlistId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Delete playlist
  async deletePlaylist(playlistId: string) {
    return this.makeRequest(`/playlist/${playlistId}`, {
      method: "DELETE",
    });
  }

  // Add video to playlist
  async addVideoToPlaylist(playlistId: string, videoId: string) {
    // PATCH /playlist/add/:videoId/:playlistId
    return this.makeRequest(`/playlist/add/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }

  // Remove video from playlist
  async removeVideoFromPlaylist(playlistId: string, videoId: string) {
    // PATCH /playlist/remove/:videoId/:playlistId
    return this.makeRequest(`/playlist/remove/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }
}

export const playlistService = new PlaylistService();

// Error handling utility
export class PlaylistError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "PlaylistError";
  }
}

// Response type helpers
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: {
    playlists: T[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}
