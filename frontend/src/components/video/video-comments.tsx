"use client"

import { useState,useEffect  } from "react"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, ThumbsDown, MoreVertical } from "lucide-react"

import { Button } from "../ui/Button"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { useToast } from "@/hooks/useToast"
import { getVideoComments} from "@/lib/api/comments"
import { toggleCommentLike } from "@/lib/api/like"

interface VideoCommentsProps {
    videoId: string
}

export function VideoComments({videoId}:
    VideoCommentsProps
){
    const [comments, setComments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page,setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const { toast } = useToast()

    useEffect(()=>{
        const fetchomments = async ()=>{
            try {
                const response = await getVideoComments
(videoId, page)
const newComments = response.data


                if(page === 1){
                    setComments(newComments)
                }else{
                    setComments(prev => [...prev, ...newComments])
                }
            } catch (error) {
                console.error("Error fetching comments:", error)
                toast({
                    title: "Error",
                    description: "Failed to load comments. Please try again later.",
                    variant: "destructive"
                })
                
            }finally{
                setIsLoading(false)
            }
        }

        fetchomments()
    },[videoId, page, toast])
    
    
    const handleLikeComment = async (commentId: string) => {
        try {
            await toggleCommentLike(commentId)

            // Update the comment state optimistically
            setComments((prev)=>
                prev.map(comment => 
                    comment._id === commentId?{...comment,isLiked:!comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1} : comment
                ),
            )
        } catch (error) {
            console.error("Error liking comment:", error)
            toast({
                title: "Error",
                description: "Failed to like comment. Please try again later.",
                variant: "destructive"
            })
            
        }
    }

    const loadMoreComments = () => {
        if (hasMore && !isLoading) {
            setPage(prev => prev + 1)
        }
    }

    if(isLoading && comments.length === 0) {
        return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
    }
    if (!isLoading && comments.length === 0) {
    return <div className="text-center p-6">No comments yet. Be the first to comment!</div>
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment._id} className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={comment.owner?.avatar || "/placeholder.svg?height=40&width=40"}
              alt={comment.owner?.username || "User"}
            />
            <AvatarFallback>{comment.owner?.username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.owner?.username || "User"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 h-8 px-2 ${comment.isLiked ? "text-primary" : ""}`}
                onClick={() => handleLikeComment(comment._id)}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">{comment.likes || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                Reply
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMoreComments} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load more comments"}
          </Button>
        </div>
      )}
    </div>
  )
}