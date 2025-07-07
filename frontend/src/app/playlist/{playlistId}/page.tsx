"use client"    

import { useState,useEffect } from "react"
import { useParams,useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/Card"
import { Avatar,AvatarFallback,AvatarImage   } from "@/components/ui/Avatar"
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger   } from "@/components/ui/dropdown-menu"
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger } from "@/components/ui/Dialog"
import {PlaylistEditor} from "@/components/playlist/PlaylistEditor"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState} from "@/components/common/EmptyState
import { useToast } from "@/hooks/useToast"
import { playlistService } from "@/services/playlist.service"
import { Play,Shuffle,Share2,MoreVertical,Edit,Trash2,Clock,Eye } from "lucide-react"



interface PlaylistOwner{
    _id:string,
    username:string,
    email:string,
    avatar?:string
}


interface VideoDetails {
    _id: string,
    title: string,
    thumbnail?: string,
    duration?: number,
    views?: number,
    createdAt: string,
}

interface Playlist{
    _id: string,
    title: string,
    description?: string,
    owner: PlaylistOwner,
    videos: VideoDetails[],
    createdAt: string,
    updatedAt: string,
    ownerDetails?: PlaylistOwner,
    videoDetails?: VideoDetails[],
}


export default function PlaylistForm() {
    
}