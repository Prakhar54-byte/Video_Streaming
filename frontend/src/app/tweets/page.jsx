"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquare, 
  Heart, 
  Share, 
  Repeat, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Send,
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/TextArea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown-menu'
import { useToast } from '@/hooks/useToast'

export default function TweetsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tweets, setTweets] = useState([])
  const [newTweet, setNewTweet] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTweets, setFilteredTweets] = useState([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userResponse = await fetch("http://localhost:8000/api/v1/users/current-user", {
          credentials: "include"
        })

        if (!userResponse.ok) {
          router.push("/auth/login")
          return
        }

        const userData = await userResponse.json()
        setUser(userData.data)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchTweets = async () => {
      if (!user) return

      try {
        const response = await fetch('http://localhost:8000/api/v1/tweets', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setTweets(data.data || [])
          setFilteredTweets(data.data || [])
        } else {
          throw new Error('Failed to fetch tweets')
        }
      } catch (error) {
        console.error('Error fetching tweets:', error)
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTweets()
  }, [user, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newTweet.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:8000/api/v1/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newTweet })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newTweetData = data.data
        setTweets([newTweetData, ...tweets])
        setFilteredTweets([newTweetData, ...filteredTweets])
        setNewTweet('')
        toast({
          title: "Success",
          description: "Message posted successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to post tweet')
      }
    } catch (error) {
      console.error('Error creating tweet:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to post message",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (tweetId, newContent) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tweets/${tweetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newContent })
      })

      if (response.ok) {
        const data = await response.json()
        setTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId ? { ...tweet, content: newContent, updatedAt: new Date().toISOString() } : tweet
          )
        )
        setFilteredTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId ? { ...tweet, content: newContent, updatedAt: new Date().toISOString() } : tweet
          )
        )
        setEditingTweet(null)
        setEditContent('')
        toast({
          title: "Success",
          description: "Message updated successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update tweet')
      }
    } catch (error) {
      console.error('Error updating tweet:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update message",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (tweetId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/tweets/${tweetId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setTweets(prevTweets => prevTweets.filter(tweet => tweet._id !== tweetId))
        setFilteredTweets(prevTweets => prevTweets.filter(tweet => tweet._id !== tweetId))
        toast({
          title: "Success",
          description: "Message deleted successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete tweet')
      }
    } catch (error) {
      console.error('Error deleting tweet:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      })
    }
  }

  const handleLike = async (tweetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/likes/toggle/t/${tweetId}`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId
              ? { ...tweet, likes: tweet.liked ? (tweet.likes || 0) - 1 : (tweet.likes || 0) + 1, liked: !tweet.liked }
              : tweet
          )
        )
        setFilteredTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId
              ? { ...tweet, likes: tweet.liked ? (tweet.likes || 0) - 1 : (tweet.likes || 0) + 1, liked: !tweet.liked }
              : tweet
          )
        )
      }
    } catch (error) {
      console.error('Error liking tweet:', error)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredTweets(tweets)
    } else {
      const filtered = tweets.filter(tweet =>
        tweet.content.toLowerCase().includes(query.toLowerCase()) ||
        tweet.owner.username.toLowerCase().includes(query.toLowerCase()) ||
        tweet.owner.fullName.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredTweets(filtered)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown time"

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 hover:bg-primary/10 transition-colors duration-200" 
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Messages
          </h1>
          <div className="ml-auto">
            <Badge variant="secondary" className="px-3 py-1">
              {filteredTweets.length} messages
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Create Tweet Form */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3">
                {user && (
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder="What's happening? Share your thoughts..."
                    className="resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-primary"
                    rows={3}
                    maxLength={280}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {newTweet.length}/280
                      </span>
                      {newTweet.length > 250 && (
                        <Badge variant="outline" className="text-xs">
                          {280 - newTweet.length} left
                        </Badge>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !newTweet.trim()}
                      className="rounded-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tweets List */}
        <div className="space-y-4">
          {filteredTweets.length > 0 ? (
            filteredTweets.map((tweet) => (
              <Card key={tweet._id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={tweet.owner?.avatar} alt={tweet.owner?.username} />
                      <AvatarFallback>{tweet.owner?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{tweet.owner?.fullName}</p>
                          <p className="text-sm text-muted-foreground">@{tweet.owner?.username}</p>
                          <p className="text-xs text-muted-foreground">• {formatTimeAgo(tweet.createdAt)}</p>
                          {tweet.updatedAt !== tweet.createdAt && (
                            <Badge variant="outline" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>
                        {tweet.owner?._id === user?._id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {
                                setEditingTweet(tweet._id)
                                setEditContent(tweet.content)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(tweet._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {editingTweet === tweet._id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="resize-none"
                            rows={3}
                            maxLength={280}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {editContent.length}/280
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdate(tweet._id, editContent)}
                                disabled={!editContent.trim()}
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingTweet(null)
                                  setEditContent("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap">{tweet.content}</p>
                      )}
                      
                      <div className="flex gap-6 mt-4">
                        <button className="text-muted-foreground hover:text-blue-500 text-sm flex items-center gap-1 transition-colors duration-200">
                          <MessageSquare className="h-4 w-4" /> {tweet.replies || 0}
                        </button>
                        
                        <button className="text-muted-foreground hover:text-green-500 text-sm flex items-center gap-1 transition-colors duration-200">
                          <Repeat className="h-4 w-4" /> {tweet.retweets || 0}
                        </button>
                        
                        <button
                          className={`text-sm flex items-center gap-1 transition-colors duration-200 ${tweet.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                          onClick={() => handleLike(tweet._id)}
                        >
                          <Heart className={`h-4 w-4 ${tweet.liked ? "fill-current" : ""}`} /> {tweet.likes || 0}
                        </button>
                        
                        <button className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1 transition-colors duration-200">
                          <Share className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "No messages found" : "No messages yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No messages match "${searchQuery}"`
                  : "Be the first to post a message!"
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => handleSearch("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}