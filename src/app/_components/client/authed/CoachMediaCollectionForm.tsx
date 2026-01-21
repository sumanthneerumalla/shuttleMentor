"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { MediaType, SharingType } from "@prisma/client";
import { PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "~/app/_components/shared/Button";
import StudentSelector from "~/app/_components/client/authed/StudentSelector";

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
  sharingTypes: SharingType[];  // Changed to array
  videos: VideoFormData[];
  selectedStudentIds: string[];
}

interface CoachMediaCollectionFormProps {
  collectionId?: string;
  initialData?: any;
}

export default function CoachMediaCollectionForm({ collectionId, initialData }: CoachMediaCollectionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const isEditMode = !!collectionId;
  
  // Get user profile to check permissions and ensure user exists in database
  const { data: user, isLoading: userLoading } = api.user.getOrCreateProfile.useQuery();
  
  // Redirect if not a coach, facility, or admin
  useEffect(() => {
    if (!userLoading && user && user.userType !== "COACH" && user.userType !== "ADMIN" && user.userType !== "FACILITY") {
      router.push("/home");
    }
  }, [user, userLoading, router]);
  
  // Initialize form with empty values
  const [formData, setFormData] = useState<CollectionFormData>({
    title: "",
    description: "",
    mediaType: MediaType.URL_VIDEO,
    sharingTypes: [],  // Start with empty array
    videos: [{ title: "", description: "", videoUrl: "" }],
    selectedStudentIds: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch club users (students and coaches) for sharing
  const { data: clubUsers, isLoading: usersLoading } = api.coachMediaCollection.getClubUsers.useQuery(
    {},
    {
      enabled: !userLoading && (user?.userType === "COACH" || user?.userType === "ADMIN" || user?.userType === "FACILITY"),
    }
  );
  
  // Create mutations
  const createCollection = api.coachMediaCollection.create.useMutation({
    onSuccess: (data) => {
      // After collection is created, add videos
      addVideosToCollection(data.collectionId);
    },
    onError: (error) => {
      setIsSubmitting(false);
      const errorMessage = error.message || "Failed to create collection. Please try again.";
      setErrors({ form: errorMessage });
    },
  });

  const updateCollection = api.coachMediaCollection.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to update dashboard
      utils.coachMediaCollection.getAll.invalidate();
      utils.coachMediaCollection.getById.invalidate();
      
      // Show success message briefly before navigating
      setSuccessMessage("Collection updated successfully!");
      setTimeout(() => {
        router.push(`/coach-media-collections/${collectionId}`);
      }, 1000);
    },
    onError: (error) => {
      setIsSubmitting(false);
      const errorMessage = error.message || "Failed to update collection. Please try again.";
      setErrors({ form: errorMessage });
    },
  });

  const updateSharingType = api.coachMediaCollection.updateSharingType.useMutation({
    onError: (error) => {
      setIsSubmitting(false);
      const errorMessage = error.message || "Failed to update sharing settings. Please try again.";
      setErrors({ form: errorMessage });
    },
  });
  
  const addMedia = api.coachMediaCollection.addMedia.useMutation({
    onError: (error) => {
      setIsSubmitting(false);
      const errorMessage = error.message || "Failed to add video. Please try again.";
      setErrors({ form: errorMessage });
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
      
      // Invalidate queries to update dashboard
      utils.coachMediaCollection.getAll.invalidate();
      
      // Navigate to the coach dashboard after all videos are added
      router.push("/coach-dashboard");
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to add videos to collection. Please try again.";
      setErrors({ form: errorMessage });
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

    // Only validate videos for create mode
    if (!isEditMode) {
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
    }
    
    // Validate sharing settings
    if (formData.sharingTypes.length === 0) {
      validationErrors.sharing = "Please select at least one sharing option";
    } else if (formData.sharingTypes.includes(SharingType.SPECIFIC_USERS) && formData.selectedStudentIds.length === 0) {
      validationErrors.sharing = "Please select at least one user for specific sharing";
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors and set submitting state
    setErrors({});
    setIsSubmitting(true);
    
    if (isEditMode) {
      // Update existing collection
      try {
        await updateCollection.mutateAsync({
          collectionId: collectionId!,
          title: formData.title,
          description: formData.description || undefined,
        });

        // Update sharing with all selected types
        await updateSharingType.mutateAsync({
          collectionId: collectionId!,
          sharingTypes: formData.sharingTypes,
          studentIds: formData.sharingTypes.includes(SharingType.SPECIFIC_USERS) 
            ? formData.selectedStudentIds 
            : undefined,
        });
      } catch (error) {
        // Error handling is done in mutation callbacks
      }
    } else {
      // Create the collection with all selected sharing types
      createCollection.mutate({
        title: formData.title,
        description: formData.description || undefined,
        mediaType: formData.mediaType,
        sharingTypes: formData.sharingTypes,
        initialStudentIds: formData.sharingTypes.includes(SharingType.SPECIFIC_USERS) 
          ? formData.selectedStudentIds 
          : undefined,
      });
    }
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

  // Handle sharing type change
  const handleSharingTypeChange = (sharingTypes: SharingType[]) => {
    setFormData({
      ...formData,
      sharingTypes,
    });

    // Clear sharing error if at least one sharing type is selected
    if (sharingTypes.length > 0 && errors.sharing) {
      const updatedErrors = { ...errors };
      delete updatedErrors.sharing;
      setErrors(updatedErrors);
    }
  };

  // Handle student selection change
  const handleStudentSelectionChange = (studentIds: string[]) => {
    setFormData({
      ...formData,
      selectedStudentIds: studentIds,
    });

    // Clear sharing error if any
    if (errors.sharing) {
      const updatedErrors = { ...errors };
      delete updatedErrors.sharing;
      setErrors(updatedErrors);
    }
  };
  
  // Check for URL parameters to prepopulate the form
  useEffect(() => {
    // If in edit mode, populate with initial data
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        mediaType: initialData.mediaType || MediaType.URL_VIDEO,
        sharingTypes: initialData.sharingType ? [initialData.sharingType] : [],
        videos: [], // Don't populate videos in edit mode
        selectedStudentIds: initialData.sharedWith?.map((share: any) => share.sharedWithId) || [],
      });
      return;
    }

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
        ...formData,
        title: ensureString(title),
        description: ensureString(description),
        videos: [initialVideo],
      });
    }
  }, [searchParams, isEditMode, initialData]);
  
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div>
          <h1 className="section-heading">
            {isEditMode ? "Edit Coach Media Collection" : "Create Coach Media Collection"}
          </h1>
          <p className="section-subheading mb-6">
            {isEditMode 
              ? "Update your instructional video collection details and sharing settings."
              : "Create instructional video collections to share with your students."
            }
          </p>
          
          {errors.form && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
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
            
            {/* Sharing Settings */}
            <div className="glass-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sharing Settings</h2>
              
              <StudentSelector
                students={clubUsers || []}
                selectedStudentIds={formData.selectedStudentIds}
                sharingType={formData.sharingTypes}
                onSharingTypeChange={handleSharingTypeChange}
                onStudentSelectionChange={handleStudentSelectionChange}
                isLoading={usersLoading}
                error={errors.sharing}
              />
            </div>
            
            {/* Videos - Only show in create mode */}
            {!isEditMode && (
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
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              {isEditMode && (
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || updateCollection.isPending || createCollection.isPending}
                size="lg"
                className={cn(
                  (isSubmitting || updateCollection.isPending || createCollection.isPending) 
                    ? "opacity-70 cursor-not-allowed" 
                    : "hover:bg-[var(--primary)]/90"
                )}
              >
                {(isSubmitting || updateCollection.isPending || createCollection.isPending)
                  ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </span>
                  ) 
                  : (isEditMode ? "Update Collection" : "Create Collection")
                }
              </Button>
            </div>
          </form>
        </div>
      </SignedIn>
    </>
  );
}
