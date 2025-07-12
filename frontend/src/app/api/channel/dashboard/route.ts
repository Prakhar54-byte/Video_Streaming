import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get user's channels
    const channelsResponse = await fetch(
      "http://localhost:8000/api/v1/channels/user/me",
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!channelsResponse.ok) {
      const error = await channelsResponse.json();
      return NextResponse.json(
        { message: error.message || "Failed to fetch channels" },
        { status: channelsResponse.status },
      );
    }

    const channelsData = await channelsResponse.json();
    const channels = channelsData.data || [];

    // If no channels, return empty data
    if (channels.length === 0) {
      return NextResponse.json({
        channels: [],
        videos: [],
        analytics: {
          totalVideos: 0,
          totalViews: 0,
          totalSubscribers: 0,
          totalLikes: 0,
          totalComments: 0,
          watchTime: 0,
          revenue: 0,
          growth: {
            videos: 0,
            views: 0,
            subscribers: 0,
            likes: 0,
          },
        },
      });
    }

    // Get the first channel (or you can modify to handle multiple channels)
    const primaryChannel = channels[0];

    // Fetch videos for the channel
    const videosResponse = await fetch(
      `http://localhost:8000/api/v1/videos?channelId=${primaryChannel._id}&page=1&limit=50&sortBy=createdAt&sortType=-1`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
      },
    );

    let videos = [];
    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      videos = videosData.data.videos || [];
    }

    // Fetch subscribers for the channel
    const subscribersResponse = await fetch(
      `http://localhost:8000/api/v1/channels/${primaryChannel._id}/subscribers`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
      },
    );

    let subscribersCount = 0;
    if (subscribersResponse.ok) {
      const subscribersData = await subscribersResponse.json();
      subscribersCount = subscribersData.data?.length || 0;
    }

    // Calculate analytics
    const totalViews = videos.reduce(
      (sum: number, video: any) => sum + (video.views || 0),
      0,
    );
    const totalLikes = videos.reduce(
      (sum: number, video: any) => sum + (video.likes || 0),
      0,
    );
    const totalComments = videos.reduce(
      (sum: number, video: any) => sum + (video.comments || 0),
      0,
    );

    const analytics = {
      totalVideos: videos.length,
      totalViews,
      totalSubscribers: subscribersCount,
      totalLikes,
      totalComments,
      watchTime: Math.floor(Math.random() * 50000) + 10000, // Mock data
      revenue: Math.floor(Math.random() * 2000) + 500, // Mock data
      growth: {
        videos: Math.floor(Math.random() * 5) + 1,
        views: Math.floor(Math.random() * 20) + 5,
        subscribers: Math.floor(Math.random() * 15) + 3,
        likes: Math.floor(Math.random() * 25) + 5,
      },
    };

    return NextResponse.json({
      channels,
      primaryChannel,
      videos,
      analytics,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
