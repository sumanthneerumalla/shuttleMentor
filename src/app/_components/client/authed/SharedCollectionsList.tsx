"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { 
  Video, 
  Calendar,
  User,
  Eye,
  Search,
  ChevronRight,
  AlertCircle
} from "lucide-react";

export default function SharedCollectionsList() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch shared collections
  const { data: collections, isLoading, error } = api.coachMediaCollection.getSharedWithMe.useQuery({
    limit: 100,
    offset: 0,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-gray-600">Loading shared collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h2 className="font-medium text-red-900 mb-1">Error loading shared collections</h2>
            <p className="text-red-700 text-sm">{error.message || "An unexpected error occurred. Please try refreshing the page."}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter collections based on search query
  const filteredCollections = collections?.filter(collection => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const coachName = `${collection.coach.firstName} ${collection.coach.lastName}`.toLowerCase();
    const displayUsername = collection.coach.coachProfile?.displayUsername?.toLowerCase() || "";
    const title = collection.title.toLowerCase();
    
    return (
      title.includes(query) ||
      coachName.includes(query) ||
      displayUsername.includes(query)
    );
  });

  // Calculate metrics
  const totalCollections = collections?.length || 0;
  const totalVideos = collections?.reduce((sum, col) => sum + col.media.length, 0) || 0;
  const uniqueCoaches = new Set(
    collections?.map(col => col.coach.userId)
  ).size;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shared Collections</p>
              <p className="text-2xl font-bold text-gray-900">{totalCollections}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{totalVideos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coaches</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueCoaches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Shared Instructional Collections</h2>
              <p className="text-gray-600 mt-1">Video collections shared with you by your coaches</p>
            </div>
            
            {/* Search Bar */}
            {collections && collections.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or coach..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-full sm:w-64"
                />
              </div>
            )}
          </div>
        </div>

        {!collections || collections.length === 0 ? (
          <div className="p-8 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No shared collections yet</p>
            <p className="text-gray-400 text-sm">
              Your coaches will share instructional video collections with you here
            </p>
          </div>
        ) : filteredCollections && filteredCollections.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No collections found</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCollections?.map((collection) => {
              const shareDate = collection.sharedWith[0]?.sharedAt;
              const coachDisplayName = collection.coach.coachProfile?.displayUsername || 
                                      `${collection.coach.firstName} ${collection.coach.lastName}`;
              const thumbnailUrl = collection.media[0]?.thumbnailUrl;
              
              return (
                <div 
                  key={collection.collectionId} 
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={collection.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {collection.title}
                          </h3>
                          
                          {collection.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {collection.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1.5 text-gray-400" />
                              <span className="font-medium text-gray-700">{coachDisplayName}</span>
                              {collection.coach.clubName && (
                                <span className="ml-1">• {collection.coach.clubName}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center">
                              <Video className="h-4 w-4 mr-1.5 text-gray-400" />
                              <span>{collection.media.length} video{collection.media.length !== 1 ? 's' : ''}</span>
                            </div>
                            
                            {shareDate && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                <span>Shared {new Date(shareDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View Button */}
                        <Link
                          href={`/coach-media-collections/${collection.collectionId}`}
                          className="flex-shrink-0 flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      {collections && collections.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Video className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">About Shared Collections</h3>
              <p className="text-sm text-blue-700">
                These instructional video collections have been shared with you by your coaches. 
                They contain technique demonstrations, training exercises, and educational content 
                to help improve your badminton skills.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
