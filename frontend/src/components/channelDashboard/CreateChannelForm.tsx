"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/TextArea";
import { useToast } from "@/hooks/useToast";

export default function CreateChannelForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channelData, setChannelData] = useState({
    name: "",
    description: "",
    avatar: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChannelData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setChannelData((prev) => ({
        ...prev,
        avatar: file,
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!channelData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a channel name",
        variant: "destructive"
      });
      return;
    }


 

    setIsSubmitting(true);

    try {
      // Get token from storage
     
      

      const formData = new FormData();
      formData.append("name", channelData.name);
      formData.append("description", channelData.description);
      if (channelData.avatar) {
        formData.append("avatar", channelData.avatar);
      }
for (let pair of formData.entries()) {
  console.log(`${pair[0]}:`, pair[1]);
}
      
      const response = await fetch("http://localhost:8000/api/v1/channels/create", {
        method: "POST",
          credentials: "include",
        body: formData,
      });

      const data = await response.json();

      console.log("Response from channel creation:", data);
      

      if (response.ok) {
        toast({
          title: "Success",
          description: "Channel created successfully!",
        });
        router.push("/channelDashboard/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create channel",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating channel:", error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="container flex h-16 items-center px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 hover:bg-primary/10 transition-colors duration-200" 
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Create Your Channel</h1>
          </div>
        </header>

        <main className="container py-8 px-4 max-w-3xl mx-auto">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Channel Information</CardTitle>
              <CardDescription className="text-gray-600">
                Set up your channel to start uploading videos and building your audience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-gray-200 shadow-lg">
                      {imagePreview ? (
                        <AvatarImage src={imagePreview} alt="Channel preview" className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {channelData.name ? channelData.name[0].toUpperCase() : <User className="h-12 w-12" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 shadow-lg">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Label htmlFor="avatar" className="text-center mb-2 font-medium">
                      Channel Avatar
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full max-w-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Formats: JPG, PNG, GIF</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Channel Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={channelData.name}
                      onChange={handleInputChange}
                      placeholder="My Awesome Channel"
                      required
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>

                  

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Channel Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={channelData.description}
                      onChange={handleInputChange}
                      placeholder="Tell viewers about your channel. What kind of content will you create?"
                      rows={4}
                      className="border-gray-300 focus:border-primary focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      {channelData.description.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/")}
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-primary hover:bg-primary/90 text-white font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Channel"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}