"use client";

import { api } from "~/trpc/react";
import { Video, Users, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FacilityCoachCollectionsDashboard() {
  const router = useRouter();
  const { 
    data: coachCollections, 
    isLoading, 
    error 
  } = api.coachMediaCollection.getFacilityCoachCollections.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-gray-600">Loading coach collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h2 className="font-medium text-red-900 mb-1">Error loading coach collections</h2>
            <p className="text-red-700 text-sm">{error.message || "An unexpected error occurred. Please try refreshing the page."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!coachCollections || coachCollections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No coach collections available</p>
          <p className="text-gray-400 text-sm mt-2">
            Coaches in your club haven't created any collections yet
          </p>
        </div>
      </div>
    );
  }

  const handleViewCollection = (collectionId: string) => {
    router.push(`/coach-media-collections/${collectionId}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Collections</p>
              <p className="text-2xl font-bold text-gray-900">
                {coachCollections.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">
                {coachCollections.reduce((total, collection) => {
                  return total + (collection.media?.length || 0);
                }, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Coaches</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(coachCollections.map(c => c.coachId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Coach Collections</h2>
          <p className="text-gray-600 mt-1">
            View all instructional collections created by coaches in your club
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sharing
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
              {coachCollections.map((collection) => {
                const coachName = `${collection.coach.firstName ?? ''} ${collection.coach.lastName ?? ''}`.trim();
                const coachUsername = collection.coach.coachProfile?.displayUsername || 
                                     `${(collection.coach.firstName ?? '').toLowerCase()}-${(collection.coach.lastName ?? '').toLowerCase()}`;
                const mediaCount = collection.media?.length || 0;
                const sharedCount = collection.sharedWith?.length || 0;
                const sharingTypeLabel = collection.sharingType === "ALL_STUDENTS" 
                  ? "All Students" 
                  : `${sharedCount} Student${sharedCount !== 1 ? 's' : ''}`;

                return (
                  <tr key={collection.collectionId} className="hover:bg-gray-50">
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
                      <div className="text-sm text-gray-900">{coachName}</div>
                      <div className="text-sm text-gray-500">@{coachUsername}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Video className="h-4 w-4 text-gray-400 mr-1" />
                        {mediaCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {sharingTypeLabel}
                        </span>
                      </div>
                      {collection.sharingType === "ALL_STUDENTS" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Auto-shared
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(collection.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewCollection(collection.collectionId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility User Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Facility Manager Access:</strong> As a facility user, you can view, create, edit, and manage 
              all coach collections in your club. You have full access to help coaches organize instructional content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
