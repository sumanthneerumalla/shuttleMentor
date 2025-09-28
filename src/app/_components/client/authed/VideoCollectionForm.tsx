"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { MediaType } from "@prisma/client";
import { PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "~/app/_components/shared/Button";

// Define strongly typed interfaces
interface VideoFormData {
  title: string;
  description: string;
  videoUrl: string;
}

interface CollectionFormData {
  title: string;
  description: string;
  mediaType: MediaType;
  videos: VideoFormData[];
}

export default function VideoCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get user profile to check permissions and ensure user exists in database
  const { data: user, isLoading: userLoading } = api.user.getOrCreateProfile.useQuery();
  
  // Redirect if not a student or admin
  useEffect(() => {
    if (!userLoading && user && user.userType !== "STUDENT" && user.userType !== "ADMIN") {
      router.push("/home");
    }
  }, [user, userLoading, router]);
  
  // Initialize form with empty values
  const [formData, setFormData] = useState<CollectionFormData>({
    title: "",
    description: "",
    mediaType: MediaType.URL_VIDEO,
    videos: [{ title: "", description: "", videoUrl: "" }],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create mutations
  const createCollection = api.videoCollection.create.useMutation({
    onSuccess: (data) => {
      // After collection is created, add videos
      addVideosToCollection(data.collectionId);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });
  
  const addMedia = api.videoCollection.addMedia.useMutation({
    onError: (error) => {
      setIsSubmitting(false);
      setErrors({ form: error.message });
    },
  });
  
  // Function to add videos to the collection
  const addVideosToCollection = async (collectionId: string) => {
    try {
      // Add each video sequentially
      for (const video of formData.videos) {
        if (video.title && video.videoUrl) {
          await addMedia.mutateAsync({
            collectionId,
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
          });
        }
      }
      
      // Navigate to the collection page after all videos are added
      router.push(`/video-collections/${collectionId}`);
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ form: "Error adding videos to collection" });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors: Record<string, string> = {};
    
    if (!formData.title) {
      validationErrors.title = "Collection title is required";
    }
    
    if (formData.videos.length === 0) {
      validationErrors.videos = "At least one video is required";
    } else {
      formData.videos.forEach((video, index) => {
        if (!video.title) {
          validationErrors[`video_${index}_title`] = "Video title is required";
        }
        if (!video.videoUrl) {
          validationErrors[`video_${index}_url`] = "Video URL is required";
        } else if (!isValidUrl(video.videoUrl)) {
          validationErrors[`video_${index}_url`] = "Please enter a valid URL";
        }
        
      });
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors and set submitting state
    setErrors({});
    setIsSubmitting(true);
    
    // Create the collection
    createCollection.mutate({
      title: formData.title,
      description: formData.description || undefined,
      mediaType: formData.mediaType,
    });
  };
  
  // Add a new video form
  const addVideoForm = () => {
    if (formData.videos.length >= 3) {
      setErrors({ videos: "URL video collections are limited to 3 videos" });
      return;
    }
    
    const newVideo: VideoFormData = { 
      title: "", 
      description: "", 
      videoUrl: "" 
    };
    
    setFormData({
      ...formData,
      videos: [...formData.videos, newVideo],
    });
  };
  
  // Remove a video form
  const removeVideoForm = (index: number) => {
    const updatedVideos = [...formData.videos];
    updatedVideos.splice(index, 1);
    
    setFormData({
      ...formData,
      videos: updatedVideos,
    });
  };
  
  // Update video form data
  const updateVideoForm = (index: number, field: keyof VideoFormData, value: string) => {
    const updatedVideos = [...formData.videos];
    const updatedVideo = { ...updatedVideos[index] };
    updatedVideo[field] = value;
    updatedVideos[index] = updatedVideo as VideoFormData;
    
    setFormData({
      ...formData,
      videos: updatedVideos,
    });
    
    // Clear related error if any
    if (errors[`video_${index}_${field}`]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[`video_${index}_${field}`];
      setErrors(updatedErrors);
    }
  };
  
  // Helper function to validate URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Helper function to ensure string values
  const ensureString = (value: string | null): string => {
    return value !== null ? value : "";
  };
  
  
  // Check for URL parameters to prepopulate the form
  useEffect(() => {
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    const videoTitle = searchParams.get("videoTitle");
    const videoUrl = searchParams.get("videoUrl");
    const videoDescription = searchParams.get("videoDescription");
    
    if (title || description || videoTitle || videoUrl || videoDescription) {
      // Create a properly typed video object
      const initialVideo: VideoFormData = {
        title: ensureString(videoTitle),
        description: ensureString(videoDescription),
        videoUrl: ensureString(videoUrl)
      };
      
      setFormData({
        title: ensureString(title),
        description: ensureString(description),
        mediaType: MediaType.URL_VIDEO,
        videos: [initialVideo],
      });
    }
  }, [searchParams]);
  
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="animate-slide-up">
      <h1 className="section-heading">Create New Video Collection</h1>
      <p className="section-subheading mb-6">
        Add up to 3 videos to your collection.
      </p>
      
      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>{errors.form}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Collection Details */}
        <div className="glass-panel rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Collection Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Collection Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) {
                    const updatedErrors = { ...errors };
                    delete updatedErrors.title;
                    setErrors(updatedErrors);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent",
                  errors.title ? "border-red-300" : "border-gray-300"
                )}
                placeholder="Enter collection title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Enter collection description"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        {/* Videos */}
        <div className="glass-panel rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Videos</h2>
            <Button
              type="button"
              onClick={addVideoForm}
              disabled={formData.videos.length >= 3}
              variant="outline"
              size="sm"
              className={cn(
                formData.videos.length >= 3
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/80"
              )}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Add Video
            </Button>
          </div>
          
          {errors.videos && (
            <p className="mb-4 text-sm text-red-600">{errors.videos}</p>
          )}
          
          <div className="space-y-6">
            {formData.videos.map((video, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Video {index + 1}</h3>
                  {formData.videos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideoForm(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideoForm(index, "title", e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent",
                        errors[`video_${index}_title`] ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="Enter video title"
                    />
                    {errors[`video_${index}_title`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`video_${index}_title`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={video.videoUrl}
                      onChange={(e) => updateVideoForm(index, "videoUrl", e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent",
                        errors[`video_${index}_url`] ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="https://example.com/video.mp4"
                    />
                    {errors[`video_${index}_url`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`video_${index}_url`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Description
                    </label>
                    <textarea
                      value={video.description}
                      onChange={(e) => updateVideoForm(index, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      placeholder="Enter video description"
                      rows={2}
                    />
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className={cn(
              isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[var(--primary)]/90"
            )}
          >
            {isSubmitting ? "Creating Collection..." : "Create Collection"}
          </Button>
        </div>
      </form>
        </div>
      </SignedIn>
    </>
  );
}
