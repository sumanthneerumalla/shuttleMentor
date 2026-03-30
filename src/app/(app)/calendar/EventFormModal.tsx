"use client";
// TODO: This file is a local port of the ilamy-calendar EventForm + EventFormDialog components.
// If the PR #80 exporting EventForm, EventFormDialog, and RecurrenceEditor is merged and released
// (see: https://github.com/kcsujeet/ilamy-calendar), replace this file by importing directly:
//   import { EventFormDialog } from "@ilamy/calendar";
// and removing EventFormModal.tsx + RecurrenceEditor.tsx from this directory.

import type {
	CalendarEvent as IlamyCalendarEvent,
	Resource,
} from "@ilamy/calendar";
import type { RRuleOptions } from "@ilamy/calendar";
import dayjs from "dayjs";
import { Building2, ExternalLink, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RRule } from "rrule";
import { RecurrenceEditor } from "~/app/(app)/calendar/RecurrenceEditor";
import { AlertDialog } from "~/app/_components/shared/AlertDialog";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import { Select } from "~/app/_components/shared/ui/select";
import { useToast } from "~/app/_components/shared/Toast";
import { isFacilityOrAbove } from "~/lib/utils";
import { api } from "~/trpc/react";

// Hex values stored in DB (VARCHAR(20) safe). Tailwind equivalents noted for reference.
const COLOR_OPTIONS = [
	{ bg: "#dbeafe", text: "#1e40af", label: "Blue" },
	{ bg: "#dcfce7", text: "#166534", label: "Green" },
	{ bg: "#f3e8ff", text: "#6b21a8", label: "Purple" },
	{ bg: "#fee2e2", text: "#991b1b", label: "Red" },
	{ bg: "#fef9c3", text: "#854d0e", label: "Yellow" },
	{ bg: "#fce7f3", text: "#9d174d", label: "Pink" },
	{ bg: "#e0e7ff", text: "#3730a3", label: "Indigo" },
	{ bg: "#fef3c7", text: "#92400e", label: "Amber" },
	{ bg: "#d1fae5", text: "#065f46", label: "Emerald" },
	{ bg: "#e0f2fe", text: "#0c4a6e", label: "Sky" },
	{ bg: "#ede9fe", text: "#4c1d95", label: "Violet" },
	{ bg: "#ffe4e6", text: "#9f1239", label: "Rose" },
	{ bg: "#ccfbf1", text: "#134e4a", label: "Teal" },
	{ bg: "#ffedd5", text: "#7c2d12", label: "Orange" },
];

interface EventFormModalProps {
	open?: boolean;
	selectedEvent?: IlamyCalendarEvent | null;
	onAdd?: (event: IlamyCalendarEvent) => void;
	onUpdate?: (event: IlamyCalendarEvent) => void;
	onDelete?: (event: IlamyCalendarEvent) => void;
	onClose: () => void;
	resources: Resource[];
	userType?: string;
	facilityId?: string;
	facilityName?: string;
}

function toDatetimeLocal(d: dayjs.Dayjs): string {
	return d.format("YYYY-MM-DDTHH:mm");
}

const DATETIME_STEP_SECONDS = 15 * 60;

