"use client";

import { api } from "~/trpc/react";
import { useAuth } from "@clerk/nextjs";
import { UserType } from "@prisma/client";
import FacilityCoachCollectionsDashboard from "~/app/_components/client/authed/FacilityCoachCollectionsDashboard";
import StudentDashboard from "~/app/_components/client/authed/StudentDashboard";
import CoachDashboard from "~/app/_components/client/authed/CoachDashboard";

export default function Dashboard() {
  const { isSignedIn } = useAuth();
  const { data: user } = api.user.getOrCreateProfile.useQuery();

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Please sign in to access your dashboard.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin has access to coach dashboard view */}
      <CoachDashboard />
    </div>
  );

  const renderFacilityDashboard = () => (
    <div className="space-y-6">
      <FacilityCoachCollectionsDashboard />
    </div>
  );

  const getDashboardTitle = () => {
    switch (user.userType) {
      case UserType.COACH:
        return "Coach Dashboard";
      case UserType.ADMIN:
        return "Admin Dashboard";
      case UserType.FACILITY:
        return "Facility Dashboard";
      default:
        return "Student Dashboard";
    }
  };

  const getDashboardSubtitle = () => {
    switch (user.userType) {
      case UserType.COACH:
        return "Manage your students and provide coaching feedback";
      case UserType.ADMIN:
        return "Oversee platform operations and user management";
      case UserType.FACILITY:
        return "View coach collections and monitor instructional content in your club";
      default:
        return "Track your progress and manage your training";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getDashboardTitle()}</h1>
        <p className="text-gray-600">{getDashboardSubtitle()}</p>
      </div>

      {user.userType === UserType.STUDENT && <StudentDashboard />}
      {user.userType === UserType.COACH && <CoachDashboard />}
      {user.userType === UserType.ADMIN && renderAdminDashboard()}
      {user.userType === UserType.FACILITY && renderFacilityDashboard()}
    </div>
  );
}