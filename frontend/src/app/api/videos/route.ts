import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("query") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortType = Number.parseInt(searchParams.get("sortType") || "-1");

    // Generate random videos
    const videos = Array.from({ length: 25 }, (_, i) => ({
      _id: `video_${i + 1}`,
      title: query ? `${query} Video ${i + 1}` : `Video Title ${i + 1}`,
      description: `This is the description for video ${i + 1}`,
      // thumbnail:`/images/thumb${(i%5)+1}.jpg`,
      duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
      views: Math.floor(Math.random() * 10000),
      owner: {
        _id: `user_${Math.floor(Math.random() * 10) + 1}`,
        username: `channel${Math.floor(Math.random() * 10) + 1}`,
        fullName: `Channel ${Math.floor(Math.random() * 10) + 1}`,
        avatar: `/placeholder.svg?height=40&width=40&text=C${Math.floor(Math.random() * 10) + 1}`,
      },
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }));

    return NextResponse.json({
      videos,
      totalVideos: 100,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { message: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
