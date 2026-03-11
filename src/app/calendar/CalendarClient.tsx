"use client";

import { IlamyCalendar, IlamyResourceCalendar } from "@ilamy/calendar";
import type {
	CellClickInfo,
	CalendarEvent as IlamyCalendarEvent,
	Resource,
} from "@ilamy/calendar";
import { keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Columns, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RRule } from "rrule";
import { api } from "~/trpc/react";
import "~/lib/dayjs-config";
import { ToastContainer, useToast } from "~/app/_components/shared/Toast";
import EventFormModal from "~/app/calendar/EventFormModal";

// Default colors from globals.css design tokens
const DEFAULT_COLOR = "#4F46E5"; // --primary
const DEFAULT_BG_COLOR = "#EFF6FF"; // --accent

// Parse RRULE string into rrule.js options — defined outside component to avoid re-creation on every render
function parseRRule(rruleString: string) {
	const rule = RRule.fromString(rruleString);
	return rule.origOptions;
}

export default function CalendarClient() {
	const router = useRouter();
	const [currentDate, setCurrentDate] = useState(dayjs());
	const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "year">(
		"week",
	);
	// Staff can toggle between resource calendar and standard calendar
	const [calendarMode, setCalendarMode] = useState<"resource" | "standard">(
		"resource",
	);

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
		const unit = currentView === "month" ? "month" : currentView === "week" ? "week" : "day";
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
					: undefined,
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

	// Navigation handlers
	const handleDateChange = (date: dayjs.Dayjs) => setCurrentDate(date);
	const handleViewChange = (view: "month" | "week" | "day" | "year") => {
		setCurrentView(view);
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

	return (
		<div className="flex h-[calc(100vh-5rem)] flex-col">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />
			{(isFacilityOrAdmin || isCoach) && (
				<div className="flex items-center justify-end gap-2 px-4 pt-3">
					{/* Resource ↔ Standard view toggle */}
					<button
						onClick={() => {
							setCalendarMode((m) => {
								if (m === "standard") {
									// Resource calendar does not support year view — coerce to month
									if (currentView === "year") setCurrentView("month");
									return "resource";
								}
								return "standard";
							});
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
			<div className="flex-1 overflow-hidden p-4">
				{isStudent ? (
					// Students: standard calendar (no resource columns), click navigates directly to event page
					<IlamyCalendar
						key={userTimezone}
						events={events}
						initialView={currentView}
						initialDate={currentDate}
						firstDayOfWeek="monday"
						timeFormat="12-hour"
						timezone={userTimezone}
						disableCellClick={true}
						disableDragAndDrop={true}
						disableEventClick={false}
						onEventClick={(e) => {
							const dbEventId = (e.data as Record<string, unknown> | undefined)
								?.dbEventId as string | undefined;
							if (dbEventId) router.push(`/events/${dbEventId}`);
						}}
						onDateChange={handleDateChange}
						onViewChange={handleViewChange}
					/>
				) : calendarMode === "resource" ? (
					// Staff: resource calendar (default)
					<IlamyResourceCalendar
						key={`resource-${userTimezone}`}
						resources={resources}
						events={events}
						initialView={currentView}
						initialDate={currentDate}
						firstDayOfWeek="monday"
						timeFormat="12-hour"
						timezone={userTimezone}
						disableCellClick={false}
						disableDragAndDrop={false}
						disableEventClick={false}
						onCellClick={canCreateEvents ? handleCellClick : undefined}
						onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
						onEventDelete={canCreateEvents ? handleEventDelete : undefined}
						onDateChange={handleDateChange}
						onViewChange={handleViewChange}
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
						key={`standard-${userTimezone}`}
						events={events}
						initialView={currentView}
						initialDate={currentDate}
						firstDayOfWeek="monday"
						timeFormat="12-hour"
						timezone={userTimezone}
						disableCellClick={false}
						disableDragAndDrop={false}
						disableEventClick={false}
						onCellClick={canCreateEvents ? handleCellClick : undefined}
						// Event lifecycle (wired for COACH and FACILITY/ADMIN)
						// onEventAdd intentionally omitted — EventFormModal.createMutation handles creation directly
						onEventUpdate={canCreateEvents ? handleEventUpdate : undefined}
						onEventDelete={canCreateEvents ? handleEventDelete : undefined}
						onDateChange={handleDateChange}
						onViewChange={handleViewChange}
						// Custom event form modal
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
	);
}
