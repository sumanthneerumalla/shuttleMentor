"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Video, Calendar, Users, ArrowLeft, User, Edit, Trash2, Share2, AlertCircle } from "lucide-react";

interface CoachMediaCollectionDisplayProps {
  collectionId: string;
}

export default function CoachMediaCollectionDisplay({ collectionId }: CoachMediaCollectionDisplayProps) {
  const router = useRouter();
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { 
    data: collection, 
    isLoading, 
    error 
  } = api.coachMediaCollection.getById.useQuery(
    { collectionId },
    { enabled: !!collectionId }
  );

  const { data: user } = api.user.getOrCreateProfile.useQuery();

  const deleteCollectionMutation = api.coachMediaCollection.delete.useMutation({
    onSuccess: () => {
      router.push("/coach-dashboard");
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to delete collection. Please try again.";
      setDeleteError(errorMessage);
      setShowDeleteConfirm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h2 className="font-medium text-red-900 mb-1">Error loading collection</h2>
              <p className="text-red-700 text-sm">{error.message || "An unexpected error occurred."}</p>
              <button
                onClick={() => router.back()}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Collection not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const coachName = `${collection.coach.firstName ?? ''} ${collection.coach.lastName ?? ''}`.trim();
  const coachUsername = collection.coach.coachProfile?.displayUsername || 
                       `${(collection.coach.firstName ?? '').toLowerCase()}-${(collection.coach.lastName ?? '').toLowerCase()}`;
  const creatorType = collection.coach.userType === "FACILITY" ? "Facility Manager" : "Coach";
  const isFacilityUser = user?.userType === "FACILITY";
  const isFacilityInSameClub = isFacilityUser && user?.clubId === collection.coach.clubId;
  const isOwner = user?.userId === collection.coachId;
  const isAdmin = user?.userType === "ADMIN";
  const canManage = isOwner || isAdmin || isFacilityInSameClub;

  // Filter out deleted media
  const videos = collection.media?.filter((media) => !media.isDeleted) || [];
  const activeVideo = videos[activeVideoIndex];

  const handleDelete = () => {
    if (showDeleteConfirm) {
      setDeleteError(null);
      deleteCollectionMutation.mutate({ collectionId });
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </button>

      {/* Delete Error Message */}
      {deleteError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{deleteError}</span>
            <button
              onClick={() => setDeleteError(null)}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Collection Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-gray-600 mb-4">{collection.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{creatorType}: {coachName} (@{coachUsername})</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created: {new Date(collection.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-1" />
                <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {collection.sharingType === "ALL_STUDENTS" 
                    ? "Shared with all students" 
                    : collection.sharingType === "ALL_COACHES"
                    ? "Shared with all coaches"
                    : `Shared with ${collection.sharedWith?.length || 0} user${collection.sharedWith?.length !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Management Controls - For coaches, admins, and facility users in same club */}
          {canManage && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => router.push(`/coach-media-collections/${collectionId}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCollectionMutation.isPending}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showDeleteConfirm
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${deleteCollectionMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {deleteCollectionMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {showDeleteConfirm ? "Confirm Delete" : "Delete"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
            </div>
            
            {videos.length === 0 ? (
              <div className="p-8 text-center">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No videos in this collection yet</p>
              </div>
            ) : (
              <div className="p-6">
                {activeVideo && (
                  <div>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                      {activeVideo.videoUrl && (
                        <video
                          controls
                          className="w-full h-full"
                          src={activeVideo.videoUrl}
                          key={activeVideo.mediaId}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {activeVideo.title}
                    </h3>
                    {activeVideo.description && (
                      <p className="text-gray-600 mb-2">{activeVideo.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      Added: {new Date(activeVideo.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Video List */}
        <div className="lg:col-span-1">
          {videos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Videos in this collection
              </h3>
              <div className="space-y-2">
                {videos.map((video, index) => (
                  <button
                    key={video.mediaId}
                    onClick={() => setActiveVideoIndex(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeVideoIndex === index
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center ${
                        activeVideoIndex === index
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {video.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared With Section - Show for coaches, admins, and facility users */}
      {(canManage || isFacilityUser) && collection.sharedWith && collection.sharedWith.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Shared With</h2>
            {canManage && (
              <button
                onClick={() => router.push(`/coach-media-collections/${collectionId}/edit`)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Manage Sharing
              </button>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collection.sharedWith.map((share) => (
                <div
                  key={share.shareId}
                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0 bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {share.student.firstName} {share.student.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {share.student.studentProfile?.displayUsername 
                        ? `@${share.student.studentProfile.displayUsername}` 
                        : share.student.coachProfile?.displayUsername 
                        ? `@${share.student.coachProfile.displayUsername}`
                        : share.student.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
