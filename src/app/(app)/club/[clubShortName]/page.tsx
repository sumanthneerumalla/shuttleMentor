import Link from "next/link";
import { notFound } from "next/navigation";
import { HomePage } from "../../page";
import { db } from "~/server/db";

/**
 * Club-specific landing page.
 *
 * This page renders the same content as the main landing page but passes the
 * clubShortName to enable automatic club assignment after Clerk authentication.
 *
 * Flow:
 * 1. User visits /club/{clubShortName} (or short URL /{clubShortName})
 * 2. SignIn/SignUp buttons include forceRedirectUrl="/profile?joinClub={clubShortName}"
 * 3. After Clerk auth, user is redirected to /profile with joinClub param
 * 4. Profile page reads param and calls updateProfile to set user's club
 *
 */
interface ClubPageProps {
	// since Next.js 15, dynamic route params are async and must be awaited.
	params: Promise<{ clubShortName: string }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
	const { clubShortName } = await params;

	const club = await db.club.findUnique({ where: { clubShortName }, select: { clubShortName: true } });
	if (!club) notFound();

	return (
		<>
			<div className="flex justify-end px-6 pt-4">
				<Link
					href={`/club/${clubShortName}/calendar`}
					className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
				>
					View Calendar
				</Link>
			</div>
			<HomePage clubShortName={clubShortName} />
		</>
	);
}
