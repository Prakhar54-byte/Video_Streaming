import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const videoFile = formData.get("videoFile") as File;
    const thumbnail = formData.get("thumbnail") as File;
    const channelId = formData.get("channelId") as string;
    const isPublished = formData.get("isPublished") === "true";

    if (!title || !videoFile || !channelId) {
      return NextResponse.json(
        { message: "Title, video file, and channel ID are required" },
        { status: 400 },
      );
    }

    // Create FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("title", title);
    backendFormData.append("description", description || "");
    backendFormData.append("videoFile", videoFile);
    backendFormData.append("channelId", channelId);

    if (thumbnail) {
      backendFormData.append("thumbnail", thumbnail);
    }

    // Send to backend video upload endpoint
    const response = await fetch("http://localhost:8000/api/v1/videos", {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Video upload failed" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // If video should be published, make additional request to publish it
    if (isPublished && data.data?._id) {
      try {
        await fetch(
          `http://localhost:8000/api/v1/videos/toggle/publish/${data.data._id}`,
          {
            method: "PATCH",
            headers: {
              Cookie: request.headers.get("cookie") || "",
              "Content-Type": "application/json",
            },
          },
        );
      } catch (publishError) {
        console.error("Error publishing video:", publishError);
        // Don't fail the upload if publishing fails
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
