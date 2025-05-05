import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch("http://localhost:8000/api/v1/users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Failed to login" }, { status: 500 });
  }
}
