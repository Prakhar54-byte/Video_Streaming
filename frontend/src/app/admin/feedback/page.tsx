"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Star, Send, Mail, User, 
  Clock, CheckCircle, Archive, Eye, Trash2,
  BarChart3, AlertCircle, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackItem {
  _id: string;
  username: string;
  email: string;
  message: string;
  rating?: number;
  category: string;
  status: string;
  adminNotes: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageRating: number | null;
  total: number;
}

const ADMIN_KEY = "admin-secret-key-2026";

function AdminFeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("all");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({ title: "Access Denied", description: "Admin access required", variant: "destructive" });
      router.push("/");
    }
  }, [user, router, toast]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchFeedback();
      fetchStats();
    }
  }, [activeTab, pagination.page, filterStatus, user]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", "10");
      params.set("sort", "desc");
      if (filterStatus) params.set("status", filterStatus);

      const response = await apiClient.get(`/feedback/all?${params.toString()}`, {
        headers: { "x-admin-key": ADMIN_KEY }
      });
      
      setFeedbacks(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({ title: "Error", description: "Failed to load feedback", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/feedback/stats", {
        headers: { "x-admin-key": ADMIN_KEY }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/feedback/${id}/status`, 
        { status, adminNotes },
        { headers: { "x-admin-key": ADMIN_KEY } }
      );
      toast({ title: "Status updated" });
      fetchFeedback();
      fetchStats();
      setSelectedFeedback(null);
      setAdminNotes("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/feedback/${id}/read`, {}, {
        headers: { "x-admin-key": ADMIN_KEY }
      });
      fetchFeedback();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    
    try {
      await apiClient.delete(`/feedback/${id}`, {
        headers: { "x-admin-key": ADMIN_KEY }
      });
      toast({ title: "Feedback deleted" });
      fetchFeedback();
      fetchStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete feedback", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      new: "default",
      reviewed: "secondary",
      addressed: "outline",
      archived: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-500",
      bug: "bg-red-500",
      feature: "bg-green-500",
      improvement: "bg-yellow-500",
      content: "bg-purple-500",
      other: "bg-gray-500"
    };
    return colors[category] || "bg-gray-500";
  };

  if (isLoading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            Admin Feedback Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and respond to user feedback
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Feedback</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New</p>
                    <p className="text-2xl font-bold text-orange-500">{stats.byStatus?.new || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      {stats.averageRating || "N/A"}
                      {stats.averageRating && <Star className="w-4 h-4 text-yellow-500" />}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed</p>
                    <p className="text-2xl font-bold text-green-500">{stats.byStatus?.reviewed || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            className="px-3 py-2 border rounded-md bg-background"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="addressed">Addressed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="unread">Unread ({stats?.byStatus?.new || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No feedback found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <Card 
                    key={feedback._id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${!feedback.isRead ? "border-orange-500 border-2" : ""}`}
                    onClick={() => { setSelectedFeedback(feedback); setAdminNotes(feedback.adminNotes || ""); }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold">
                            {feedback.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{feedback.username}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {feedback.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs text-white ${getCategoryColor(feedback.category)}`}>
                            {feedback.category}
                          </span>
                          {getStatusBadge(feedback.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">{feedback.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {feedback.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" /> {feedback.rating}/5
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!feedback.isRead && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); markAsRead(feedback._id); }}>
                              <Eye className="w-4 h-4 mr-1" /> Mark Read
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteFeedback(feedback._id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button 
                  variant="outline" 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {pagination.page} of {pagination.pages}</span>
                <Button 
                  variant="outline"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Feedback Details</CardTitle>
                <CardDescription>
                  From {selectedFeedback.username} • {new Date(selectedFeedback.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback?.rating && (
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <p className="mt-1 flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < (selectedFeedback.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                        />
                      ))}
                      <span className="ml-2">{(selectedFeedback.rating || 0)}/5</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="mt-1">{selectedFeedback.category}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this feedback..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["new", "reviewed", "addressed", "archived"].map((status) => (
                      <Button
                        key={status}
                        variant={selectedFeedback.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(selectedFeedback._id, status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setSelectedFeedback(null); setAdminNotes(""); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminFeedbackContent />
    </Suspense>
  );
}