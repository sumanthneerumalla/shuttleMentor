import { notFound } from "next/navigation";
import { Suspense } from "react";
import PublicCalendarClient from "~/app/_components/public/PublicCalendarClient";
import { db } from "~/server/db";

interface PublicCalendarPageProps {
	params: Promise<{ clubShortName: string }>;
	searchParams: Promise<{
		view?: string;
		mode?: string;
		orientation?: string;
	}>;
}

export default async function PublicCalendarPage({
	params,
	searchParams,
}: PublicCalendarPageProps) {
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
		<div className="flex h-screen flex-col pt-16">
			<Suspense fallback={<div className="flex h-full items-center justify-center"><div className="animate-pulse h-96 w-full rounded bg-gray-200" /></div>}>
				<PublicCalendarClient
					clubShortName={clubShortName}
					initialView={resolvedView}
					initialMode={resolvedMode}
					initialOrientation={resolvedOrientation}
					embedMode={false}
				/>
			</Suspense>
		</div>
	);
}
