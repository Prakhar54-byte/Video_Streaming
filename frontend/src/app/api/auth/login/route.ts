import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    // In a real app, this would call your actual backend API
    // For demo purposes, we'll simulate a successful login
    if (!username && !email) {
      return NextResponse.json({ message: "Username or email is required" }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 })
    }

    // Simulate successful login
    return NextResponse.json({
      user: {
        _id: "user_" + Math.random().toString(36).substring(2, 10),
        username: username || email.split("@")[0],
        email: email || `${username}@example.com`,
        fullName: "Demo User",
        avatar: "/placeholder.svg?height=200&width=200",
      },
      accessToken: "demo_access_token_" + Math.random().toString(36).substring(2, 10),
      refreshToken: "demo_refresh_token_" + Math.random().toString(36).substring(2, 10),
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Failed to login" }, { status: 500 })
  }
}

