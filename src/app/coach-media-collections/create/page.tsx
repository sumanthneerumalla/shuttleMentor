"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import CoachMediaCollectionForm from "~/app/_components/client/authed/CoachMediaCollectionForm";

export default function CreateCoachMediaCollectionPage() {
  const router = useRouter();
  const { data: user, isLoading } = api.user.getOrCreateProfile.useQuery();

  // Route guard: Only coaches, facility users, and admins can create collections
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.userType !== "COACH" && user.userType !== "ADMIN" && user.userType !== "FACILITY")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">You do not have permission to create coach collections.</p>
          <p className="text-gray-600 mb-4">Only coaches, facility managers, and administrators can create instructional collections.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <CoachMediaCollectionForm />
    </div>
  );
}
