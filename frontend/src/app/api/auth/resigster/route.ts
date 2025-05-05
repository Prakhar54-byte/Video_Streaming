import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, username, email, password } = await request.json();

    // Simulated registration logic
    console.log("Received register request:", { name, username, email });

    return NextResponse.json({
      success: true,
      message: "Registered successfully",
      data: { name, username, email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Failed to register" }, { status: 500 });
  }
}
