"use client";

import { useState } from "react";
import { Video, MessageSquare, Calendar, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";

interface VideoCollection {
  collectionId: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  media?: Array<{
    mediaId: string;
    coachingNotes?: Array<{
      noteId: string;
    }>;
  }>;
}

interface StudentVideoCollectionsTableProps {
  collections?: VideoCollection[];
  isLoading: boolean;
  error: Error | null;
}

export default function StudentVideoCollectionsTable({ 
  collections, 
  isLoading, 
  error 
}: StudentVideoCollectionsTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const utils = api.useUtils();

  const deleteCollection = api.videoCollection.delete.useMutation({
    onSuccess: () => {
      // Invalidate and refetch collections
      utils.videoCollection.getAll.invalidate();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection. Please try again.");
      setDeleteConfirm(null);
    },
  });

  const handleDelete = (collectionId: string) => {
    if (deleteConfirm === collectionId) {
      deleteCollection.mutate({ collectionId });
    } else {
      setDeleteConfirm(collectionId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Video Collections</h2>
          <p className="text-gray-600 mt-1">Videos you've uploaded for coach review</p>
        </div>
        <a
          href="/video-collections/create"
          className="flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Video
        </a>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading your collections...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600">
          Error loading collections
        </div>
      ) : !collections || collections.length === 0 ? (
        <div className="p-8 text-center">
          <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No video collections yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Upload your first video to get feedback from your coaches
          </p>
          <a
            href="/video-collections/create"
            className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Your First Video
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos
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
              {collections.map((collection) => {
                const totalNotes = collection.media?.reduce((sum, media) => 
                  sum + (media.coachingNotes?.length || 0), 0
                ) || 0;
                
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
                      <div className="flex items-center text-sm text-gray-900">
                        <Video className="h-4 w-4 mr-1 text-gray-400" />
                        {collection.media?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                        {totalNotes}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(collection.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <a
                          href={`/video-collections/${collection.collectionId}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="View collection"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </a>
                        <a
                          href={`/video-collections/${collection.collectionId}/edit`}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Edit collection"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(collection.collectionId)}
                          disabled={deleteCollection.isPending}
                          className={`flex items-center ${
                            deleteConfirm === collection.collectionId
                              ? 'text-red-700 hover:text-red-900'
                              : 'text-red-600 hover:text-red-900'
                          } ${deleteCollection.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={deleteConfirm === collection.collectionId ? 'Click again to confirm' : 'Delete collection'}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleteConfirm === collection.collectionId ? 'Confirm' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
