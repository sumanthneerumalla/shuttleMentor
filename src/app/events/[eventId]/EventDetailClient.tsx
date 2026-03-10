"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useToast, ToastContainer } from "~/app/_components/shared/Toast";
import BookableEventDetails from "~/app/events/_components/BookableEventDetails";
import Link from "next/link";
import { ArrowLeft, Pencil, Eye, CalendarCheck, X, Users } from "lucide-react";
import dayjs from "dayjs";
import "~/lib/dayjs-config";
import { Button } from "~/app/_components/shared/Button";

interface EventDetailClientProps {
	eventId: string;
	userType: string;
	userId: string;
}

export default function EventDetailClient({ eventId, userType, userId }: EventDetailClientProps) {
	const { toasts, toast, dismiss } = useToast();
	const isFacilityOrAdmin = userType === "FACILITY" || userType === "ADMIN";
	const isCoach = userType === "COACH";
	const isStudent = userType === "STUDENT";
	const [editMode, setEditMode] = useState(false);

	const { data: event, isLoading, error } = api.calendar.getPublicEventById.useQuery({ eventId });

	// COACH can edit only their own events; FACILITY/ADMIN can edit all
	const canEdit = isFacilityOrAdmin || (isCoach && event != null && event.createdByUserId === userId);

	const utils = api.useUtils();

	// My current confirmed registration for this event (students only)
	const { data: myRegistrationsData } = api.calendar.getMyRegistrations.useQuery(undefined, {
		enabled: isStudent,
	});
	const myRegistration = myRegistrationsData?.registrations.find(
		(r) => r.event.eventId === eventId,
	);

	// Roster: fetch confirmed registrations for staff
	const { data: rosterData } = api.calendar.getEventRegistrations.useQuery(
		{ eventId },
		{ enabled: isFacilityOrAdmin || isCoach },
	);

	const registerMutation = api.calendar.registerForEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getMyRegistrations.invalidate();
			void utils.calendar.getPublicEventById.invalidate({ eventId });
			toast("You're registered!", "success");
		},
		onError: (err) => toast(err.message, "error"),
	});

	const cancelMutation = api.calendar.cancelRegistration.useMutation({
		onSuccess: () => {
			void utils.calendar.getMyRegistrations.invalidate();
			void utils.calendar.getPublicEventById.invalidate({ eventId });
			toast("Registration cancelled", "success");
		},
		onError: (err) => toast(err.message, "error"),
	});

	// Derived registration state
	const isBookable = event != null && event.eventType !== "BLOCK" && event.isPublic;
	const isFull =
		event != null &&
		event.maxParticipants !== null &&
		event._count.registrations >= event.maxParticipants;
	const canRegister = isStudent && isBookable && !isFull && !myRegistration;
	const canCancel = isStudent && myRegistration != null;

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-64 rounded bg-[var(--muted)]" />
					<div className="h-48 w-full max-w-2xl rounded bg-[var(--muted)]" />
				</div>
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-[var(--muted-foreground)]">Event not found.</p>
					<Link href="/calendar" className="mt-3 inline-block text-sm underline text-[var(--primary)]">
						Back to calendar
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-5rem)] overflow-auto p-6">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />

			{/* Back nav */}
			<div className="mb-6">
				<Link
					href="/calendar"
					className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
				>
					<ArrowLeft size={14} />
					Back to calendar
				</Link>
			</div>

			<div className="mx-auto max-w-2xl space-y-4">
				{/* Date/time + edit toggle header */}
				<div className="flex items-center justify-between">
					<div className="text-sm text-[var(--muted-foreground)]">
						{dayjs(event.start).format("ddd, MMM D YYYY · h:mm A")}
						{" — "}
						{dayjs(event.end).format("h:mm A")}
					</div>
					{canEdit && (
						<Button
							variant={editMode ? "outline" : "outline"}
							size="sm"
							onClick={() => setEditMode((v) => !v)}
							className={editMode ? "border-[var(--primary)] text-[var(--primary)]" : ""}
						>
							{editMode ? <><Eye size={14} /> View</> : <><Pencil size={14} /> Edit</>}
						</Button>
					)}
				</div>

				<BookableEventDetails
					event={{
						eventId: event.eventId,
						title: event.title,
						eventType: event.eventType,
						description: event.description,
						isPublic: event.isPublic,
						maxParticipants: event.maxParticipants,
						registrationType: event.registrationType,
						rrule: event.rrule,
						start: event.start,
						end: event.end,
						showRegistrantNames: event.showRegistrantNames,
						resource: event.resource,
						product: event.product,
						createdByUser: event.createdByUser,
						_count: event._count,
						registrants: event.registrants,
					}}
					readOnly={!editMode}
				/>

				{/* Registration actions — students only */}
				{isStudent && isBookable && (
					<div className="glass-card rounded-lg p-5 space-y-3">
						{myRegistration ? (
							<>
								<div className="flex items-center gap-2 text-sm font-medium text-green-600">
									<CalendarCheck size={16} />
									You're registered for this event
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => cancelMutation.mutate({ registrationId: myRegistration.registrationId })}
									disabled={cancelMutation.isPending}
									className="text-red-600 border-red-200 hover:bg-red-50"
								>
									<X size={14} />
									{cancelMutation.isPending ? "Cancelling…" : "Cancel Registration"}
								</Button>
								<p className="text-xs text-[var(--muted-foreground)]">
									Cancelling forfeits any credit used for this registration.
								</p>
							</>
						) : isFull ? (
							<p className="text-sm text-[var(--muted-foreground)]">
								This event is fully booked ({event._count.registrations}/{event.maxParticipants} spots filled).
							</p>
						) : !userId ? (
							<p className="text-sm text-[var(--muted-foreground)]">
								<Link href="/sign-in" className="underline text-[var(--primary)]">Sign in</Link> to register for this event.
							</p>
						) : (
							<>
								{event.maxParticipants !== null && (
									<p className="text-sm text-[var(--muted-foreground)]">
										{event.maxParticipants - event._count.registrations} spot{event.maxParticipants - event._count.registrations === 1 ? "" : "s"} remaining
									</p>
								)}
								<Button
									size="sm"
									onClick={() => registerMutation.mutate({ eventId: event.eventId })}
									disabled={registerMutation.isPending}
								>
									<CalendarCheck size={14} />
									{registerMutation.isPending ? "Registering…" : "Register for this event"}
								</Button>
							</>
						)}
					</div>
				)}

				{/* Event roster — FACILITY/ADMIN/COACH only */}
				{(isFacilityOrAdmin || isCoach) && event.eventType !== "BLOCK" && (
					<div className="glass-card rounded-lg p-5 space-y-3">
						<div className="flex items-center gap-2">
							<Users size={16} className="text-[var(--muted-foreground)]" />
							<h3 className="text-sm font-medium text-[var(--foreground)]">
								Registered ({rosterData?.registrations.length ?? 0}
								{event.maxParticipants !== null ? ` / ${event.maxParticipants}` : ""})
							</h3>
						</div>
						{!rosterData ? (
							<p className="text-xs text-[var(--muted-foreground)]">Loading…</p>
						) : rosterData.registrations.length === 0 ? (
							<p className="text-xs text-[var(--muted-foreground)]">No confirmed registrations yet.</p>
						) : (
							<ul className="space-y-1.5">
								{rosterData.registrations.map((r) => (
									<li key={r.registrationId} className="flex items-center gap-2.5 text-sm text-[var(--foreground)]">
										{/* Avatar placeholder — replace inner div with <ProfileAvatar> when avatar support is added */}
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-medium text-[var(--primary)]">
											{r.firstName?.[0] ?? "?"}
										</div>
										<span>{r.firstName} {r.lastInitial}</span>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
