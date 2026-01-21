"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { 
  Video, 
  Users, 
  Edit, 
  Trash2, 
  Share2, 
  Plus,
  Eye,
  Calendar,
  Globe,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { SharingType } from "@prisma/client";

export default function CoachCollectionDashboard() {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Fetch coach collections
  const { data: collections, isLoading, error, refetch } = api.coachMediaCollection.getAll.useQuery();
  
  // Delete mutation
  const deleteMutation = api.coachMediaCollection.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteConfirm(null);
      setDeleteError(null);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to delete collection. Please try again.";
      setDeleteError(errorMessage);
      setDeleteConfirm(null);
    },
  });

  const handleDelete = async (collectionId: string) => {
    if (deleteConfirm === collectionId) {
      setDeleteError(null);
      await deleteMutation.mutateAsync({ collectionId });
    } else {
      setDeleteConfirm(collectionId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mb-4"></div>
          <p className="text-gray-600">Loading your collections...</p>
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
            <h2 className="font-medium text-red-900 mb-1">Error loading collections</h2>
            <p className="text-red-700 text-sm">{error.message || "An unexpected error occurred. Please try refreshing the page."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalCollections = collections?.length || 0;
  const totalMedia = collections?.reduce((sum, col) => sum + col.media.length, 0) || 0;
  const totalShares = collections?.reduce((sum, col) => sum + col.sharedWith.length, 0) || 0;
  const uniqueUsers = new Set(
    collections?.flatMap(col => col.sharedWith.map(share => share.sharedWithId))
  ).size;

  return (
    <div className="space-y-6">
      {/* Delete Error Message */}
      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Share2 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Shares</p>
              <p className="text-2xl font-bold text-gray-900">{totalShares}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Users Reached</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Coach Collections</h2>
            <p className="text-gray-600 mt-1">Manage and share instructional content with students and coaches</p>
          </div>
          <Link
            href="/coach-media-collections/create"
            className="flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Link>
        </div>

        {!collections || collections.length === 0 ? (
          <div className="p-8 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No collections yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Create your first instructional video collection to share with students and coaches
            </p>
            <Link
              href="/coach-media-collections/create"
              className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Link>
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
                    Sharing Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shared With
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
                {collections.map((collection) => (
                  <tr key={collection.collectionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-12 w-16 bg-gray-100 rounded overflow-hidden">
                          {collection.media[0]?.thumbnailUrl ? (
                            <img
                              src={collection.media[0].thumbnailUrl}
                              alt={collection.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Video className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {collection.title}
                          </div>
                          {collection.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {collection.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Video className="h-4 w-4 mr-1 text-gray-400" />
                        {collection.media.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {collection.sharingType === SharingType.ALL_STUDENTS ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="h-3 w-3 mr-1" />
                            All Students
                          </span>
                        ) : collection.sharingType === SharingType.ALL_COACHES ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Globe className="h-3 w-3 mr-1" />
                            All Coaches
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Specific Users
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {collection.sharedWith.length} user{collection.sharedWith.length !== 1 ? 's' : ''}
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
                        <Link
                          href={`/coach-media-collections/${collection.collectionId}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="View collection"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/coach-media-collections/${collection.collectionId}/edit`}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Edit collection"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(collection.collectionId)}
                          className={`flex items-center ${
                            deleteConfirm === collection.collectionId
                              ? 'text-red-700 hover:text-red-900'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={deleteConfirm === collection.collectionId ? 'Click again to confirm' : 'Delete collection'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
