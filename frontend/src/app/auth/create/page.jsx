"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"

export default function CreateChannelPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [channelData, setChannelData] = useState({
    name: "",
    description: "",
    email: "",
    image: null,
  })
  const [imagePreview, setImagePreview] = useState(null)

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setChannelData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setChannelData((prev) => ({
        ...prev,
        image: file,
      }))

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!channelData.name.trim()) {
      alert("Please enter a channel name")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would use FormData to handle file uploads
      const formData = new FormData()
      formData.append("name", channelData.name)
      formData.append("description", channelData.description)
      formData.append("email", channelData.email)
      if (channelData.image) {
        formData.append("image", channelData.image)
      }

      const response = await fetch("/api/channel/create", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (response.ok) {
        router.push("/channel/dashboard")
      } else {
        const data = await response.json()
        alert("Error creating channel: " + (data.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error creating channel:", error)
      alert("Error creating channel. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Create Your Channel</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Channel Information</CardTitle>
            <CardDescription>Set up your channel to start uploading videos and building your audience.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Avatar className="h-24 w-24">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt="Channel preview" />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {channelData.name ? channelData.name[0].toUpperCase() : "C"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-center">
                  <Label htmlFor="picture" className="text-center mb-2">
                    Channel Picture
                  </Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full max-w-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Channel Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={channelData.name}
                    onChange={handleInputChange}
                    placeholder="My Awesome Channel"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={channelData.email}
                    onChange={handleInputChange}
                    placeholder="channel@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Channel Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={channelData.description}
                    onChange={handleInputChange}
                    placeholder="Tell viewers about your channel..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

