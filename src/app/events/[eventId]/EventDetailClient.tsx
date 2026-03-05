"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useToast, ToastContainer } from "~/app/_components/shared/Toast";
import BookableEventDetails from "~/app/events/_components/BookableEventDetails";
import Link from "next/link";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import dayjs from "dayjs";
import "~/lib/dayjs-config";
import { Button } from "~/app/_components/shared/Button";

interface EventDetailClientProps {
	eventId: string;
	userType: string;
	userId: string;
}

export default function EventDetailClient({ eventId, userType, userId }: EventDetailClientProps) {
	const { toasts, dismiss } = useToast();
	const isFacilityOrAdmin = userType === "FACILITY" || userType === "ADMIN";
	const isCoach = userType === "COACH";
	 const [editMode, setEditMode] = useState(false);

	const { data: event, isLoading, error } = api.calendar.getEventById.useQuery({ eventId });

	// COACH can edit only their own events; FACILITY/ADMIN can edit all
	const canEdit = isFacilityOrAdmin || (isCoach && !!event && event.createdByUserId === userId);

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
						resource: event.resource,
						product: event.product,
						createdByUser: event.createdByUser,
						_count: event._count,
					}}
					readOnly={!editMode}
				/>
			</div>
		</div>
	);
}
