import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api/v1"

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const authorization = request.headers.get("authorization")

    const response = await fetch(`${BACKEND_URL}/playlist/${params.playlistId}`, {
      method: "GET",
      headers: {
        ...(authorization && { Authorization: authorization }),
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in get playlist API route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const body = await request.json()
    const authorization = request.headers.get("authorization")

    const response = await fetch(`${BACKEND_URL}/playlist/${params.playlistId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in update playlist API route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const authorization = request.headers.get("authorization")

    const response = await fetch(`${BACKEND_URL}/playlist/${params.playlistId}`, {
      method: "DELETE",
      headers: {
        ...(authorization && { Authorization: authorization }),
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in delete playlist API route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authorization = request.headers.get("authorization")

    const response = await fetch(`${BACKEND_URL}/playlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in create playlist API route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}