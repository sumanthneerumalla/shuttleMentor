"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { getEmbedUrl } from "~/lib/videoUtils";
import { Play, Info, ExternalLink } from "lucide-react";
import { UserType } from "@prisma/client";
import CoachingNotesList from "./CoachingNotesList";
import CoachSelector from "./CoachSelector";

interface VideoCollectionDisplayProps {
  collectionId: string;
  userType?: UserType;
}

export default function VideoCollectionDisplay({ collectionId, userType }: VideoCollectionDisplayProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  
  // Fetch the video collection and its media
  const { data: collection, isLoading, error, refetch } = api.videoCollection.getById.useQuery({ collectionId });
  
  // Get user profile to determine permissions
  const { data: user } = api.user.getOrCreateProfile.useQuery();
  
  // Handle coach assignment updates
  const handleCoachAssigned = (coachId: string | null) => {
    // Refetch the collection to get updated coach assignment
    refetch();
  };
  
  // Check if current user is the collection owner
  const isOwner = user && collection && user.userId === collection.userId;

  const isAdminUser = user?.userType === UserType.ADMIN;
  const isFacilityUser = user?.userType === UserType.FACILITY;
  const isFacilitySameClub =
    isFacilityUser && user?.clubShortName != null && user.clubShortName === collection?.user?.clubShortName;

  const canAssignCoach = Boolean(user && collection) && (isOwner || isAdminUser || isFacilitySameClub);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse-slow">Loading collection...</div>
      </div>
    );
  }
  
  if (error || !collection) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h2 className="font-medium">Error loading collection</h2>
        <p>{error?.message || "Collection not found"}</p>
      </div>
    );
  }
  
  // Filter out deleted media
  const videos = collection.media.filter((media: any) => !media.isDeleted);
  
  if (videos.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h1 className="section-heading">{collection.title}</h1>
        {collection.description && (
          <p className="section-subheading mb-6">{collection.description}</p>
        )}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
          No videos available in this collection.
        </div>
      </div>
    );
  }
  
  // Make sure we have a valid active video
  const activeVideo = videos[activeVideoIndex] || videos[0];
  
  // If somehow we still don't have a valid video, show an error
  if (!activeVideo) {
    return (
      <div className="glass-panel p-6">
        <h1 className="section-heading">{collection.title}</h1>
        {collection.description && (
          <p className="section-subheading mb-6">{collection.description}</p>
        )}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          No valid video found in this collection.
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-slide-up">
      <div className="glass-panel p-6">
        <h1 className="section-heading">{collection.title}</h1>
        {collection.description && (
          <p className="section-subheading mb-6">{collection.description}</p>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main video player */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {activeVideo.videoUrl && (
                  <iframe
                    src={getEmbedUrl(activeVideo.videoUrl)}
                    className="w-full h-full"
                    title={activeVideo.title}
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                )}
              </div>
              
              <div className="mt-4">
                <h2 className="text-xl font-semibold">{activeVideo.title}</h2>
                {activeVideo.description && (
                  <p className="mt-2 text-gray-600">{activeVideo.description}</p>
                )}
                
                <div className="mt-4 flex items-center">
                  <a 
                    href={activeVideo.videoUrl || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-[var(--primary)] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in new tab
                  </a>
                </div>
              </div>
            </div>
            
            {/* Coaching Notes Section */}
            <div className="glass-panel p-6">
              <CoachingNotesList 
                mediaId={activeVideo.mediaId} 
                userType={user?.userType}
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Coach Selector */}
            {canAssignCoach && (
              <CoachSelector
                collectionId={collectionId}
                clubShortName={collection.user?.clubShortName}
                currentCoachId={collection.assignedCoachId}
                onCoachAssigned={handleCoachAssigned}
              />
            )}
            
            {/* Currently assigned coach display for non-owners */}
            {!canAssignCoach && collection.assignedCoach && (
              <div className="glass-panel p-4">
                <h3 className="font-medium text-gray-900 mb-3">Assigned Coach</h3>
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      {collection.assignedCoach.coachProfile?.displayUsername || 
                       `${collection.assignedCoach.firstName} ${collection.assignedCoach.lastName}`}
                    </p>
                    <p className="text-sm text-blue-700">{collection.assignedCoach.clubName}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Video list */}
            <div>
              <h3 className="font-medium mb-3">Videos in this collection</h3>
              <div className="space-y-3">
                {videos.map((video: any, index: number) => (
                  <div 
                    key={video.mediaId}
                    onClick={() => setActiveVideoIndex(index)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      activeVideoIndex === index 
                        ? "bg-[var(--primary-light)] border-[var(--primary)]" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                        {activeVideoIndex === index ? (
                          <Play className="w-4 h-4 fill-current" />
                        ) : (
                          <span className="font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 truncate">
                        <h4 className="font-medium text-sm">{video.title}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

