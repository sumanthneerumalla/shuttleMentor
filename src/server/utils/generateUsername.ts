import { PrismaClient } from "@prisma/client";

/**
 * Generates a unique display username based on the user's first and last name
 * If the generated username already exists, it appends a random 3-digit number
 * 
 * @param user User object containing firstName and lastName, or the values directly
 * @param prisma Prisma client instance
 * @param isCoach Whether this is for a coach profile (true) or student profile (false)
 * @returns A unique display username
 */
export async function generateUniqueUsername(
  userOrName: { firstName?: string | null; lastName?: string | null } | string,
  prisma: PrismaClient,
  isCoach: boolean = true
): Promise<string> {
  // Handle string input (direct username)
  if (typeof userOrName === 'string') {
    const baseUsername = userOrName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    return await ensureUniqueUsername(baseUsername, prisma, isCoach);
  }
  
  // Handle user object
  const { firstName, lastName } = userOrName;
  const baseUsername = firstName || lastName 
    ? `${(firstName || "").toLowerCase()}${(lastName || "").toLowerCase()}`.replace(/[^a-z0-9]/g, "")
    : "user";
  
  return await ensureUniqueUsername(baseUsername, prisma, isCoach);
}

/**
 * Helper function to ensure a username is unique by adding a random number if needed
 */
async function ensureUniqueUsername(
  baseUsername: string,
  prisma: PrismaClient,
  isCoach: boolean
): Promise<string> {
  // Check if username already exists
  const exists = isCoach 
    ? await prisma.coachProfile.findUnique({ where: { displayUsername: baseUsername } })
    : await prisma.studentProfile.findUnique({ where: { displayUsername: baseUsername } });
  
  if (!exists) return baseUsername;
  
  // If username exists, append a random 3-digit number
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const uniqueUsername = `${baseUsername}${randomDigits}`;
  
  // Check if the new username is unique
  const newExists = isCoach 
    ? await prisma.coachProfile.findUnique({ where: { displayUsername: uniqueUsername } })
    : await prisma.studentProfile.findUnique({ where: { displayUsername: uniqueUsername } });
  
  // If still not unique, try again recursively
  return newExists ? ensureUniqueUsername(`${baseUsername}${Math.floor(Math.random() * 10)}`, prisma, isCoach) : uniqueUsername;
}
