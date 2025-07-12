import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api/v1";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string; videoId: string } },
) {
  try {
    const authorization = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/playlist/remove/${params.playlistId}/${params.videoId}`,
      {
        method: "DELETE",
        headers: {
          ...(authorization && { Authorization: authorization }),
        },
      },
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in remove video from playlist API route:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
