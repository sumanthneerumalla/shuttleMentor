"use client";

import { CoachesListing } from "../_components/coaches/CoachesListing";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function CoachesPage() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Find a Coach</h1>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                {/* Filters will go here */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-lg font-semibold mb-4">Filters</h2>
                  <p className="text-gray-500 text-sm">Filter components coming soon</p>
                </div>
              </div>
              <div className="lg:col-span-3">
                <CoachesListing />
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
