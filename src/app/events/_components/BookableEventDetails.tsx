"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import { useToast } from "~/app/_components/shared/Toast";
import { api } from "~/trpc/react";

type EventDetail = {
	eventId: string;
	title: string;
	eventType: string;
	description: string | null;
	isPublic: boolean;
	maxParticipants: number | null;
	registrationType: string | null;
	rrule: string | null;
	start: Date;
	end: Date;
	showRegistrantNames: boolean;
	resource: { title: string; color: string | null } | null;
	product: {
		productId: string;
		name: string;
		priceInCents: number;
		currency: string;
	} | null;
	createdByUser: {
		firstName: string | null;
		lastName: string | null;
		coachProfile?: { displayUsername: string | null } | null;
	} | null;
	_count: { registrations: number };
	registrants?: { firstName: string | null; lastInitial: string }[];
};

interface BookableEventDetailsProps {
	event: EventDetail;
	readOnly?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
	BLOCK: "Block",
	BOOKABLE: "Bookable",
	COACHING_SLOT: "Coaching Slot",
};

const REGISTRATION_TYPE_LABELS: Record<string, string> = {
	PER_INSTANCE: "Per occurrence",
	PER_SERIES: "Entire series",
};

export default function BookableEventDetails({
	event,
	readOnly = false,
}: BookableEventDetailsProps) {
	const { toast } = useToast();
	const utils = api.useUtils();

	const [description, setDescription] = useState(event.description ?? "");
	const [isPublic, setIsPublic] = useState(event.isPublic);
	const [maxParticipants, setMaxParticipants] = useState<string>(
		event.maxParticipants != null ? String(event.maxParticipants) : "",
	);
	const [registrationType, setRegistrationType] = useState<string>(
		event.registrationType ?? "PER_INSTANCE",
	);
	const [showRegistrantNames, setShowRegistrantNames] = useState(
		event.showRegistrantNames,
	);
	const [dirty, setDirty] = useState(false);

	// Track changes
	useEffect(() => {
		const changed =
			description !== (event.description ?? "") ||
			isPublic !== event.isPublic ||
			maxParticipants !==
				(event.maxParticipants != null ? String(event.maxParticipants) : "") ||
			registrationType !== (event.registrationType ?? "PER_INSTANCE") ||
			showRegistrantNames !== event.showRegistrantNames;
		setDirty(changed);
	}, [
		description,
		isPublic,
		maxParticipants,
		registrationType,
		showRegistrantNames,
		event,
	]);

	const updateMutation = api.calendar.updateEventDetails.useMutation({
		onSuccess: () => {
			void utils.calendar.getEventById.invalidate({ eventId: event.eventId });
			void utils.calendar.getEvents.invalidate();
			setDirty(false);
			toast("Event details saved", "success");
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});

	const handleSave = () => {
		const maxParsed =
			maxParticipants.trim() === ""
				? null
				: Number.parseInt(maxParticipants, 10);
		if (
			maxParticipants.trim() !== "" &&
			(isNaN(maxParsed!) || maxParsed! < 1)
		) {
			toast("Max participants must be a positive number", "error");
			return;
		}
		updateMutation.mutate({
			eventId: event.eventId,
			description: description.trim() || null,
			isPublic,
			maxParticipants: maxParsed,
			registrationType:
				(registrationType as "PER_INSTANCE" | "PER_SERIES") ?? null,
			showRegistrantNames,
		});
	};

	const formatPrice = (cents: number, currency: string) =>
		new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(cents / 100);

	return (
		<div className="space-y-6">
			{/* Read-only summary */}
			<div className="glass-card space-y-3 rounded-lg p-5">
				<h2 className="font-semibold text-[var(--foreground)] text-lg">
					{event.title}
				</h2>
				<div className="flex flex-wrap gap-3 text-[var(--muted-foreground)] text-sm">
					<span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 font-medium text-[var(--foreground)] text-xs">
						{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
					</span>
					{event.createdByUser && event.eventType === "COACHING_SLOT" && (
						<span>
							Coach:{" "}
							{event.createdByUser.coachProfile?.displayUsername ? (
								<Link
									href={`/coaches/${event.createdByUser.coachProfile.displayUsername}`}
									className="text-[var(--primary)] hover:underline"
								>
									{event.createdByUser.firstName}
								</Link>
							) : (
								<span className="text-[var(--foreground)]">{event.createdByUser.firstName}</span>
							)}
						</span>
					)}
					{event.resource && (
						<span>
							Resource:{" "}
							<span className="text-[var(--foreground)]">
								{event.resource.title}
							</span>
						</span>
					)}
					{event.product && (
						<span>
							Product:{" "}
							<span className="text-[var(--foreground)]">
								{event.product.name} (
								{formatPrice(
									event.product.priceInCents,
									event.product.currency,
								)}
								)
							</span>
						</span>
					)}
					<span>
						Registrations:{" "}
						<span className="text-[var(--foreground)]">
							{event._count.registrations}
							{event.maxParticipants != null
								? ` / ${event.maxParticipants}`
								: ""}
						</span>
					</span>
					{event.rrule && (
						<span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 font-medium text-[var(--foreground)] text-xs">
							Recurring
						</span>
					)}
				</div>
			</div>

			{/* Editable fields */}
			{!readOnly && event.eventType !== "BLOCK" && (
				<div className="glass-card space-y-5 rounded-lg p-5">
					<h3 className="font-semibold text-[var(--foreground)] text-sm">
						Bookable Event Settings
					</h3>

					{/* Description */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							placeholder="Describe this event for participants…"
							className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[var(--foreground)] text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						/>
					</div>

					{/* isPublic toggle */}
					<div className="flex items-center justify-between rounded-md border border-[var(--border)] px-4 py-3">
						<div>
							<p className="font-medium text-[var(--foreground)] text-sm">
								Public event
							</p>
							<p className="text-[var(--muted-foreground)] text-xs">
								Visible to students on the calendar
							</p>
						</div>
						<button
							role="switch"
							aria-checked={isPublic}
							onClick={() => setIsPublic((v) => !v)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								isPublic ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
									isPublic ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					{/* showRegistrantNames toggle */}
					<div className="flex items-center justify-between rounded-md border border-[var(--border)] px-4 py-3">
						<div>
							<p className="font-medium text-[var(--foreground)] text-sm">
								Show registrant names publicly
							</p>
							<p className="text-[var(--muted-foreground)] text-xs">
								Display first name + last initial of registrants on the public
								event page
							</p>
						</div>
						<button
							role="switch"
							aria-checked={showRegistrantNames}
							onClick={() => setShowRegistrantNames((v) => !v)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								showRegistrantNames
									? "bg-[var(--primary)]"
									: "bg-[var(--muted)]"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
									showRegistrantNames ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					{/* Max participants */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Max participants
						</label>
						<Input
							type="number"
							min={1}
							value={maxParticipants}
							onChange={(e) => setMaxParticipants(e.target.value)}
							placeholder="Unlimited"
						/>
						<p className="text-[var(--muted-foreground)] text-xs">
							Leave blank for unlimited capacity
						</p>
					</div>

					{/* Registration type — only for recurring events */}
					{event.rrule && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								Registration type
							</label>
							<select
								value={registrationType}
								onChange={(e) => setRegistrationType(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[var(--foreground)] text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="PER_INSTANCE">
									Per occurrence — register for individual dates
								</option>
								<option value="PER_SERIES">
									Per series — register for all occurrences
								</option>
							</select>
						</div>
					)}

					{/* Save button */}
					<div className="flex justify-end pt-1">
						<Button
							size="sm"
							onClick={handleSave}
							disabled={!dirty || updateMutation.isPending}
						>
							<Save size={14} />
							{updateMutation.isPending ? "Saving…" : "Save Changes"}
						</Button>
					</div>
				</div>
			)}

			{/* Read-only detail view — shown when not in edit mode or for BLOCK events */}
			{(readOnly || event.eventType === "BLOCK") && (
				<div className="glass-card space-y-4 rounded-lg p-5">
					{event.description ? (
						<div>
							<h3 className="mb-1 font-semibold text-[var(--foreground)] text-sm">
								Description
							</h3>
							<p className="whitespace-pre-wrap text-[var(--muted-foreground)] text-sm">
								{event.description}
							</p>
						</div>
					) : (
						<p className="text-[var(--muted-foreground)] text-sm italic">
							No description provided.
						</p>
					)}
					{event.eventType !== "BLOCK" && (
						<div className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
							<div className="flex items-center justify-between px-4 py-3">
								<span className="text-[var(--muted-foreground)] text-sm">
									Visibility
								</span>
								<span
									className={`font-medium text-sm ${event.isPublic ? "text-green-600" : "text-[var(--muted-foreground)]"}`}
								>
									{event.isPublic ? "Public" : "Private"}
								</span>
							</div>
							<div className="flex items-center justify-between px-4 py-3">
								<span className="text-[var(--muted-foreground)] text-sm">
									Capacity
								</span>
								<span className="font-medium text-[var(--foreground)] text-sm">
									{event.maxParticipants != null
										? `${event._count.registrations} / ${event.maxParticipants}`
										: `${event._count.registrations} registered (unlimited)`}
								</span>
							</div>
							{event.registrationType && (
								<div className="flex items-center justify-between px-4 py-3">
									<span className="text-[var(--muted-foreground)] text-sm">
										Registration
									</span>
									<span className="font-medium text-[var(--foreground)] text-sm">
										{REGISTRATION_TYPE_LABELS[event.registrationType] ??
											event.registrationType}
									</span>
								</div>
							)}
						</div>
					)}
					{event.showRegistrantNames &&
						event.registrants &&
						event.registrants.length > 0 && (
							<div>
								<h3 className="mb-1 font-semibold text-[var(--foreground)] text-sm">
									Registered
								</h3>
								<p className="text-[var(--muted-foreground)] text-sm">
									{event.registrants
										.map((r) => `${r.firstName ?? ""} ${r.lastInitial}`.trim())
										.join(", ")}
								</p>
							</div>
						)}
				</div>
			)}
		</div>
	);
}
