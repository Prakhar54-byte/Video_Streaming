import { NextResponse } from "next/server";

export async function POST(req){
    try {
        const body =await req.josn()

        const response = await fetch("http://localhost:8000/api/v1/users/change-password",{
            method:"POST",
            headers:{
                "Content-Type":-
                "application/json"
            },
            body:JSON.stringify(body)
        })

    if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(
        { message: error.message || "Login failed" },
        { status: response.status }
);
    }

    const data = await response.json();
    return NextResponse.json(data);
} catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
{ message: "Internal server error" },
    { status: 500 }
    );
}
}