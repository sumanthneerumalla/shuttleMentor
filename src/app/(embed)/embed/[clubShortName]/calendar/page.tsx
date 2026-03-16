import { notFound } from "next/navigation";
import PublicCalendarClient from "~/app/_components/public/PublicCalendarClient";
import { db } from "~/server/db";

interface EmbedCalendarPageProps {
	params: Promise<{ clubShortName: string }>;
	searchParams: Promise<{
		view?: string;
		mode?: string;
		orientation?: string;
	}>;
}

export default async function EmbedCalendarPage({
	params,
	searchParams,
}: EmbedCalendarPageProps) {
	const { clubShortName } = await params;
	const { view, mode, orientation } = await searchParams;

	const club = await db.club.findUnique({
		where: { clubShortName },
		select: { clubShortName: true },
	});
	if (!club) notFound();

	const resolvedView =
		view === "week" || view === "day" ? view : "month";
	const resolvedMode =
		mode === "resource" ? "resource" : "standard";
	const resolvedOrientation =
		orientation === "vertical" ? "vertical" : "horizontal";

	return (
		<PublicCalendarClient
			clubShortName={clubShortName}
			initialView={resolvedView}
			initialMode={resolvedMode}
			initialOrientation={resolvedOrientation}
			embedMode={true}
		/>
	);
}
