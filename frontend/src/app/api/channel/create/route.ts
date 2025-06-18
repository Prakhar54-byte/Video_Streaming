import { NextResponse } from "next/server"
// TODO : check  whole channel folder 
export async function POST(request: Request) {
  try {
    // 1. Get the user from the session
    // 2. Parse the form data
    // 3. Upload the image to storage
    // 4. Create the channel in the database
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name  = formData.get("name")?.toString().trim()
    const description = formData.get("description")?.toString().trim()
    const avatar = formData.get("avatar") as File | null 
    const email = formData.get("email")?.toString().trim()

    const backendFormData = new FormData()
    backendFormData.append("name", name || "")
    backendFormData.append("description", description || "")
    backendFormData.append("email", email || "")
    if (avatar) {
      backendFormData.append("avatar", avatar)
    }

    const res = await fetch("http://localhost:8000/api/v1/subscriptions",{
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: backendFormData,
    })

    if(!res.ok) {
      const errorData = await res.json()
      return NextResponse.json({ message: errorData.message || "Failed to create channel" }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ message: "Channel created successfully", channel: data }, { status: 201 })
    // This is a mock implementation for demonstration purposes
    
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json({ message: "Failed to create channel" }, { status: 500 })
  }
}

