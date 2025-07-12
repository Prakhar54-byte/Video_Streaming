import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();
    const channelId = formData.get("channelId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const avatar = formData.get("avatar") as File;
    const banner = formData.get("banner") as File;

    // Update channel basic info
    if (name || description) {
      const updateData = new FormData();
      if (name) updateData.append("name", name);
      if (description) updateData.append("description", description);

      const updateResponse = await fetch(
        `http://localhost:8000/api/v1/channels/${channelId}`,
        {
          method: "PATCH",
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
          body: updateData,
        },
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        return NextResponse.json(
          { message: error.message || "Channel update failed" },
          { status: updateResponse.status },
        );
      }
    }

    // Update avatar if provided
    if (avatar) {
      const avatarFormData = new FormData();
      avatarFormData.append("avatar", avatar);

      const avatarResponse = await fetch(
        `http://localhost:8000/api/v1/channels/${channelId}/avatar`,
        {
          method: "POST",
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
          body: avatarFormData,
        },
      );

      if (!avatarResponse.ok) {
        const error = await avatarResponse.json();
        return NextResponse.json(
          { message: error.message || "Avatar update failed" },
          { status: avatarResponse.status },
        );
      }
    }

    // Update banner if provided
    if (banner) {
      const bannerFormData = new FormData();
      bannerFormData.append("banner", banner);

      const bannerResponse = await fetch(
        `http://localhost:8000/api/v1/channels/${channelId}/banner`,
        {
          method: "POST",
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
          body: bannerFormData,
        },
      );

      if (!bannerResponse.ok) {
        const error = await bannerResponse.json();
        return NextResponse.json(
          { message: error.message || "Banner update failed" },
          { status: bannerResponse.status },
        );
      }
    }

    return NextResponse.json({ message: "Channel updated successfully" });
  } catch (error) {
    console.error("Channel settings update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { channelId } = await request.json();

    const response = await fetch(
      `http://localhost:8000/api/v1/channels/${channelId}`,
      {
        method: "DELETE",
        headers: {
          Cookie: request.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Channel deletion failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Channel deletion error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
