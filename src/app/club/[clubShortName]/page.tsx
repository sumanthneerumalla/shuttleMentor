import { HomePage } from "../../page";

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
	return <HomePage clubShortName={clubShortName} />;
}
