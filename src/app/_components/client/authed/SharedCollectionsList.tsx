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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shared Collections</p>
              <p className="text-2xl font-bold text-gray-900">{totalCollections}</p>
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
              <p className="text-gray-600 mt-1">Video collections shared with you by coaches and facility managers</p>
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
              Coaches and facility managers will share instructional video collections with you here
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Media Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCollections?.map((collection) => {
                  const shareDate = collection.sharedWith[0]?.sharedAt;
                  const coachDisplayName = collection.coach.coachProfile?.displayUsername || 
                                          `${collection.coach.firstName} ${collection.coach.lastName}`;
                  const creatorType = collection.coach.userType === "FACILITY" ? "Facility Manager" : "Coach";
                  const creatorBadgeColor = collection.coach.userType === "FACILITY" 
                    ? "bg-orange-100 text-orange-700" 
                    : "bg-purple-100 text-purple-700";
                  
                  return (
                    <tr key={collection.collectionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {coachDisplayName}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${creatorBadgeColor}`}>
                              {creatorType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {collection.title}
                        </div>
                        {collection.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {collection.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Video className="h-4 w-4 mr-1 text-gray-400" />
                          {collection.media.length} video{collection.media.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {shareDate ? new Date(shareDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/coach-media-collections/${collection.collectionId}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                These instructional video collections have been shared with you by coaches and facility managers. 
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
