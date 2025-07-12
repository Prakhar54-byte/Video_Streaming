import { NextResponse } from "next/server";
import API from "@/app/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body.token; // You must pass the token from client if not using cookies

    const response = await API.post(
      "/api/v1/users/logout",
      {}, // No body typically needed for logout
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return NextResponse.json(response.data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Logout error:", error?.response?.data || error.message);
    return NextResponse.json(
      {
        message: error?.response?.data || error.message,
      },
      {
        status: error?.response?.status || 500,
      },
    );
  }
}
