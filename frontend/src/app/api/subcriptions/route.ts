import { NextResponse } from "next/server"
// TODO : this folder also

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ message: "Channel ID is required" }, { status: 400 })
    }

    // Generate random subscribers
    const subscribers = Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
      _id: `user_${i + 1}`,
      username: `subscriber${i + 1}`,
      fullName: `Subscriber ${i + 1}`,
      avatar: `/placeholder.svg?height=40&width=40&text=S${i + 1}`,
    }))

    return NextResponse.json({ subscribers })
  } catch (error) {
    console.error("Error fetching subscribers:", error)
    return NextResponse.json({ message: "Failed to fetch subscribers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ message: "Channel ID is required" }, { status: 400 })
    }

    // Simulate toggling subscription
    const isSubscribed = Math.random() > 0.5

    return NextResponse.json({
      isSubscribed,
      message: isSubscribed ? "Successfully subscribed to channel" : "Successfully unsubscribed from channel",
    })
  } catch (error) {
    console.error("Error toggling subscription:", error)
    return NextResponse.json({ message: "Failed to toggle subscription" }, { status: 500 })
  }
}

