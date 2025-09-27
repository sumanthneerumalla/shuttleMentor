"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function HomePage() {
  const router = useRouter();
  
  // Fetch user profile
  const { data: user, isLoading } = api.user.getOrCreateProfile.useQuery();

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-5xl mx-auto">
              {isLoading ? (
                <div className="animate-pulse-slow">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="h-64 bg-gray-100 rounded mb-6"></div>
                </div>
              ) : user ? (
                <div className="animate-slide-up">
                  <h1 className="text-3xl font-bold mb-6">Welcome, {user.firstName || "Player"}!</h1>
                  <div className="glass-card rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
                    <p className="text-gray-600 mb-4">
                      This is your personal dashboard where you can access all your content and settings.
                    </p>
                    
                    {/* Content based on user type */}
                    {user.userType === "STUDENT" && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Your Learning Journey</h3>
                        <p className="text-gray-600">
                          Use the navigation menu to access your video libraries and other resources.
                        </p>
                      </div>
                    )}
                    
                    {user.userType === "COACH" && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Coach Dashboard</h3>
                        <p className="text-gray-600">
                          Welcome to your coaching dashboard. More features coming soon!
                        </p>
                      </div>
                    )}
                    
                    {user.userType === "FACILITY" && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Facility Dashboard</h3>
                        <p className="text-gray-600">
                          Welcome to your facility dashboard. More features coming soon!
                        </p>
                      </div>
                    )}
                    
                    {user.userType === "ADMIN" && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Admin Dashboard</h3>
                        <p className="text-gray-600">
                          Welcome to the admin dashboard. Use the navigation menu to access all platform features.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>Unable to load user profile. Please try again later.</p>
                </div>
              )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
