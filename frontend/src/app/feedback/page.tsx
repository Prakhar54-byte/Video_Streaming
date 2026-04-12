"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    message: "",
    rating: 0,
    category: "general"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast({ title: "Error", description: "Please enter your feedback message", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/feedback/submit", formData);
      
      toast({ 
        title: "Thank you!", 
        description: "Your feedback has been submitted successfully. We appreciate your input!" 
      });
      
      setFormData({ message: "", rating: 0, category: "general" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to submit feedback", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star 
              className={`w-8 h-8 ${star <= formData.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">We Value Your Feedback</CardTitle>
            <CardDescription className="text-base mt-2">
              This is the initial phase of the website. We are planning to make this as a platform for students who love YouTube viewing and coding with it. You can give us your opinion on this.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rating (Optional)</label>
                <div className="flex items-center gap-2">
                  {renderStars()}
                  {formData.rating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {formData.rating} out of 5
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Feedback</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  rows={6}
                  className="resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.message.length}/2000
                </p>
              </div>

              {isAuthenticated && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Submitting as: <span className="font-medium">{user?.username}</span>
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                disabled={loading || !formData.message.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Thank you for helping us improve!
        </p>
      </div>
    </div>
  );
}