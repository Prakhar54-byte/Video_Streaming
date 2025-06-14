// import { arEG } from "date-fns/locale";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust the path as necessary
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // In a real app, you would check the user's session and query the database
    // This is a mock implementation for demonstration purposes

    // Simulate a random response (50% chance of having a channel)

    const session =  await getServerSession(authOptions)

    if(!session || !session.user ){
      return NextResponse.json(
        {
          hasChannel: false,
          message: "User not authenticated",
        },
        { status: 401 }
      )
    }

    const userChannel = await prisma.channel.findUnique({
      where: {
        userId: session.user.id, // Assuming the session contains user ID
      },
    })
    const hasChannel = Boolean(userChannel)

    return NextResponse.json({
      hasChannel,
      message: hasChannel ? "Channel found" : "No channel found",
    });
  } catch (error) {
    console.error("Error checking channel:", error);
    return NextResponse.json(
      { message: "Failed to check channel" },
      { status: 500 }
    );
  }
}
