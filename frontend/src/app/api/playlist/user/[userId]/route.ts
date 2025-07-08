import { type NextRequest , NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080/api/v1";


export async function GET(request:NextRequest,{params}:{params:{userId:string}}){
    try {
        const { searchParams} = new URL (request.url)

        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const response = await fetch(
            `${BACKEND_URL}/playlist/user/${params.userId}`,{
                method:"GET",
                headers:{
                    ...(authorization && {
                        Authorization: authorization,
                    })
                }
            })


            const data  =  await response.json();



        if (!response.ok) {            return NextResponse.json(
                { message: data.message || "Failed to fetch playlist" },
                { status: response.status }
            );
        }

        return NextResponse.json(data,{
            status:response.status
        });
    } catch (error) {
        console.error("Error fetching playlist:", error);
        return NextResponse.json(
            { message: "Failed to fetch playlist" }, 
            { status: 500 }
        );
        
    }
}