import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Old password and new password are required" },
        { status: 400 },
      );
    }

    // Make request to backend API
    const response = await fetch(
      "http://localhost:8000/api/v1/users/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "Failed to change password",
          error: data.error || "Password change failed",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Password changed successfully",
      data: data.data || {},
    });
  } catch (error) {
    console.error("Change password API error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
