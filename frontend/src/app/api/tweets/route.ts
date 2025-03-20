import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Generate random tweets/messages
    const tweets = Array.from({ length: 10 }, (_, i) => ({
      _id: `tweet_${i + 1}`,
      content: `This is message ${i + 1} from the user. #videosharing #content`,
      owner: {
        _id: userId || `user_${Math.floor(Math.random() * 10) + 1}`,
        username: `user${Math.floor(Math.random() * 10) + 1}`,
        fullName: `User ${Math.floor(Math.random() * 10) + 1}`,
        avatar: `/placeholder.svg?height=40&width=40&text=U${Math.floor(Math.random() * 10) + 1}`,
      },
      likes: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
    }))

    return NextResponse.json({ tweets })
  } catch (error) {
    console.error("Error fetching tweets:", error)
    return NextResponse.json({ message: "Failed to fetch tweets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json({ message: "Content is required" }, { status: 400 })
    }

    // Simulate creating a tweet/message
    const tweet = {
      _id: `tweet_${Math.random().toString(36).substring(2, 10)}`,
      content,
      owner: {
        _id: "user_demo",
        username: "demo_user",
        fullName: "Demo User",
        avatar: "/placeholder.svg?height=40&width=40&text=U",
      },
      likes: 0,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ tweet })
  } catch (error) {
    console.error("Error creating tweet:", error)
    return NextResponse.json({ message: "Failed to create tweet" }, { status: 500 })
  }
}

