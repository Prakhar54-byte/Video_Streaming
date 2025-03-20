import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real app, you would check the user's session and query the database
    // This is a mock implementation for demonstration purposes

    // Simulate a random response (50% chance of having a channel)
    const hasChannel = Math.random() > 0.5;

    return NextResponse.json({
      hasChannel,
      message: hasChannel ? "Channel found" : "No channel found",
    });
  } catch (error) {
    console.error("Error checking channel:", error);
    return NextResponse.json(
      { message: "Failed to check channel" },
      { status: 500 }
    );
  }
}
