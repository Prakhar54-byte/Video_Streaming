"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card,CardContent } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { Avatar,AvatarFallback,AvatarImage   } from "../ui/Avatar"
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useAuth} from "@/hooks/userAuth"
import { useToast } from "@/hooks/useToast"
import { Play,MoreVertical,Edit,Trash2,Share2,Lock,Unlock,Clock,Eye } from "lucide-react" 



interface PlaylistCardProps{
    playlist:{
        id:string,
        title:string,
        description:string,
        thumbnail:string,
        isPrivate:boolean,
        videoCount:number,
        createdAt:string,
        totlalDuration:number,
        owner:{
            id:string,
            username:string,
            avatar:string
            channelName:string
        }
    }
    showOwner?:boolean
    onDelete?: (playlistId: string) => void
    onEdit?: (playlistId: string) => void
    layout?: "grid" | "list"
}



export function PlaylistCard({playlist,
    showOwner = true,
    onDelete,
    onEdit,
    layout = "grid"}: PlaylistCardProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading,setLoading] = useState(false)

    const isOwner = user?.id === playlist.owner.id

    const handleDelete = async(e:React.MouseEvent)=>{
        e.stopPropagation()
        e.preventDefault()
        if(!isOwner)return
        try {
            setLoading(true)

            const res = await fetch(`/api/playlists/${playlist.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${user?.accessToken}`}
            })

            onDelete?.(playlist.id)

            toast({
                title: "Success",
                description: "Playlist deleted successfully",
                variant: "success"
            })
        } catch (error) {
            console.error("Error deleting playlist:", error)
            toast({
                title: "Error",
                description: "Failed to delete playlist",
                variant: "destructive"
            })
            
        }finally {
            setLoading(false)
        }
    }


     const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.(playlist.id)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (layout === "list") {
    return (
      <Link href={`/playlist/${playlist.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-20 bg-muted rounded-lg overflow-hidden">
                  {playlist.thumbnail ? (
                    <img
                      src={playlist.thumbnail || "/placeholder.svg"}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs">
                  {playlist.videoCount}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.title}</h3>

                {showOwner && (
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={playlist.owner.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{playlist.owner.username[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{playlist.owner.channelName}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {playlist.videoCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(playlist.totlalDuration)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={!playlist.isPrivate ? "default" : "secondary"} className="text-xs">
                      {!playlist.isPrivate ? (
                        <>
                          <Unlock className="h-2 w-2 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-2 w-2 mr-1" />
                          Private
                        </>
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(playlist.createdAt)}</span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent>
                   
                      {isOwner && (
                        <>
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={loading}>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/playlist/${playlist.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="relative">
            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail || "/placeholder.svg"}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
              {playlist.videoCount} videos
            </div>
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={loading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{playlist.title}</h3>

            {showOwner && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={playlist.owner.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{playlist.owner.username[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{playlist.owner.channelName}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {playlist.videoCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(playlist.totlalDuration)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={!playlist.isPrivate ? "default" : "secondary"}>
                {!playlist.isPrivate ? (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatDate(playlist.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}