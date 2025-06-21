import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;
    // Create FormData for backend
    

    const response = await fetch("http://localhost:8000/api/v1/channels/create", {
      method: "POST",
      headers: {
        "Cookie": request.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name  ,
        description
      })
    });

    console.log("response in create channel:", response);
    

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Channel creation failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Channel creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}