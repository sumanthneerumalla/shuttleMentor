"use client";

import { Video } from "lucide-react";

interface MediaItem {
  mediaId: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  collectionId: string;
  collection: {
    title: string;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  };
  coachingNotes?: Array<{
    noteId: string;
    createdAt: Date;
  }>;
}

interface StudentMediaReviewTableProps {
  media?: MediaItem[];
  isLoading: boolean;
  error: Error | null;
  onManageNotes: (media: {
    mediaId: string;
    mediaTitle: string;
    studentName: string;
    collectionTitle: string;
  }) => void;
}

export default function StudentMediaReviewTable({ 
  media, 
  isLoading, 
  error,
  onManageNotes
}: StudentMediaReviewTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Student Media Review</h2>
        <p className="text-gray-600 mt-1">Review student videos and provide coaching feedback</p>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading student media...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600">
          Error loading student media
        </div>
      ) : !media || media.length === 0 ? (
        <div className="p-8 text-center">
          <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No student media available for review</p>
          <p className="text-gray-400 text-sm mt-2">Students need to upload videos to their collections first</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coaching Notes
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
              {media.map((mediaItem) => (
                <tr key={mediaItem.mediaId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {mediaItem.collection.user.firstName} {mediaItem.collection.user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mediaItem.collection.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mediaItem.title}</div>
                    {mediaItem.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {mediaItem.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mediaItem.coachingNotes?.length || 0} notes
                    </div>
                    {mediaItem.coachingNotes && mediaItem.coachingNotes.length > 0 && mediaItem.coachingNotes[0]?.createdAt && (
                      <div className="text-xs text-gray-500">
                        Latest: {new Date(mediaItem.coachingNotes[0].createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(mediaItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => window.open(`/video-collections/${mediaItem.collectionId}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Media
                    </button>
                    <button
                      onClick={() => {
                        onManageNotes({
                          mediaId: mediaItem.mediaId,
                          mediaTitle: mediaItem.title,
                          studentName: `${mediaItem.collection.user.firstName} ${mediaItem.collection.user.lastName}`,
                          collectionTitle: mediaItem.collection.title,
                        });
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Manage Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