export default function EventFormModal({
	open,
	selectedEvent,
	onAdd,
	onUpdate,
	onDelete,
	onClose,
	resources,
	userType,
	facilityId,
	facilityName,
}: EventFormModalProps) {
	// isEdit: selectedEvent has a real db id (non-empty string) — not a new-event temp object
	const isEdit = selectedEvent?.id != null && selectedEvent.id !== "";

	const isCoach = userType === "COACH";
	const isFacilityOrAdmin = userType ? isFacilityOrAbove({ userType }) : false;
	const defaultEventType = isCoach ? "COACHING_SLOT" : "BOOKABLE";

	// Fetch full event details when editing, to determine edit permissions
	const dbEventId = isEdit
		? (((selectedEvent?.data as Record<string, unknown> | undefined)
				?.dbEventId as string | undefined) ?? String(selectedEvent?.id ?? ""))
		: null;
	const { data: fetchedEvent } = api.calendar.getEventById.useQuery(
		{ eventId: dbEventId! },
		{ enabled: open === true && dbEventId !== null },
	);
	const { data: currentUser } = api.user.getOrCreateProfile.useQuery();

	// canEdit: owns the event OR is FACILITY/ADMIN on same club
	const canEdit =
		!isEdit ||
		(fetchedEvent != null &&
			(isFacilityOrAdmin ||
				(currentUser != null &&
					fetchedEvent.createdByUserId === currentUser.userId)));

	const [title, setTitle] = useState("");
	const [resourceId, setResourceId] = useState("");
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [allDay, setAllDay] = useState(false);
	const [rruleOpts, setRruleOpts] = useState<RRuleOptions | null>(null);
	const [saving, setSaving] = useState(false);
	// eventType: coaches default to COACHING_SLOT; everyone else defaults to BOOKABLE.
	const [eventType, setEventType] = useState<
		"BLOCK" | "BOOKABLE" | "COACHING_SLOT"
	>(defaultEventType);
	const [productId, setProductId] = useState<string>("");
	const [color, setColor] = useState<string>("");
	const [scope, setScope] = useState<"THIS" | "THIS_AND_FUTURE" | "ALL">("ALL");
	const [confirmDelete, setConfirmDelete] = useState(false);

	// Reset saving state and scope when modal opens
	useEffect(() => {
		if (open) {
			setSaving(false);
			setScope("ALL");
		}
	}, [open]);

	// Populate form when modal opens
	useEffect(() => {
		if (!open) return;
		if (isEdit && selectedEvent) {
			setTitle(selectedEvent.title ?? "");
			setResourceId(selectedEvent.resourceId?.toString() ?? "");
			setStart(toDatetimeLocal(selectedEvent.start));
			setEnd(toDatetimeLocal(selectedEvent.end));
			setAllDay(selectedEvent.allDay ?? false);
			setRruleOpts((selectedEvent.rrule as RRuleOptions | undefined) ?? null);
			const data = selectedEvent.data as Record<string, unknown> | undefined;
			setEventType(
				(data?.eventType as
					| "BLOCK"
					| "BOOKABLE"
					| "COACHING_SLOT"
					| undefined) ?? defaultEventType,
			);
			setProductId((data?.productId as string | undefined) ?? "");
			setColor(selectedEvent.backgroundColor ?? "");
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
			setColor("");
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
	}, [open, selectedEvent, isEdit, defaultEventType]);

	// All hooks must be above early return (rules of hooks)
	const utils = api.useUtils();
	const { toast } = useToast();

	// Fetch products for the selector (only when eventType !== BLOCK)
	const { data: productsData } = api.products.getProducts.useQuery(
		{
			category:
				eventType === "COACHING_SLOT" ? "COACHING_SLOT" : "CALENDAR_EVENT",
		},
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

	const buildEvent = useCallback(
		(): IlamyCalendarEvent =>
			({
				...(selectedEvent ?? {}),
				id: selectedEvent?.id ?? "",
				title,
				start: dayjs(start),
				end: dayjs(end),
				resourceId: resourceId || undefined,
				allDay,
				backgroundColor: color || undefined,
				color: color
					? (COLOR_OPTIONS.find((o) => o.bg === color)?.text ?? "#1e293b")
					: undefined,
			}) as IlamyCalendarEvent,
		[selectedEvent, title, start, end, resourceId, allDay, color],
	);

	if (!open) return null;

	// While fetching permissions on edit, show loading shell
	const isLoadingPermissions = isEdit && !fetchedEvent;

	// Read-only view: editing an event you don't own
	if (isEdit && fetchedEvent && !canEdit) {
		const evType = fetchedEvent.eventType;
		return (
			<>
				<div
					className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
					onClick={onClose}
				/>
				<div className="glass-panel fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-[var(--border)] border-l shadow-xl">
					<div className="flex items-center justify-between border-[var(--border)] border-b px-6 py-4">
						<h2 className="font-semibold text-[var(--foreground)] text-base">
							{fetchedEvent.title}
						</h2>
						<button
							onClick={onClose}
							className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
							aria-label="Close"
						>
							<X size={18} />
						</button>
					</div>
					<div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
						<p className="text-[var(--muted-foreground)] text-sm">
							{dayjs(fetchedEvent.start).format("ddd, MMM D · h:mm A")} –{" "}
							{dayjs(fetchedEvent.end).format("h:mm A")}
						</p>
						{fetchedEvent.resource && (
							<p className="text-[var(--muted-foreground)] text-sm">
								Resource:{" "}
								<span className="text-[var(--foreground)]">
									{fetchedEvent.resource.title}
								</span>
							</p>
						)}
						{fetchedEvent.description && (
							<p className="whitespace-pre-wrap text-[var(--foreground)] text-sm">
								{fetchedEvent.description}
							</p>
						)}
						{(evType === "BOOKABLE" || evType === "COACHING_SLOT") && (
							<Link
								href={`/events/${fetchedEvent.eventId}`}
								onClick={onClose}
								className="inline-flex items-center gap-1.5 text-[var(--primary)] text-sm underline-offset-2 hover:underline"
							>
								<ExternalLink size={13} /> View event details
							</Link>
						)}
					</div>
					<div className="flex justify-end border-[var(--border)] border-t px-6 py-4">
						<Button variant="outline" size="sm" onClick={onClose}>
							Close
						</Button>
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
			const dbEventId =
				((selectedEvent.data as Record<string, unknown> | undefined)
					?.dbEventId as string | undefined) ?? String(selectedEvent.id);
			const isRecurring = !!fetchedEvent?.rrule;
			updateMutation.mutate({
				eventId: dbEventId,
				title,
				start: startDate,
				end: endDate,
				resourceId: resourceId || undefined,
				allDay,
				productId: productId || undefined,
				backgroundColor: color || undefined,
				color: color
					? (COLOR_OPTIONS.find((o) => o.bg === color)?.text ?? "#1e293b")
					: undefined,
				...(isRecurring && {
					scope,
					instanceDate: selectedEvent.start.toDate(),
				}),
			});
		} else {
			createMutation.mutate({
				title,
				start: startDate,
				end: endDate,
				resourceId: resourceId || undefined,
				facilityId: facilityId || undefined,
				allDay,
				rrule: rruleOpts
					? new RRule(
							rruleOpts as ConstructorParameters<typeof RRule>[0],
						).toString()
					: undefined,
				eventType,
				productId: productId || undefined,
				backgroundColor: color || undefined,
				color: color
					? (COLOR_OPTIONS.find((o) => o.bg === color)?.text ?? "#1e293b")
					: undefined,
			});
		}
	};

	const handleDelete = () => {
		if (!selectedEvent) return;
		setConfirmDelete(true);
	};

	const executeDelete = () => {
		if (!selectedEvent) return;
		setConfirmDelete(false);
		setSaving(true);
		const dbEventId =
			((selectedEvent.data as Record<string, unknown> | undefined)?.dbEventId as
				| string
				| undefined) ?? String(selectedEvent.id);
		const isRecurring = !!fetchedEvent?.rrule;
		deleteMutation.mutate({
			eventId: dbEventId,
			...(isRecurring && { scope, instanceDate: selectedEvent.start.toDate() }),
		});
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
				onClick={saving ? undefined : onClose}
			/>

			{/* Slide-over panel */}
			<div className="glass-panel fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-[var(--border)] border-l shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-[var(--border)] border-b px-6 py-4">
					<div>
						<h2 className="font-semibold text-[var(--foreground)] text-base">
							{isLoadingPermissions
								? "Loading…"
								: isEdit
									? "Edit Event"
									: "New Event"}
						</h2>
						{facilityName && (
							<p className="mt-1 flex items-center gap-1.5 text-[var(--foreground)] text-sm">
								<Building2
									size={14}
									className="text-[var(--muted-foreground)]"
								/>
								<span className="font-semibold">{facilityName}</span>
							</p>
						)}
					</div>
					<button
						onClick={onClose}
						className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
					{isLoadingPermissions && (
						<div className="animate-pulse space-y-3">
							<div className="h-4 w-2/3 rounded bg-[var(--muted)]" />
							<div className="h-4 w-1/2 rounded bg-[var(--muted)]" />
						</div>
					)}
					{/* Event Type — hidden for coaches (always COACHING_SLOT) */}
					{isFacilityOrAdmin && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								Event Type
							</label>
							<Select
								value={eventType}
								onChange={(e) => {
									setEventType(
										e.target.value as "BLOCK" | "BOOKABLE" | "COACHING_SLOT",
									);
									setProductId("");
								}}
								disabled={isEdit}
								className="h-9"
							>
								<option value="BOOKABLE">
									Bookable — students can register
								</option>
								<option value="BLOCK">Block — internal scheduling</option>
							</Select>
							{eventType !== "BLOCK" && (
								<p className="text-[var(--muted-foreground)] text-xs">
									Set visibility, capacity, and other details on the event page
									after creation.
								</p>
							)}
						</div>
					)}

					{/* Title */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
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
							<label className="font-medium text-[var(--foreground)] text-sm">
								Resource
							</label>
							<Select
								value={resourceId}
								onChange={(e) => setResourceId(e.target.value)}
								className="h-9"
							>
								<option value="">— No resource —</option>
								{resources.map((r) => (
									<option key={r.id} value={r.id}>
										{r.title}
									</option>
								))}
							</Select>
						</div>
					)}

					{/* All day */}
					<label className="flex cursor-pointer select-none items-center gap-2 text-[var(--foreground)] text-sm">
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
							<label className="font-medium text-[var(--foreground)] text-sm">
								Start
							</label>
							<Input
								type="datetime-local"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								step={DATETIME_STEP_SECONDS}
							/>
						</div>
					)}

					{/* End */}
					{!allDay && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								End
							</label>
							<Input
								type="datetime-local"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								step={DATETIME_STEP_SECONDS}
							/>
						</div>
					)}

					{/* Recurrence — new events only */}
					{!isEdit && (
						<div className="space-y-1">
							<RecurrenceEditor value={rruleOpts} onChange={setRruleOpts} />
						</div>
					)}

					{/* Recurrence scope selector — shown when editing a recurring event */}
					{isEdit && fetchedEvent?.rrule && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								Edit scope
							</label>
							<Select
								value={scope}
								onChange={(e) =>
									setScope(e.target.value as "THIS" | "THIS_AND_FUTURE" | "ALL")
								}
								className="h-9"
							>
								<option value="ALL">All events in series</option>
								<option value="THIS">This event only</option>
								<option value="THIS_AND_FUTURE">
									This and following events
								</option>
							</Select>
						</div>
					)}

					{/* Color picker */}
					<div className="space-y-2">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Color
						</label>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setColor("")}
								title="Default"
								className={`h-6 w-6 rounded-full border-2 bg-[var(--muted)] transition-all ${color === "" ? "scale-110 border-[var(--primary)]" : "border-transparent"}`}
							/>
							{COLOR_OPTIONS.map((opt) => (
								<button
									key={opt.bg}
									type="button"
									onClick={() => setColor(opt.bg)}
									title={opt.label}
									style={{ backgroundColor: opt.bg }}
									className={`h-6 w-6 rounded-full border-2 transition-all ${color === opt.bg ? "scale-110 border-[var(--primary)]" : "border-transparent"}`}
								/>
							))}
						</div>
					</div>

					{/* Product selector — shown for BOOKABLE and COACHING_SLOT */}
					{eventType !== "BLOCK" && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								Linked Product
							</label>
							<Select
								value={productId}
								onChange={(e) => setProductId(e.target.value)}
								className="h-9"
							>
								<option value="">— No product (free) —</option>
								{productsData?.products.map((p) => (
									<option key={p.productId} value={p.productId}>
										{p.name} (${(p.priceInCents / 100).toFixed(2)})
									</option>
								))}
							</Select>
							{!productsData?.products.length && (
								<p className="text-[var(--muted-foreground)] text-xs">
									No products found.{" "}
									<a href="/products" className="underline">
										Create one first.
									</a>
								</p>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-[var(--border)] border-t px-6 py-4">
					<div className="flex items-center gap-2">
						{isEdit && !isLoadingPermissions && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDelete}
								className="border-red-200 text-red-600 hover:bg-red-50"
							>
								<Trash2 size={14} />
								Delete
							</Button>
						)}
						{isEdit &&
							dbEventId &&
							fetchedEvent &&
							(fetchedEvent.eventType === "BOOKABLE" ||
								fetchedEvent.eventType === "COACHING_SLOT") && (
								<Link
									href={`/events/${dbEventId}`}
									onClick={onClose}
									className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)] text-sm transition-colors hover:text-[var(--foreground)]"
								>
									<ExternalLink size={13} /> Event Page
								</Link>
							)}
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={onClose}
							disabled={saving}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={!title.trim() || saving || isLoadingPermissions}
						>
							{saving ? "Saving…" : isEdit ? "Save" : "Create"}
						</Button>
					</div>
				</div>
			</div>
			<AlertDialog
				open={confirmDelete}
				title="Delete event"
				description={
					fetchedEvent?.rrule
						? `This will ${scope === "THIS" ? "remove this occurrence" : scope === "THIS_AND_FUTURE" ? "delete this and all following occurrences" : "delete the entire series"}. This cannot be undone.`
						: "This event will be permanently deleted. This cannot be undone."
				}
				confirmLabel="Delete"
				destructive
				onConfirm={executeDelete}
				onCancel={() => setConfirmDelete(false)}
			/>
		</>
	);
}
