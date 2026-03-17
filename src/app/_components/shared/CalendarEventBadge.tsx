"use client";

import type { CalendarEvent as IlamyCalendarEvent } from "@ilamy/calendar";

interface EventData {
	eventType?: string;
	maxParticipants?: number | null;
	currentRegistrations?: number;
	priceInCents?: number | null;
}

interface CalendarEventBadgeProps {
	event: IlamyCalendarEvent;
}

export function CalendarEventBadge({ event }: CalendarEventBadgeProps) {
	const data = event.data as EventData | undefined;
	const eventType = data?.eventType;
	const maxParticipants = data?.maxParticipants ?? null;
	const currentRegistrations = data?.currentRegistrations ?? 0;
	const priceInCents = data?.priceInCents ?? null;

	const isFull =
		maxParticipants !== null && currentRegistrations >= maxParticipants;
	const showCapacity =
		(eventType === "BOOKABLE" || eventType === "COACHING_SLOT") &&
		maxParticipants !== null;
	const showPrice =
		(eventType === "BOOKABLE" || eventType === "COACHING_SLOT") &&
		priceInCents !== null;

	const formattedPrice =
		priceInCents !== null
			? new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: "USD",
					minimumFractionDigits: 0,
				}).format(priceInCents / 100)
			: null;

	return (
		<div className="flex h-full w-full flex-col justify-between overflow-hidden p-0.5">
			<span className="truncate font-medium text-xs leading-tight">
				{event.title}
			</span>
			{(showCapacity || showPrice) && (
				<div className="flex flex-wrap items-center gap-1">
					{showCapacity && (
						<span
							className={`rounded px-1 py-0.5 font-semibold text-[10px] leading-none ${
								isFull ? "bg-red-100 text-red-700" : "bg-white/40 text-current"
							}`}
						>
							{isFull ? "Full" : `${currentRegistrations}/${maxParticipants}`}
						</span>
					)}
					{showPrice && formattedPrice && (
						<span className="rounded bg-white/40 px-1 py-0.5 font-semibold text-[10px] text-current leading-none">
							{formattedPrice}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
