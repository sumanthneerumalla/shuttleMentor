import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachDetail as CoachDetailComponent } from "../../_components/coaches/CoachDetail";
import { db } from "~/server/db";
import { binaryToBase64DataUrl } from "~/server/utils/utils";

// Define coach detail type for the page
type CoachDetail = {
  coachProfileId: string;
  displayUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  experience: string | null;
  specialties: string[];
  teachingStyles: string[];
  rate: number;
  isVerified: boolean;
  headerImage: string | null;
  profileImageUrl: string | null;
  createdAt: string;
};

// Server-side query to get coach data directly from the database
async function getCoach(username: string): Promise<CoachDetail | null> {
  try {
    // Try to find by displayUsername first, then by coachProfileId
    const coach = await db.coachProfile.findFirst({
      where: {
        OR: [
          { displayUsername: username },
          { coachProfileId: username }
        ]
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    if (!coach) return null;
    
    // Generate profile image URL if available
    let profileImageUrl = null;
    if (coach.profileImage) {
      profileImageUrl = binaryToBase64DataUrl(
        coach.profileImage,
        coach.profileImageType || 'image/png'
      );
    }
    
    // Transform coach for frontend
    return {
      coachProfileId: coach.coachProfileId,
      displayUsername: coach.displayUsername,
      firstName: coach.user.firstName,
      lastName: coach.user.lastName,
      bio: coach.bio,
      experience: coach.experience,
      specialties: coach.specialties,
      teachingStyles: coach.teachingStyles,
      rate: coach.rate,
      isVerified: coach.isVerified,
      headerImage: coach.headerImage,
      profileImageUrl,
      createdAt: coach.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching coach:", error);
    return null;
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { username: string } 
}): Promise<Metadata> {
  const coach = await getCoach(params.username);
  
  if (!coach) {
    return {
      title: "Coach Not Found | ShuttleMentor",
    };
  }
  
  const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim();
  
  return {
    title: `${fullName} | Badminton Coach | ShuttleMentor`,
    description: coach.bio || `Learn badminton from ${fullName}, a coach on ShuttleMentor`,
  };
}

export default async function CoachProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const coach = await getCoach(params.username);
  
  if (!coach) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <CoachDetailComponent coach={coach} />
      </div>
    </div>
  );
}
