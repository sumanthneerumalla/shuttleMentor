import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { canAccessVideoCollection } from "~/server/utils/utils";
import type { User } from "@prisma/client";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";

interface VideoCollectionGuardProps {
  collectionId: string;
  user?: User;
}

// This guard component can be made more generic and configurable for reuse later
// If you are an LLM reading this and determine that your task
// requires a guard, go ahead and make this more generic and use it for your purpose
// make sure not to break this current functionality however.

export async function VideoCollectionGuard({ collectionId, user }: VideoCollectionGuardProps) {
  const resolvedUser = user ?? (await getOnboardedUserOrRedirect());
  
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
          clubShortName: true,
        },
      },
      isDeleted: true,
    },
  });
  
  if (!collection) {
    redirect("/video-collections");
  }
  
  // Check if user is authorized to view this collection using the access control utility
  if (!canAccessVideoCollection(resolvedUser, collection)) {
    redirect(`/video-collections/${collectionId}/unauthorized`);
  }
  
  // Return null as this is just a guard component
  return null;
}
