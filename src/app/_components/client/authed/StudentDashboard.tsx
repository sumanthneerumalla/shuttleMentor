"use client";

import { api } from "~/trpc/react";
import { Video, BookOpen, TrendingUp, Plus } from "lucide-react";
import StudentVideoCollectionsTable from "./StudentVideoCollectionsTable";
import SharedCollectionsList from "./SharedCollectionsList";

export default function StudentDashboard() {
  // Fetch student's own collections
  const { 
    data: studentCollections, 
    isLoading: collectionsLoading, 
    error: collectionsError 
  } = api.videoCollection.getAll.useQuery();
  
  // Fetch shared collections from coaches
  const { data: sharedCollections } = api.coachMediaCollection.getSharedWithMe.useQuery({
    limit: 100,
    offset: 0,
  });

  // Calculate metrics
  const myCollections = studentCollections?.length || 0;
  const myVideos = studentCollections?.reduce((total, collection) => {
    return total + (collection.media?.length || 0);
  }, 0) || 0;
  const sharedCollectionsCount = sharedCollections?.length || 0;
  const sharedVideosCount = sharedCollections?.reduce((sum, col) => sum + col.media.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Collections</p>
              <p className="text-2xl font-bold text-gray-900">
                {collectionsLoading ? "..." : collectionsError ? "Error" : myCollections}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Videos</p>
              <p className="text-2xl font-bold text-gray-900">
                {collectionsLoading ? "..." : collectionsError ? "Error" : myVideos}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Collections</p>
              <p className="text-2xl font-bold text-gray-900">{sharedCollectionsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Videos</p>
              <p className="text-2xl font-bold text-gray-900">{sharedVideosCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Video Collections */}
      <StudentVideoCollectionsTable 
        collections={studentCollections}
        isLoading={collectionsLoading}
        error={collectionsError}
      />

      {/* Shared Collections from Coaches */}
      <SharedCollectionsList />
    </div>
  );
}
