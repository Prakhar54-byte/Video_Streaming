import { NextResponse } from "next/server";
import API from "@app/api"


export async function POST(request:Request){

  try {
    const body = await request.json();

    const response = await API.post("api/v1/uses/login", body, )

    const data = response.data;
    
  } catch (error) {
    console.error("Login error:", error?.response?.data || error.message);
    return NextResponse.json(
      {
        message:error?.response?.data || error.message,
      },{
        status:  error?.response?.status || 500,
      }
    )
  }
}