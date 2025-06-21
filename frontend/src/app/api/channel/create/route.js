import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name")?.toString().trim()
    const description = formData.get("description")?.toString().trim()
    const avatar = formData.get("avatar")

    if (!name || !description) {
      return NextResponse.json({ message: "Name and description are required" }, { status: 400 })
    }

    const backendFormData = new FormData()
    backendFormData.append("name", name)
    backendFormData.append("description", description)
    if (avatar) {
      backendFormData.append("avatar", avatar)
    }

    const res = await fetch("http://localhost:8000/api/v1/channels/create", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: backendFormData,
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json({ message: errorData.message || "Failed to create channel" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ message: "Channel created successfully", channel: data.data }, { status: 201 })
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json({ message: "Failed to create channel" }, { status: 500 })
  }
}