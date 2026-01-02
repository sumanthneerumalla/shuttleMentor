"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import SideNavigation from "~/app/_components/client/authed/SideNavigation";
import { NavBar } from "~/app/_components/client/public/NavBar";

interface AuthedLayoutProps {
  children: ReactNode;
}

export default function AuthedLayout({ children }: AuthedLayoutProps) {
  const pathname = usePathname();
  const { data: user, isLoading } = api.user.getOrCreateProfile.useQuery();
  
  // Check if we're on the landing page
  const isPublicPage = pathname === "/";
  
  return (
    <>
      <NavBar />
      {isPublicPage ? (
        // On public pages, just show content without sidebar
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        // On authenticated pages, show sidebar layout
        <div className="flex pt-16">
          {/* Side Navigation */}
          <div className="w-64 shrink-0 sticky top-0 h-[calc(100vh-4rem)] z-30 bg-white">
            <SideNavigation 
              user={user} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
