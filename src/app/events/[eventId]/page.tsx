import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { isOnboardedUser } from "~/lib/utils";
import EventDetailClient from "~/app/events/[eventId]/EventDetailClient";

interface EventDetailPageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
	const { eventId } = await params;
	const session = await auth();

	let userType: string | null = null;
	let userId: string | null = null;

	if (session?.userId) {
		const user = await db.user.findUnique({ where: { clerkUserId: session.userId } });
		if (user && isOnboardedUser(user)) {
			userType = user.userType;
			userId = user.userId;
		}
	}

	return <EventDetailClient eventId={eventId} userType={userType ?? ""} userId={userId ?? ""} />;
}
