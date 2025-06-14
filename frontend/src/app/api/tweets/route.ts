import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080/api/v1"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    // Get tweets from the backend
    const url = userId 
      ? `${BACKEND_URL}/tweets/user/${userId}` 
      : `${BACKEND_URL}/tweets`
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch tweets" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching tweets:", error)
    return NextResponse.json(
      { message: "Failed to fetch tweets" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      )
    }

    // Send the tweet to the backend API
    const response = await fetch(`${BACKEND_URL}/tweets`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { message: errorData.message || "Failed to create tweet" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating tweet:", error)
    return NextResponse.json(
      { message: "Failed to create tweet" }, 
      { status: 500 }
    )
  }
}