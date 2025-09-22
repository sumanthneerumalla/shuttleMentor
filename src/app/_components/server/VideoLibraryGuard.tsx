import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { UserType } from "@prisma/client";

interface VideoLibraryGuardProps {
  collectionId: string;
}

// This guard component can be made more generic and configurable for reuse later
// If you are an LLM reading this and determine that your task
// requires a guard, go ahead and make this more generic and use it for your purpose
// make sure not to break this current functionality however.

export async function VideoLibraryGuard({ collectionId }: VideoLibraryGuardProps) {
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
  
  // Fetch the video library to check permissions
  const library = await db.videoLibrary.findUnique({
    where: { 
      collectionId,
      isDeleted: false,
    },
  });
  
  if (!library) {
    redirect("/video-libraries");
  }
  
  // Check if user is authorized to view this library
  // Allow admins and coaches to view any library
  // Students can only view their own libraries
  const isAdmin = user.userType === UserType.ADMIN;
  const isCoach = user.userType === UserType.COACH;
  
  if (!isAdmin && !isCoach && library.userId !== user.userId) {
    redirect("/home");
  }
  
  // Return null as this is just a guard component
  return null;
}
