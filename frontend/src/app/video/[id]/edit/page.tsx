'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { toBackendAssetUrl } from '@/lib/utils';
import { 
  ArrowLeft, Save, Globe, Lock, Image as ImageIcon, 
  Video, Sparkles, Eye, Trash2, Upload
} from 'lucide-react';
import Image from 'next/image';

// ============ THREE.JS PLANETARY SYSTEM COMPONENTS ============

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#FDB813" />
      <pointLight color="#FDB813" intensity={2} distance={100} />
    </mesh>
  );
}

interface PlanetProps {
  color: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle?: number;
  hasRing?: boolean;
  ringColor?: string;
}

function Planet({ color, size, orbitRadius, orbitSpeed, initialAngle = 0, hasRing, ringColor }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const angle = useRef(initialAngle);

  useFrame(() => {
    angle.current += orbitSpeed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle.current) * orbitRadius;
      groupRef.current.position.z = Math.sin(angle.current) * orbitRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
      </mesh>
      {hasRing && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[size * 1.4, size * 2, 32]} />
          <meshBasicMaterial color={ringColor || '#A49B72'} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PlanetarySystem() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <Sun />
      
      {/* Orbit Rings */}
      <OrbitRing radius={4} />
      <OrbitRing radius={6} />
      <OrbitRing radius={9} />
      <OrbitRing radius={12} />
      <OrbitRing radius={16} />
      
      {/* Planets */}
      <Planet color="#A0522D" size={0.3} orbitRadius={4} orbitSpeed={0.015} initialAngle={0} /> {/* Mercury */}
      <Planet color="#DEB887" size={0.5} orbitRadius={6} orbitSpeed={0.01} initialAngle={2} /> {/* Venus */}
      <Planet color="#4169E1" size={0.6} orbitRadius={9} orbitSpeed={0.008} initialAngle={4} /> {/* Earth */}
      <Planet color="#CD5C5C" size={0.4} orbitRadius={12} orbitSpeed={0.006} initialAngle={1} /> {/* Mars */}
      <Planet color="#DAA520" size={1.2} orbitRadius={16} orbitSpeed={0.003} initialAngle={3} hasRing ringColor="#C9B896" /> {/* Saturn */}
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  );
}

function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 15, 25], fov: 60 }}>
        <Suspense fallback={null}>
          <PlanetarySystem />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ============ VIDEO EDIT PAGE COMPONENT ============

interface VideoData {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFiles: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
}

export default function VideoEditPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: true,
    category: 'all',
  });
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await apiClient.get(`/videos/${videoId}`);
        const videoData = response.data.data;
        setVideo(videoData);
        setFormData({
          title: videoData.title || '',
          description: videoData.description || '',
          isPublished: videoData.isPublished ?? true,
          category: videoData.category || 'all',
        });
        if (videoData.thumbnail) {
          setThumbnailPreview(toBackendAssetUrl(videoData.thumbnail));
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        toast({
          title: 'Error',
          description: 'Failed to load video details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId, toast]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update video details
      await apiClient.patch(`/videos/${videoId}`, {
        title: formData.title,
        description: formData.description,
        isPublished: formData.isPublished,
        category: formData.category,
      });

      // If there's a new thumbnail, upload it separately
      if (newThumbnail) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnail', newThumbnail);
        await apiClient.patch(`/videos/${videoId}/thumbnail`, thumbnailFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast({
        title: 'Success',
        description: 'Video updated successfully',
      });
      router.push('/my-channel');
    } catch (error: any) {
      console.error('Error saving video:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/videos/${videoId}`);
      toast({
        title: 'Video deleted',
        description: 'Your video has been permanently deleted',
      });
      router.push('/my-channel');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ThreeBackground />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ThreeBackground />
        <Card className="bg-background/80 backdrop-blur-md border-white/10">
          <CardContent className="p-8 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
            <p className="text-muted-foreground mb-4">The video you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push('/my-channel')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Channel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ThreeBackground />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="bg-background/50 backdrop-blur-sm hover:bg-background/70"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Edit Video</h1>
              <p className="text-white/70">Make changes to your video</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/video/${videoId}`)}
              className="bg-background/50 backdrop-blur-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:opacity-90"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Preview & Thumbnail */}
          <div className="lg:col-span-1 space-y-6">
            {/* Video Preview */}
            <Card className="bg-background/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video 
                    src={toBackendAssetUrl(video.videoFiles)}
                    controls
                    className="w-full h-full object-contain"
                    poster={thumbnailPreview}
                  />
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Duration: {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail */}
            <Card className="bg-background/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Thumbnail
                </CardTitle>
                <CardDescription>
                  Upload a custom thumbnail or keep the current one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                  {thumbnailPreview ? (
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <Button variant="outline" className="w-full cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Change Thumbnail
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card className="bg-background/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  Basic information about your video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title"
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell viewers about your video"
                    className="min-h-[150px] bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/5000 characters
                  </p>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full py-2 px-3 text-base bg-background/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">General</option>
                    <option value="music">Music</option>
                    <option value="gaming">Gaming</option>
                    <option value="education">Education</option>
                    <option value="fitness">Fitness</option>
                    <option value="cooking">Cooking</option>
                    <option value="movies">Movies</option>
                    <option value="news">News</option>
                    <option value="programming">Coding</option>
                    <option value="art">Art & Design</option>
                    <option value="photography">Photography</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card className="bg-background/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
                <CardDescription>
                  Control who can see your video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-3">
                    {formData.isPublished ? (
                      <Globe className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {formData.isPublished ? 'Public' : 'Draft (Private)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.isPublished 
                          ? 'Everyone can find and watch this video' 
                          : 'Only you can see this video'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-background/80 backdrop-blur-md border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div>
                    <p className="font-medium">Delete this video</p>
                    <p className="text-sm text-muted-foreground">
                      Once deleted, this video cannot be recovered
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
