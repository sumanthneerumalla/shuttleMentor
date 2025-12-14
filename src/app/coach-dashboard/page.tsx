"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoachDashboard() {
  const router = useRouter();
  
  // Redirect to the new unified dashboard
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}