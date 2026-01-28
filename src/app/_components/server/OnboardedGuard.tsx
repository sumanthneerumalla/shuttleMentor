import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOnboardedUser } from "~/lib/utils";
import { db } from "~/server/db";
import type { ReactNode } from "react";
import type { User } from "@prisma/client";

export async function getOnboardedUserOrRedirect({
  unauthenticatedRedirectTo = "/",
  incompleteProfileRedirectTo = "/profile",
}: {
  unauthenticatedRedirectTo?: string;
  incompleteProfileRedirectTo?: string;
} = {}): Promise<User> {
  const session = await auth();

  if (!session?.userId) {
    redirect(unauthenticatedRedirectTo);
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: session.userId },
  });

  if (!user || !isOnboardedUser(user)) {
    redirect(incompleteProfileRedirectTo);
  }

  return user;
}

export async function OnboardedGuard({
  children,
  unauthenticatedRedirectTo = "/",
  incompleteProfileRedirectTo = "/profile",
}: {
  children: ReactNode;
  unauthenticatedRedirectTo?: string;
  incompleteProfileRedirectTo?: string;
}) {
  await getOnboardedUserOrRedirect({
    unauthenticatedRedirectTo,
    incompleteProfileRedirectTo,
  });

  return <>{children}</>;
}
