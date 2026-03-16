"use client";

import { IlamyCalendar, IlamyResourceCalendar } from "@ilamy/calendar";
import type {
	BusinessHours,
	CalendarEvent as IlamyCalendarEvent,
	Resource,
} from "@ilamy/calendar";
import { keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Columns, LayoutGrid } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { RRule } from "rrule";
import "~/lib/dayjs-config";
import { CalendarEventBadge } from "~/app/_components/shared/CalendarEventBadge";
import { api } from "~/trpc/react";

// TODO(multi-facility): when ClubFacility schema lands, accept facilityId prop here
// and pass it to getPublicEvents/getPublicResources as a filter param.

const DEFAULT_COLOR = "#4F46E5";
const DEFAULT_BG_COLOR = "#EFF6FF";
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
	daysOfWeek: [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	],
	startTime: 9,
	endTime: 24,
};
const CALENDAR_HEADER_CLASSNAME =
	"rounded-t-xl border-b border-[var(--border)] bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm";
const CALENDAR_VIEW_HEADER_CLASSNAME = "bg-white/90 backdrop-blur-sm";
const CALENDAR_CLASSES_OVERRIDE = {
	disabledCell: "bg-slate-50/80 text-slate-400 pointer-events-none",
};

function parseRRule(rruleString: string) {
	const rule = RRule.fromString(rruleString);
	return rule.origOptions;
}

export interface PublicCalendarClientProps {
	clubShortName: string;
	initialView?: "month" | "week" | "day";
	initialMode?: "standard" | "resource";
	initialOrientation?: "horizontal" | "vertical";
	/** true = embed mode: zero chrome, full viewport, no mode toggle UI */
	embedMode?: boolean;
}

