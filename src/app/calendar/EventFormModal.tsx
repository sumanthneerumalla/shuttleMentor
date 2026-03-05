"use client";
// TODO: This file is a local port of the ilamy-calendar EventForm + EventFormDialog components.
// Once the PR #80 exporting EventForm, EventFormDialog, and RecurrenceEditor is merged and released
// (see: https://github.com/kcsujeet/ilamy-calendar), replace this file by importing directly:
//   import { EventFormDialog } from "@ilamy/calendar";
// and removing EventFormModal.tsx + RecurrenceEditor.tsx from this directory.

import { useEffect, useState, useCallback } from "react";
import type { CalendarEvent as IlamyCalendarEvent, Resource } from "@ilamy/calendar";
import { RRule } from "rrule";
import dayjs from "dayjs";
import { X, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import { api } from "~/trpc/react";
import { RecurrenceEditor } from "~/app/calendar/RecurrenceEditor";
import type { RRuleOptions } from "@ilamy/calendar";
import { useToast } from "~/app/_components/shared/Toast";

interface EventFormModalProps {
	open?: boolean;
	selectedEvent?: IlamyCalendarEvent | null;
	onAdd?: (event: IlamyCalendarEvent) => void;
	onUpdate?: (event: IlamyCalendarEvent) => void;
	onDelete?: (event: IlamyCalendarEvent) => void;
	onClose: () => void;
	resources: Resource[];
	userType?: string;
}

function toDatetimeLocal(d: dayjs.Dayjs): string {
	return d.format("YYYY-MM-DDTHH:mm");
}

export default function EventFormModal({
	open,
	selectedEvent,
	onAdd,
	onUpdate,
	onDelete,
	onClose,
	resources,
	userType,
}: EventFormModalProps) {
	// isEdit: selectedEvent has a real db id (non-empty string) — not a new-event temp object
	const isEdit = !!(selectedEvent?.id && selectedEvent.id !== "");

	const isCoach = userType === "COACH";
	const isFacilityOrAdmin = userType === "FACILITY" || userType === "ADMIN";

	// Fetch full event details when editing, to determine edit permissions
	const dbEventId = isEdit
		? (((selectedEvent?.data as Record<string, unknown> | undefined)?.dbEventId as string | undefined) ?? String(selectedEvent?.id ?? ""))
		: null;
	const { data: fetchedEvent } = api.calendar.getEventById.useQuery(
		{ eventId: dbEventId! },
		{ enabled: !!open && !!dbEventId },
	);
	const { data: currentUser } = api.user.getOrCreateProfile.useQuery();

	// canEdit: owns the event OR is FACILITY/ADMIN on same club
	const canEdit = !isEdit || (
		!!fetchedEvent && (
			isFacilityOrAdmin ||
			(!!currentUser && fetchedEvent.createdByUserId === currentUser.userId)
		)
	);

	const [title, setTitle] = useState("");
	const [resourceId, setResourceId] = useState("");
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [allDay, setAllDay] = useState(false);
	const [rruleOpts, setRruleOpts] = useState<RRuleOptions | null>(null);
	const [saving, setSaving] = useState(false);
	// eventType: COACH can only create COACHING_SLOT; FACILITY/ADMIN default to BLOCK
	const [eventType, setEventType] = useState<"BLOCK" | "BOOKABLE" | "COACHING_SLOT">(
		isCoach ? "COACHING_SLOT" : "BLOCK",
	);
	const [productId, setProductId] = useState<string>("");

	// Reset saving state when modal opens
	useEffect(() => {
		if (open) {
			setSaving(false);
		}
	}, [open]);

	// Populate form when modal opens
	useEffect(() => {
		if (!open) return;
		const defaultEventType = isCoach ? "COACHING_SLOT" : "BLOCK";
		if (isEdit && selectedEvent) {
			setTitle(selectedEvent.title ?? "");
			setResourceId(selectedEvent.resourceId?.toString() ?? "");
			setStart(toDatetimeLocal(selectedEvent.start));
			setEnd(toDatetimeLocal(selectedEvent.end));
			setAllDay(selectedEvent.allDay ?? false);
			setRruleOpts((selectedEvent.rrule as RRuleOptions | undefined) ?? null);
			const data = selectedEvent.data as Record<string, unknown> | undefined;
			setEventType((data?.eventType as "BLOCK" | "BOOKABLE" | "COACHING_SLOT" | undefined) ?? defaultEventType);
			setProductId((data?.productId as string | undefined) ?? "");
		} else if (selectedEvent) {
			// New event — pre-fill times from clicked slot
			setTitle("");
			setResourceId(selectedEvent.resourceId?.toString() ?? "");
			setStart(toDatetimeLocal(selectedEvent.start));
			setEnd(toDatetimeLocal(selectedEvent.end));
			setAllDay(selectedEvent.allDay ?? false);
			setRruleOpts(null);
			setEventType(defaultEventType);
			setProductId("");
		} else {
			setTitle("");
			setResourceId("");
			setStart(toDatetimeLocal(dayjs()));
			setEnd(toDatetimeLocal(dayjs().add(1, "hour")));
			setAllDay(false);
			setRruleOpts(null);
			setEventType(defaultEventType);
			setProductId("");
		}
	}, [open, selectedEvent, isEdit, isCoach]);

	// All hooks must be above early return (rules of hooks)
	const utils = api.useUtils();
	const { toast } = useToast();

	// Fetch products for the selector (only when eventType !== BLOCK)
	const { data: productsData } = api.products.getProducts.useQuery(
		{ category: eventType === "COACHING_SLOT" ? "COACHING_SLOT" : "CALENDAR_EVENT" },
		{ enabled: !!open && eventType !== "BLOCK" },
	);
	
	const createMutation = api.calendar.createEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
			onAdd?.(buildEvent());
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => {
			setSaving(false);
		},
	});
	const updateMutation = api.calendar.updateEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
			onUpdate?.(buildEvent());
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => {
			setSaving(false);
		},
	});
	const deleteMutation = api.calendar.deleteEvent.useMutation({
		onSuccess: () => {
			void utils.calendar.getEvents.invalidate();
			onDelete?.(selectedEvent!);
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => {
			setSaving(false);
		},
	});

	const buildEvent = useCallback((): IlamyCalendarEvent => ({
		...(selectedEvent ?? {}),
		id: selectedEvent?.id ?? "",
		title,
		start: dayjs(start),
		end: dayjs(end),
		resourceId: resourceId || undefined,
		allDay,
		// Don't forward color/backgroundColor — server defaults apply
		color: undefined,
		backgroundColor: undefined,
	} as IlamyCalendarEvent), [selectedEvent, title, start, end, resourceId, allDay]);

	if (!open) return null;

	// While fetching permissions on edit, show loading shell
	const isLoadingPermissions = isEdit && !fetchedEvent;

	// Read-only view: editing an event you don't own
	if (isEdit && fetchedEvent && !canEdit) {
		const evType = fetchedEvent.eventType;
		return (
			<>
				<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
				<div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col glass-panel border-l border-[var(--border)] shadow-xl">
					<div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
						<h2 className="text-base font-semibold text-[var(--foreground)]">{fetchedEvent.title}</h2>
						<button onClick={onClose} className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors" aria-label="Close">
							<X size={18} />
						</button>
					</div>
					<div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
						<p className="text-sm text-[var(--muted-foreground)]">
							{dayjs(fetchedEvent.start).format("ddd, MMM D · h:mm A")} – {dayjs(fetchedEvent.end).format("h:mm A")}
						</p>
						{fetchedEvent.resource && (
							<p className="text-sm text-[var(--muted-foreground)]">Resource: <span className="text-[var(--foreground)]">{fetchedEvent.resource.title}</span></p>
						)}
						{fetchedEvent.description && (
							<p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{fetchedEvent.description}</p>
						)}
						{(evType === "BOOKABLE" || evType === "COACHING_SLOT") && (
							<Link
								href={`/events/${fetchedEvent.eventId}`}
								onClick={onClose}
								className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] underline-offset-2 hover:underline"
							>
								<ExternalLink size={13} /> View event details
							</Link>
						)}
					</div>
					<div className="border-t border-[var(--border)] px-6 py-4 flex justify-end">
						<Button variant="outline" size="sm" onClick={onClose}>Close</Button>
					</div>
				</div>
			</>
		);
	}

	const handleSave = () => {
		if (!title.trim()) return;
		setSaving(true);
		const startDate = dayjs(start).toDate();
		const endDate = dayjs(end).toDate();
		if (isEdit && selectedEvent) {
			const dbEventId = ((selectedEvent.data as Record<string, unknown> | undefined)?.dbEventId as string | undefined) ?? String(selectedEvent.id);
			updateMutation.mutate({
				eventId: dbEventId,
				title,
				start: startDate,
				end: endDate,
				resourceId: resourceId || undefined,
				allDay,
				productId: productId || undefined,
			});
		} else {
			createMutation.mutate({
				title,
				start: startDate,
				end: endDate,
				resourceId: resourceId || undefined,
				allDay,
				rrule: rruleOpts
					? new RRule(rruleOpts as ConstructorParameters<typeof RRule>[0]).toString()
					: undefined,
				eventType,
				productId: productId || undefined,
			});
		}
	};

	const handleDelete = () => {
		if (!selectedEvent) return;
		if (!window.confirm("Delete this event?")) return;
		setSaving(true);
		const dbEventId = ((selectedEvent.data as Record<string, unknown> | undefined)?.dbEventId as string | undefined) ?? String(selectedEvent.id);
		deleteMutation.mutate({ eventId: dbEventId });
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
				onClick={saving ? undefined : onClose}
			/>

			{/* Slide-over panel */}
			<div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col glass-panel border-l border-[var(--border)] shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
					<h2 className="text-base font-semibold text-[var(--foreground)]">
					{isLoadingPermissions ? "Loading…" : isEdit ? "Edit Event" : "New Event"}
				</h2>
					<button
						onClick={onClose}
						className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
					{isLoadingPermissions && (
						<div className="animate-pulse space-y-3">
							<div className="h-4 w-2/3 rounded bg-[var(--muted)]" />
							<div className="h-4 w-1/2 rounded bg-[var(--muted)]" />
						</div>
					)}
					{/* Event Type — hidden for coaches (always COACHING_SLOT) */}
					{isFacilityOrAdmin && (
						<div className="space-y-1">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Event Type
							</label>
							<select
								value={eventType}
								onChange={(e) => {
									setEventType(e.target.value as "BLOCK" | "BOOKABLE" | "COACHING_SLOT");
									setProductId("");
								}}
								disabled={isEdit}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-[var(--foreground)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
							>
								<option value="BLOCK">Block — internal scheduling</option>
								<option value="BOOKABLE">Bookable — students can register</option>
								<option value="COACHING_SLOT">Coaching Slot — 1-on-1 coach availability</option>
							</select>
							{eventType !== "BLOCK" && (
								<p className="text-xs text-[var(--muted-foreground)]">
									Set visibility, capacity, and other details on the event page after creation.
								</p>
							)}
						</div>
					)}

					{/* Title */}
					<div className="space-y-1">
						<label className="text-sm font-medium text-[var(--foreground)]">
							Title <span className="text-red-500">*</span>
						</label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Event title"
							maxLength={500}
						/>
					</div>

					{/* Resource */}
					{resources.length > 0 && (
						<div className="space-y-1">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Resource
							</label>
							<select
								value={resourceId}
								onChange={(e) => setResourceId(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-[var(--foreground)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="">— No resource —</option>
								{resources.map((r) => (
									<option key={r.id} value={r.id}>
										{r.title}
									</option>
								))}
							</select>
						</div>
					)}

					{/* All day */}
					<label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer select-none">
						<input
							type="checkbox"
							checked={allDay}
							onChange={(e) => setAllDay(e.target.checked)}
							className="h-4 w-4 rounded border-input accent-[var(--primary)]"
						/>
						All day
					</label>

					{/* Start */}
					{!allDay && (
						<div className="space-y-1">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Start
							</label>
							<Input
								type="datetime-local"
								value={start}
								onChange={(e) => setStart(e.target.value)}
							/>
						</div>
					)}

					{/* End */}
					{!allDay && (
						<div className="space-y-1">
							<label className="text-sm font-medium text-[var(--foreground)]">
								End
							</label>
							<Input
								type="datetime-local"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
							/>
						</div>
					)}

					{/* Recurrence — new events only */}
					{!isEdit && (
						<div className="space-y-1">
							<RecurrenceEditor value={rruleOpts} onChange={setRruleOpts} />
						</div>
					)}

					{/* Product selector — shown for BOOKABLE and COACHING_SLOT */}
					{eventType !== "BLOCK" && (
						<div className="space-y-1">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Linked Product
							</label>
							<select
								value={productId}
								onChange={(e) => setProductId(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-[var(--foreground)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="">— No product (free) —</option>
								{productsData?.products.map((p) => (
									<option key={p.productId} value={p.productId}>
										{p.name} (${(p.priceInCents / 100).toFixed(2)})
									</option>
								))}
							</select>
							{!productsData?.products.length && (
								<p className="text-xs text-[var(--muted-foreground)]">
									No products found. <a href="/products" className="underline">Create one first.</a>
								</p>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
					<div className="flex items-center gap-2">
						{isEdit && !isLoadingPermissions && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDelete}
								className="text-red-600 hover:bg-red-50 border-red-200"
							>
								<Trash2 size={14} />
								Delete
							</Button>
						)}
						{isEdit && fetchedEvent && (fetchedEvent.eventType === "BOOKABLE" || fetchedEvent.eventType === "COACHING_SLOT") && (
							<Link
								href={`/events/${fetchedEvent.eventId}`}
								onClick={onClose}
								className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
							>
								<ExternalLink size={13} /> Event Page
							</Link>
						)}
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave} disabled={!title.trim() || saving || isLoadingPermissions}>
							{saving ? "Saving…" : isEdit ? "Save" : "Create"}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
