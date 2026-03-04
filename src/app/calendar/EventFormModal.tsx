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
import { X, Trash2 } from "lucide-react";
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
}: EventFormModalProps) {
	// isEdit: selectedEvent has a real db id (non-empty string) — not a new-event temp object
	const isEdit = !!(selectedEvent?.id && selectedEvent.id !== "");

	const [title, setTitle] = useState("");
	const [resourceId, setResourceId] = useState("");
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [description, setDescription] = useState("");
	const [allDay, setAllDay] = useState(false);
	const [rruleOpts, setRruleOpts] = useState<RRuleOptions | null>(null);
	const [saving, setSaving] = useState(false);

	// Reset saving state when modal opens
	useEffect(() => {
		if (open) {
			setSaving(false);
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
			setDescription(selectedEvent.description ?? "");
			setAllDay(selectedEvent.allDay ?? false);
			setRruleOpts((selectedEvent.rrule as RRuleOptions | undefined) ?? null);
		} else if (selectedEvent) {
			// New event — pre-fill times from clicked slot
			setTitle("");
			setResourceId(selectedEvent.resourceId?.toString() ?? "");
			setStart(toDatetimeLocal(selectedEvent.start));
			setEnd(toDatetimeLocal(selectedEvent.end));
			setDescription("");
			setAllDay(selectedEvent.allDay ?? false);
			setRruleOpts(null);
		} else {
			setTitle("");
			setResourceId("");
			setStart(toDatetimeLocal(dayjs()));
			setEnd(toDatetimeLocal(dayjs().add(1, "hour")));
			setDescription("");
			setAllDay(false);
			setRruleOpts(null);
		}
	}, [open, selectedEvent, isEdit]);

	// All hooks must be above early return (rules of hooks)
	const utils = api.useUtils();
	const { toast } = useToast();
	
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
		description: description || undefined,
		resourceId: resourceId || undefined,
		allDay,
		// Don't forward color/backgroundColor — server defaults apply
		color: undefined,
		backgroundColor: undefined,
	} as IlamyCalendarEvent), [selectedEvent, title, start, end, description, resourceId, allDay]);

	if (!open) return null;

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
				description: description || undefined,
				resourceId: resourceId || undefined,
				allDay,
			});
		} else {
			createMutation.mutate({
				title,
				start: startDate,
				end: endDate,
				description: description || undefined,
				resourceId: resourceId || undefined,
				allDay,
				rrule: rruleOpts
					? new RRule(rruleOpts as ConstructorParameters<typeof RRule>[0]).toString()
					: undefined,
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
						{isEdit ? "Edit Event" : "New Event"}
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

					{/* Description */}
					<div className="space-y-1">
						<label className="text-sm font-medium text-[var(--foreground)]">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Optional description"
							className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-muted-foreground outline-none resize-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
					<div>
						{isEdit && (
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
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave} disabled={!title.trim() || saving}>
							{saving ? "Saving…" : isEdit ? "Save" : "Create"}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
