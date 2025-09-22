import { VideoLibraryGuard } from "~/app/_components/server/VideoLibraryGuard";
import VideoCollectionDisplay from "~/app/_components/client/authed/VideoCollectionDisplay";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";

interface VideoLibraryDetailPageProps {
  params: {
    collectionId: string;
  };
}

export default async function VideoLibraryDetailPage({ params }: VideoLibraryDetailPageProps) {
  // Get the collection ID from the URL
  const { collectionId } = params;
  
  // Get the user session for optional user type information
  const session = await auth();
  let userType = undefined;
  
  // If we have a session, get the user type
  if (session?.userId) {
    const user = await db.user.findUnique({
      where: { clerkUserId: session.userId },
    });
    
    if (user) {
      userType = user.userType;
    }
  }
  
  return (
    <>
      {/* Server-side guard to check permissions */}
      <VideoLibraryGuard collectionId={collectionId} />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-5xl mx-auto">
          <VideoCollectionDisplay collectionId={collectionId} userType={userType} />
        </div>
      </div>
    </>
  );
}
