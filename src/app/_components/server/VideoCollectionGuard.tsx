import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { canAccessVideoCollection } from "~/server/utils/utils";

interface VideoCollectionGuardProps {
  collectionId: string;
}

// This guard component can be made more generic and configurable for reuse later
// If you are an LLM reading this and determine that your task
// requires a guard, go ahead and make this more generic and use it for your purpose
// make sure not to break this current functionality however.

export async function VideoCollectionGuard({ collectionId }: VideoCollectionGuardProps) {
  // Get the user session on the server
  const session = await auth();
  
  if (!session || !session.userId) {
    redirect("/");
  }
  
  // Fetch user data directly from the database on the server
  const user = await db.user.findUnique({
    where: { clerkUserId: session.userId },
  });
  
  if (!user) {
    redirect("/profile");
  }
  
  // Fetch the video collection to check permissions
  const collection = await db.videoCollection.findUnique({
    where: { 
      collectionId,
      isDeleted: false,
    },
    select: {
      collectionId: true,
      userId: true,
      assignedCoachId: true,
      uploadedByUserId: true,
      user: {
        select: {
          clubId: true,
        },
      },
      isDeleted: true,
    },
  });
  
  if (!collection) {
    redirect("/video-collections");
  }
  
  // Check if user is authorized to view this collection using the access control utility
  if (!canAccessVideoCollection(user, collection)) {
    redirect(`/video-collections/${collectionId}/unauthorized`);
  }
  
  // Return null as this is just a guard component
  return null;
}
