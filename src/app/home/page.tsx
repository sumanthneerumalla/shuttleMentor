"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function HomePage() {
  const router = useRouter();
  
  // Redirect to the new unified dashboard
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
