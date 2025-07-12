import { NextResponse } from "next/response";

export async function POST(request) {
  try {
    const body = await request.json();
    const formData = new FormData();

    // Add all fields to FormData
    formData.append("fullName", body.fullName);
    formData.append("username", body.username);
    formData.append("email", body.email);
    formData.append("password", body.password);
    formData.append("avatar", body.avatar);
    if (body.coverImage) {
      formData.append("coverImage", body.coverImage);
    }

    const response = await fetch(
      "http://localhost:8000/api/v1/users/register",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Registration failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
