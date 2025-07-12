import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { message: "Channel ID is required" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const avatar = formData.get("avatar");

    const backendFormData = new FormData();
    if (name) backendFormData.append("name", name);
    if (description) backendFormData.append("description", description);
    if (avatar) backendFormData.append("avatar", avatar);

    const response = await fetch(
      `http://localhost:8000/api/v1/channels/${channelId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: authHeader,
        },
        body: backendFormData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || "Failed to update channel" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      message: "Channel updated successfully",
      channel: data.data,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { message: "Failed to update channel" },
      { status: 500 },
    );
  }
}
