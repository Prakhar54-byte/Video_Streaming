// import { NextRequest } from "next/server";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(request:NextRequest,{params}:{params:{playlistId:string;videoId:string}}){
    try {
        const { playlistId, videoId } = params;


      const response
    } catch (error) {
        console.error("Error deleting video from playlist:", error);
        return NextResponse.json({ error: "Failed to delete video from playlist" }, { status: 500 });
        
    }
}