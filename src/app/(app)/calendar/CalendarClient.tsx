"use client";

import { IlamyCalendar, IlamyResourceCalendar } from "@ilamy/calendar";
import type {
	BusinessHours,
	CellClickInfo,
	CalendarEvent as IlamyCalendarEvent,
	Resource,
} from "@ilamy/calendar";
import { keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Check, Clipboard, Columns, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { RRule } from "rrule";
import { api } from "~/trpc/react";
import "~/lib/dayjs-config";
import EventFormModal from "~/app/(app)/calendar/EventFormModal";
import { CalendarEventBadge } from "~/app/_components/shared/CalendarEventBadge";
import { ToastContainer, useToast } from "~/app/_components/shared/Toast";

// Default colors from globals.css design tokens
const DEFAULT_COLOR = "#4F46E5"; // --primary
const DEFAULT_BG_COLOR = "#EFF6FF"; // --accent
const DEFAULT_STANDARD_BUSINESS_HOURS = {
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
} satisfies BusinessHours;
const DEFAULT_RESOURCE_BUSINESS_HOURS = {
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
} satisfies BusinessHours;
// backdrop-blur-sm removed: CSS backdrop-filter creates a new stacking context that traps
// portalled dropdowns (DatePopover uses createPortal + z-index:9999 which is capped inside
// any ancestor that has a backdrop-filter applied).
const CALENDAR_HEADER_CLASSNAME =
	"rounded-t-xl border-b border-[var(--border)] bg-white px-3 py-2 shadow-sm";
const CALENDAR_VIEW_HEADER_CLASSNAME = "bg-white";
const CALENDAR_CLASSES_OVERRIDE = {
	disabledCell: "bg-slate-50/80 text-slate-400 pointer-events-none",
};

// Parse RRULE string into rrule.js options — defined outside component to avoid re-creation on every render
function parseRRule(rruleString: string) {
	const rule = RRule.fromString(rruleString);
	return rule.origOptions;
}

export default function CalendarClient() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialise from URL params so views/modes are bookmarkable
	const initialView = (() => {
		const v = searchParams.get("view");
		return v === "month" || v === "week" || v === "day" || v === "year"
			? v
			: "week";
	})();
	const initialMode =
		searchParams.get("mode") === "standard" ? "standard" : "resource";
	const initialOrientation =
		searchParams.get("orientation") === "vertical" ? "vertical" : "horizontal";

	const [currentDate, setCurrentDate] = useState(dayjs());
	const [currentView, setCurrentView] = useState<
		"month" | "week" | "day" | "year"
	>(initialView);
	// Staff can toggle between resource calendar and standard calendar
	const [calendarMode, setCalendarMode] = useState<"resource" | "standard">(
		initialMode,
	);
	const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
		initialOrientation,
	);
	// Embed copy button feedback state
	const [embedCopied, setEmbedCopied] = useState(false);

	// Fetch user profile
	const { data: user, isLoading: userLoading } =
		api.user.getOrCreateProfile.useQuery();

	// User timezone — derived early so viewRange can use it
	const userTimezone = user?.timeZone ?? dayjs.tz.guess();

	// Compute fetch range with ±1 week buffer, normalized to user timezone
	const viewRange = useMemo(() => {
		const effective = currentDate.tz(userTimezone);
		if (currentView === "year") {
			return {
				startDate: effective.startOf("year").subtract(1, "week").toDate(),
				endDate: effective.endOf("year").add(1, "week").toDate(),
			};
		}
		const unit =
			currentView === "month"
				? "month"
				: currentView === "week"
					? "week"
					: "day";
		return {
			startDate: effective.startOf(unit).subtract(1, "week").toDate(),
			endDate: effective.endOf(unit).add(1, "week").toDate(),
		};
	}, [currentDate, currentView, userTimezone]);

	// Fetch resources
	const { data: resourcesData, isLoading: resourcesLoading } =
		api.calendar.getResources.useQuery({});

	// Fetch events — gated on profile load so timezone is known before the first range is computed
	const { data: eventsData, isLoading: eventsLoading } =
		api.calendar.getEvents.useQuery(
			{
				startDate: viewRange.startDate,
				endDate: viewRange.endDate,
			},
			{
				placeholderData: keepPreviousData,
				enabled: !userLoading,
			},
		);

	// Mutations
	const utils = api.useUtils();
	const { toasts, toast, dismiss } = useToast();

	const createEventMutation = api.calendar.createEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});
	const updateEventMutation = api.calendar.updateEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});
	const deleteEventMutation = api.calendar.deleteEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});

	// Role flags
	const isStudent = user?.userType === "STUDENT";
	const isCoach = user?.userType === "COACH";
	const isFacilityOrAdmin =
		user?.userType === "FACILITY" || user?.userType === "ADMIN";
	const canCreateEvents = isCoach || isFacilityOrAdmin;

	// Transform DB resources → ilamy Resource[]
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
					: DEFAULT_RESOURCE_BUSINESS_HOURS,
		})) as Resource[];
	}, [resourcesData]);

	// Transform DB events → ilamy CalendarEvent[]
	const events: IlamyCalendarEvent[] = useMemo(() => {
		if (!eventsData?.events) return [];

		return eventsData.events.map((e) => ({
			id: e.eventId,
			title: e.title,
			start: dayjs(e.start),
			end: dayjs(e.end),
			description: e.description ?? undefined,
			color: e.color ?? undefined,
			backgroundColor: e.backgroundColor ?? undefined,
			allDay: e.allDay,
			resourceId: e.resourceId ?? undefined,
			uid: e.uid,
			rrule: e.rrule ? parseRRule(e.rrule) : undefined,
			exdates: e.exdates?.map((d) => d.toISOString()) ?? [],
			recurrenceId: e.recurrenceId ?? undefined,
			// Store DB metadata in data bag
			data: {
				dbEventId: e.eventId,
				eventType: e.eventType,
				isBlocking: e.isBlocking,
				isPublic: e.isPublic,
				maxParticipants: e.maxParticipants ?? null,
				currentRegistrations: e._count?.registrations ?? 0,
				priceInCents: e.product?.priceInCents ?? null,
				productId: e.productId ?? null,
				coachName: e.createdByUser?.firstName ?? null,
			},
		})) as IlamyCalendarEvent[];
	}, [eventsData]);

	// Event lifecycle handlers
	const handleEventUpdate = async (event: IlamyCalendarEvent) => {
		const dbEventId = (event.data?.dbEventId as string) ?? event.id;

		// Convert local times to UTC
		const startUtc = event.start.toDate();
		const endUtc = event.end.toDate();

		await updateEventMutation.mutateAsync({
			eventId: dbEventId,
			title: event.title,
			start: startUtc,
			end: endUtc,
			description: event.description,
			resourceId: event.resourceId?.toString(),
			allDay: event.allDay,
			color: event.color,
			backgroundColor: event.backgroundColor,
		});
	};

	const handleEventDelete = async (event: IlamyCalendarEvent) => {
		const dbEventId = (event.data?.dbEventId as string) ?? event.id;
		await deleteEventMutation.mutateAsync({ eventId: dbEventId });
	};

	// Cell click handler — enables click-to-create
	const handleCellClick = (info: CellClickInfo) => {
		// ilamy automatically opens renderEventForm with the clicked time slot
		// This handler just needs to exist to enable the feature
		void info;
	};

	// Stable renderEvent reference — must be memoized with useCallback. An inline
	// arrow function creates a new reference on every render, causing ilamy to
	// re-register its internal event rendering on each getEvents refetch, which
	// manifests as events reverting to unstyled plain text in the calendar cells.
	const renderEvent = useCallback(
		(e: IlamyCalendarEvent) => <CalendarEventBadge event={e} />,
		[],
	);

	// Push view/mode/orientation changes back into the URL (replace, not push)
	const syncUrl = useCallback(
		(updates: Partial<{ view: string; mode: string; orientation: string }>) => {
			const params = new URLSearchParams(searchParams.toString());
			if (updates.view !== undefined) params.set("view", updates.view);
			if (updates.mode !== undefined) params.set("mode", updates.mode);
			if (updates.orientation !== undefined)
				params.set("orientation", updates.orientation);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// Navigation handlers
	const handleDateChange = (date: dayjs.Dayjs) => setCurrentDate(date);
	const handleViewChange = (view: "month" | "week" | "day" | "year") => {
		setCurrentView(view);
		syncUrl({ view });
	};
	const commonCalendarProps = {
		classesOverride: CALENDAR_CLASSES_OVERRIDE,
		firstDayOfWeek: "monday" as const,
		headerClassName: CALENDAR_HEADER_CLASSNAME,
		hideNonBusinessHours: true,
		initialDate: currentDate,
		initialView: currentView,
		onDateChange: handleDateChange,
		onViewChange: handleViewChange,
		timeFormat: "12-hour" as const,
		timezone: userTimezone,
		viewHeaderClassName: CALENDAR_VIEW_HEADER_CLASSNAME,
	};
	const standardCalendarProps = {
		...commonCalendarProps,
		businessHours: DEFAULT_STANDARD_BUSINESS_HOURS,
	};

	// Loading state
	const isLoading = userLoading || resourcesLoading || eventsLoading;

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-48 rounded bg-gray-200" />
					<div className="h-96 w-full rounded bg-gray-200" />
				</div>
			</div>
		);
	}

	// Build embed URL for the club calendar, preserving the current view/mode/orientation
	// so the iframe opens in exactly the state the admin is looking at.
	// TODO(multi-facility): when ClubFacility schema lands, append &facilityId=<id> here
	// so that each facility gets its own embeddable calendar URL.
	const clubShortName = user?.clubShortName;
	const embedUrl = clubShortName
		? (() => {
				const origin =
					typeof window !== "undefined" ? window.location.origin : "";
				const params = new URLSearchParams({
					view: currentView,
					mode: calendarMode,
					orientation,
				});
				return `${origin}/embed/${clubShortName}/calendar?${params.toString()}`;
			})()
		: null;
	const embedCode = embedUrl
		? `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" allow="fullscreen" style="border:none;border-radius:12px"></iframe>`
		: null;

	const handleCopyEmbed = async () => {
		if (!embedCode) return;
		await navigator.clipboard.writeText(embedCode);
		setEmbedCopied(true);
		setTimeout(() => setEmbedCopied(false), 2000);
	};

	return (
		<div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />
			{(isFacilityOrAdmin || isCoach) && (
				<div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-3">
					{/* Resource ↔ Standard view toggle */}
					<button
						onClick={() => {
							const next = calendarMode === "standard" ? "resource" : "standard";
							if (next === "resource" && currentView === "year")
								setCurrentView("month");
							setCalendarMode(next);
							syncUrl({ mode: next });
						}}
						className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
						title={
							calendarMode === "resource"
								? "Switch to standard calendar"
								: "Switch to resource calendar"
						}
					>
						{calendarMode === "resource" ? (
							<LayoutGrid size={16} />
						) : (
							<Columns size={16} />
						)}
						{calendarMode === "resource" ? "Standard View" : "Resource View"}
					</button>
					{/* Orientation toggle — only in resource mode */}
					{calendarMode === "resource" && (
						<button
							onClick={() => {
								const next =
									orientation === "horizontal" ? "vertical" : "horizontal";
								setOrientation(next);
								syncUrl({ orientation: next });
							}}
							className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
						>
							{orientation === "horizontal"
								? "Vertical Layout"
								: "Horizontal Layout"}
						</button>
					)}
					{/* Embed code copy — only for facility/admin who have a club */}
					{isFacilityOrAdmin && embedCode && (
						<button
							onClick={() => void handleCopyEmbed()}
							className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
							title="Copy embed code for your public calendar"
						>
							{embedCopied ? (
								<Check size={16} className="text-green-600" />
							) : (
								<Clipboard size={16} />
							)}
							{embedCopied ? "Copied!" : "Embed This Calendar View"}
						</button>
					)}
					{isFacilityOrAdmin && (
						<Link
							href="/calendar/resources"
							className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
						>
							<Settings size={16} />
							Manage Resources
						</Link>
					)}
				</div>
			)}
			<div className="flex-1 overflow-y-auto p-4">
				{/* ring-1 instead of border: a real CSS border adds a box edge that renders flush
				    against the overflow-hidden clip boundary, causing the inner corners to appear
				    square. ring renders as an inset box-shadow so the rounded clip applies cleanly.
				    All modes use overflow-hidden on the inner card; the outer flex-1 container
				    scrolls so the full time range (9am–midnight) is always reachable. */}
				<div
					data-calendar-root
					className="rounded-2xl bg-white shadow-sm ring-1 ring-[var(--border)] overflow-hidden"
				>
					{isStudent ? (
						// Students: standard calendar (no resource columns), click navigates directly to event page
						<IlamyCalendar
							{...standardCalendarProps}
							key={userTimezone}
							events={events}
							disableCellClick={true}
							disableDragAndDrop={true}
							disableEventClick={false}
							renderEvent={renderEvent}
							onEventClick={(e) => {
								const dbEventId = (
									e.data as Record<string, unknown> | undefined
								)?.dbEventId as string | undefined;
								if (dbEventId) router.push(`/events/${dbEventId}`);
							}}
						/>
					) : calendarMode === "resource" ? (
						// Staff: resource calendar (default)
						<IlamyResourceCalendar
							{...commonCalendarProps}
							key={`resource-${userTimezone}-${orientation}`}
							resources={resources}
							events={events}
							orientation={orientation}
							disableCellClick={false}
							disableDragAndDrop={false}
							disableEventClick={false}
							renderEvent={renderEvent}
							onCellClick={canCreateEvents ? handleCellClick : undefined}
							onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
							onEventDelete={canCreateEvents ? handleEventDelete : undefined}
							renderEventForm={(props) => (
								<EventFormModal
									{...props}
									resources={resources}
									userType={user?.userType}
								/>
							)}
						/>
					) : (
						// Staff: standard calendar (toggled)
						<IlamyCalendar
							{...standardCalendarProps}
							key={`standard-${userTimezone}`}
							events={events}
							disableCellClick={false}
							disableDragAndDrop={false}
							disableEventClick={false}
							renderEvent={renderEvent}
							onCellClick={canCreateEvents ? handleCellClick : undefined}
							// Event lifecycle (wired for COACH and FACILITY/ADMIN)
							// onEventAdd intentionally omitted — EventFormModal.createMutation handles creation directly
							onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
							onEventDelete={canCreateEvents ? handleEventDelete : undefined}
							renderEventForm={(props) => (
								<EventFormModal
									{...props}
									resources={resources}
									userType={user?.userType}
								/>
							)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