export default function PublicCalendarClient({
	clubShortName,
	initialView = "month",
	initialMode = "standard",
	initialOrientation = "horizontal",
	embedMode = false,
}: PublicCalendarClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const timezone = dayjs.tz.guess();

	const [currentDate, setCurrentDate] = useState(dayjs());
	const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
		initialView,
	);
	const [calendarMode, setCalendarMode] = useState<"standard" | "resource">(
		initialMode,
	);
	const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
		initialOrientation,
	);

	// Push view/mode/orientation changes back into the URL so the state is
	// shareable/bookmarkable. Uses replace (not push) to avoid polluting history.
	const syncUrl = useCallback(
		(
			updates: Partial<{
				view: string;
				mode: string;
				orientation: string;
			}>,
		) => {
			const params = new URLSearchParams(searchParams.toString());
			if (updates.view !== undefined) params.set("view", updates.view);
			if (updates.mode !== undefined) params.set("mode", updates.mode);
			if (updates.orientation !== undefined)
				params.set("orientation", updates.orientation);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// Compute fetch range with ±1 week buffer
	const viewRange = useMemo(() => {
		const effective = currentDate.tz(timezone);
		const unit =
			currentView === "month" ? "month" : currentView === "week" ? "week" : "day";
		return {
			startDate: effective.startOf(unit).subtract(1, "week").toDate(),
			endDate: effective.endOf(unit).add(1, "week").toDate(),
		};
	}, [currentDate, currentView, timezone]);

	const { data: eventsData, isLoading: eventsLoading } =
		api.calendar.getPublicEvents.useQuery(
			{
				clubShortName,
				startDate: viewRange.startDate,
				endDate: viewRange.endDate,
			},
			{ placeholderData: keepPreviousData },
		);

	const { data: resourcesData, isLoading: resourcesLoading } =
		api.calendar.getPublicResources.useQuery({ clubShortName });

	const resources: Resource[] = useMemo(() => {
		if (!resourcesData?.resources) return [];
		return resourcesData.resources.map((r) => ({
			id: r.resourceId,
			title: r.title,
			color: r.color ?? DEFAULT_COLOR,
			backgroundColor: r.backgroundColor ?? DEFAULT_BG_COLOR,
			position: r.position,
			businessHours:
				r.businessHours.length > 0
					? r.businessHours.map((bh) => ({
							daysOfWeek: bh.daysOfWeek,
							startTime: bh.startTime,
							endTime: bh.endTime,
						}))
					: DEFAULT_BUSINESS_HOURS,
		})) as Resource[];
	}, [resourcesData]);

	const events: IlamyCalendarEvent[] = useMemo(() => {
		if (!eventsData?.events) return [];
		return eventsData.events.map((e) => ({
			id: e.eventId,
			title: e.title,
			start: dayjs(e.start),
			end: dayjs(e.end),
			description: e.description ?? undefined,
			allDay: false,
			resourceId: e.resourceId ?? undefined,
			uid: e.uid,
			rrule: e.rrule ? parseRRule(e.rrule) : undefined,
			data: {
				dbEventId: e.eventId,
				eventType: e.eventType,
				maxParticipants: e.maxParticipants ?? null,
				currentRegistrations: e.currentRegistrations,
				priceInCents: e.priceInCents ?? null,
				coachName: e.coachName ?? null,
			},
		})) as IlamyCalendarEvent[];
	}, [eventsData]);

	const hasResources = resources.length > 0;
	const isLoading = eventsLoading || resourcesLoading;

	const commonProps = {
		businessHours: DEFAULT_BUSINESS_HOURS,
		classesOverride: CALENDAR_CLASSES_OVERRIDE,
		disableCellClick: true,
		disableDragAndDrop: true,
		disableEventClick: false,
		events,
		firstDayOfWeek: "monday" as const,
		headerClassName: CALENDAR_HEADER_CLASSNAME,
		hideNonBusinessHours: true,
		initialDate: currentDate,
		initialView: currentView,
		onDateChange: (date: dayjs.Dayjs) => setCurrentDate(date),
		onViewChange: (view: "month" | "week" | "day" | "year") => {
			if (view !== "year") {
				setCurrentView(view);
				syncUrl({ view });
			}
		},
		renderEvent: (e: IlamyCalendarEvent) => <CalendarEventBadge event={e} />,
		timeFormat: "12-hour" as const,
		timezone,
		viewHeaderClassName: CALENDAR_VIEW_HEADER_CLASSNAME,
		onEventClick: (e: IlamyCalendarEvent) => {
			const dbEventId = (e.data as Record<string, unknown> | undefined)
				?.dbEventId as string | undefined;
			if (dbEventId) router.push(`/events/${dbEventId}`);
		},
	};

	const containerClass = embedMode
		? "h-screen w-screen overflow-hidden"
		: "flex h-full flex-col";

	return (
		<div className={containerClass}>
			{/* Mode / orientation controls — hidden in embed mode */}
			{!embedMode && hasResources && (
				<div className="flex items-center justify-end gap-2 px-4 pt-3">
					<button
						onClick={() => {
							const next = calendarMode === "standard" ? "resource" : "standard";
							setCalendarMode(next);
							syncUrl({ mode: next });
						}}
						className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
					>
						{calendarMode === "resource" ? (
							<LayoutGrid size={16} />
						) : (
							<Columns size={16} />
						)}
						{calendarMode === "resource" ? "Standard View" : "Resource View"}
					</button>
					{calendarMode === "resource" && (
						<button
							onClick={() => {
								const next = orientation === "horizontal" ? "vertical" : "horizontal";
								setOrientation(next);
								syncUrl({ orientation: next });
							}}
							className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
						>
							{orientation === "horizontal" ? "Vertical Layout" : "Horizontal Layout"}
						</button>
					)}
				</div>
			)}

			<div className={embedMode ? "h-full w-full" : "flex-1 overflow-hidden p-4"}>
				<div
					className={
						embedMode
							? "h-full w-full"
							: "h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
					}
				>
					{isLoading ? (
						<div className="flex h-full items-center justify-center">
							<div className="animate-pulse space-y-4">
								<div className="h-8 w-48 rounded bg-gray-200" />
								<div className="h-96 w-full rounded bg-gray-200" />
							</div>
						</div>
					) : calendarMode === "resource" && hasResources ? (
						<IlamyResourceCalendar
							{...commonProps}
							key={`public-resource-${timezone}`}
							resources={resources}
							orientation={orientation}
						/>
					) : (
						<IlamyCalendar
							{...commonProps}
							key={`public-standard-${timezone}`}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
