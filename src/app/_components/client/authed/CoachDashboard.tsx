"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Users, Video } from "lucide-react";
import StudentMediaReviewTable from "./StudentMediaReviewTable";
import CoachCollectionDashboard from "./CoachCollectionDashboard";
import CoachingNoteModal from "./CoachingNoteModal";

export default function CoachDashboard() {
  const { 
    data: allMedia, 
    isLoading: mediaLoading, 
    error: mediaError 
  } = api.videoCollection.getAllMediaForCoaches.useQuery();
  
  const { 
    data: dashboardMetrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = api.user.getCoachDashboardMetrics.useQuery();

  const [selectedMedia, setSelectedMedia] = useState<{
    mediaId: string;
    mediaTitle: string;
    studentName: string;
    collectionTitle: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricsLoading ? "..." : metricsError ? "Error" : (dashboardMetrics?.studentCount ?? 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Media to Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {mediaLoading ? "..." : mediaError ? "Error" : (allMedia?.length || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Media</p>
              <p className="text-2xl font-bold text-gray-900">
                {mediaLoading ? "..." : mediaError ? "Error" : (allMedia?.length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Media Review Section */}
      <StudentMediaReviewTable 
        media={allMedia}
        isLoading={mediaLoading}
        error={mediaError}
        onManageNotes={(media) => setSelectedMedia(media)}
      />

      {/* Coach Collections Section */}
      <CoachCollectionDashboard />

      {/* Coaching Note Modal */}
      {selectedMedia && (
        <CoachingNoteModal
          mediaId={selectedMedia.mediaId}
          mediaTitle={selectedMedia.mediaTitle}
          studentName={selectedMedia.studentName}
          collectionTitle={selectedMedia.collectionTitle}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}
