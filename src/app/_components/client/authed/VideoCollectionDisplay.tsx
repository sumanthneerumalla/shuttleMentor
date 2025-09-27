"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Play, Info, ExternalLink } from "lucide-react";
import { UserType } from "@prisma/client";

interface VideoCollectionDisplayProps {
  collectionId: string;
  userType?: UserType;
}

export default function VideoCollectionDisplay({ collectionId, userType }: VideoCollectionDisplayProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  
  // Fetch the video collection and its media
  const { data: collection, isLoading, error } = api.videoCollection.getById.useQuery({ collectionId });
  
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
          <div className="lg:col-span-2">
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
          
          {/* Video list */}
          <div className="lg:col-span-1">
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
  );
}

// Helper function to convert video URLs to embed URLs
function getEmbedUrl(url: string): string {
  try {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = extractYouTubeId(url);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes("vimeo.com")) {
      const vimeoId = url.split("/").pop();
      if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    // For other URLs, return as is (may not work as embed)
    return url;
  } catch (e) {
    return url;
  }
}

// Extract YouTube video ID from various YouTube URL formats
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}
