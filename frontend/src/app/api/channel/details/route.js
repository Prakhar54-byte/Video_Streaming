import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      "http://localhost:8000/api/v1/channels/user/me",
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ channels: [] }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({ channels: data.data || [] });
  } catch (error) {
    console.error("Error fetching channel details:", error);
    return NextResponse.json(
      { message: "Failed to fetch channel details" },
      { status: 500 },
    );
  }
}
