"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import CoachMediaCollectionForm from "~/app/_components/client/authed/CoachMediaCollectionForm";

export default function EditCoachMediaCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;

  const { 
    data: collection, 
    isLoading, 
    error 
  } = api.coachMediaCollection.getById.useQuery(
    { collectionId },
    { enabled: !!collectionId }
  );

  const { data: user } = api.user.getOrCreateProfile.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Error loading collection: {error.message}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Collection not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user is the owner, facility user from same club, or admin
  const isOwner = user?.userId === collection.coachId;
  const isAdmin = user?.userType === "ADMIN";
  const isFacilityInSameClub = user?.userType === "FACILITY" && user?.clubId === collection.coach.clubId;

  if (!isOwner && !isAdmin && !isFacilityInSameClub) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">You do not have permission to edit this collection</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Collection</h1>
        <CoachMediaCollectionForm 
          collectionId={collectionId}
          initialData={collection}
        />
      </div>
    </div>
  );
}
