"use client";

import {
	ArrowLeft,
	Building2,
	ChevronDown,
	ChevronUp,
	Clock,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import { api } from "~/trpc/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DayOfWeek =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

const ALL_DAYS: DayOfWeek[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

const DAYS: { key: DayOfWeek; label: string }[] = [
	{ key: "monday", label: "Mon" },
	{ key: "tuesday", label: "Tue" },
	{ key: "wednesday", label: "Wed" },
	{ key: "thursday", label: "Thu" },
	{ key: "friday", label: "Fri" },
	{ key: "saturday", label: "Sat" },
	{ key: "sunday", label: "Sun" },
];

// Hour (0-23) → "HH:00" for <input type="time">
function hourToTime(hour: number): string {
	return `${hour.toString().padStart(2, "0")}:00`;
}

// "HH:MM" → integer hour (0-23)
function timeToHour(time: string): number {
	const [h = "0"] = time.split(":");
	return Number.parseInt(h);
}

// ─── Resource Type Form ────────────────────────────────────────────────────────

function ResourceTypeForm({
	initial,
	onSave,
	onCancel,
	isSaving,
}: {
	initial?: { name: string; color: string; backgroundColor: string };
	onSave: (data: {
		name: string;
		color: string;
		backgroundColor: string;
	}) => void;
	onCancel: () => void;
	isSaving: boolean;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [color, setColor] = useState(initial?.color ?? "#4F46E5");
	const [backgroundColor, setBackgroundColor] = useState(
		initial?.backgroundColor ?? "#EFF6FF",
	);

	return (
		<div className="glass-panel space-y-3 rounded-lg p-4">
			<div>
				<label className="mb-1 block font-medium text-[var(--foreground)] text-sm">
					Name
				</label>
				<Input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Court, Room, Lane"
					maxLength={100}
				/>
			</div>
			<div className="flex gap-4">
				<div>
					<label className="mb-1 block font-medium text-[var(--foreground)] text-sm">
						Text color
					</label>
					<input
						type="color"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						className="h-9 w-16 cursor-pointer rounded border border-[var(--border)] bg-transparent"
					/>
				</div>
				<div>
					<label className="mb-1 block font-medium text-[var(--foreground)] text-sm">
						Background color
					</label>
					<input
						type="color"
						value={backgroundColor}
						onChange={(e) => setBackgroundColor(e.target.value)}
						className="h-9 w-16 cursor-pointer rounded border border-[var(--border)] bg-transparent"
					/>
				</div>
			</div>
			<div className="flex gap-2">
				<Button
					onClick={() => onSave({ name, color, backgroundColor })}
					disabled={!name.trim() || isSaving}
					size="sm"
				>
					{isSaving ? "Saving…" : "Save"}
				</Button>
				<Button onClick={onCancel} variant="outline" size="sm">
					Cancel
				</Button>
			</div>
		</div>
	);
}

// ─── Business Hours Editor ─────────────────────────────────────────────────────

function BusinessHoursEditor({
	resourceId,
	existingHours,
	onClose,
}: {
	resourceId: string;
	existingHours: { daysOfWeek: string[]; startTime: number; endTime: number }[];
	onClose: () => void;
}) {
	const utils = api.useUtils();

	const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
		(existingHours[0]?.daysOfWeek ?? []).filter((d): d is DayOfWeek =>
			ALL_DAYS.includes(d as DayOfWeek),
		),
	);
	const [startTime, setStartTime] = useState(
		hourToTime(existingHours[0]?.startTime ?? 8),
	);
	const [endTime, setEndTime] = useState(
		hourToTime(existingHours[0]?.endTime ?? 20),
	);

	const updateMutation = api.calendar.updateResourceBusinessHours.useMutation({
		onSuccess: () => {
			void utils.calendar.getResources.invalidate();
			onClose();
		},
	});

	const toggleDay = (day: DayOfWeek) => {
		setSelectedDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
		);
	};

	const handleSave = () => {
		if (selectedDays.length === 0) {
			updateMutation.mutate({ resourceId, businessHours: [] });
			return;
		}
		updateMutation.mutate({
			resourceId,
			businessHours: [
				{
					daysOfWeek: selectedDays,
					startTime: timeToHour(startTime),
					endTime: timeToHour(endTime),
				},
			],
		});
	};

	return (
		<div className="mt-3 space-y-3 glass-inset p-4">
			<p className="font-medium text-[var(--foreground)] text-sm">
				Business Hours
			</p>
			<div className="flex flex-wrap gap-2">
				{DAYS.map((d) => (
					<button
						key={d.key}
						onClick={() => toggleDay(d.key)}
						className={`rounded-md px-3 py-1 font-medium text-xs transition-colors ${
							selectedDays.includes(d.key)
								? "bg-[var(--primary)] text-[var(--primary-foreground)]"
								: "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
						}`}
					>
						{d.label}
					</button>
				))}
			</div>
			<div className="flex gap-4">
				<div>
					<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
						Open
					</label>
					<input
						type="time"
						value={startTime}
						onChange={(e) => setStartTime(e.target.value)}
						className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)] text-sm"
					/>
				</div>
				<div>
					<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
						Close
					</label>
					<input
						type="time"
						value={endTime}
						onChange={(e) => setEndTime(e.target.value)}
						className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)] text-sm"
					/>
				</div>
			</div>
			{updateMutation.error && (
				<p className="text-red-500 text-xs">{updateMutation.error.message}</p>
			)}
			<div className="flex gap-2">
				<Button
					onClick={handleSave}
					disabled={updateMutation.isPending}
					size="sm"
				>
					{updateMutation.isPending ? "Saving…" : "Save hours"}
				</Button>
				<Button onClick={onClose} variant="outline" size="sm">
					Cancel
				</Button>
			</div>
		</div>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ResourceManagerClient() {
	const utils = api.useUtils();

	// ── Facilities ──────────────────────────────────────────────────────────────
	const { data: facilitiesData } = api.calendar.getFacilities.useQuery();
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | "all">(
		"all",
	);
	// Default to first active facility once data loads
	const [hasInitializedFacility, setHasInitializedFacility] = useState(false);
	useEffect(() => {
		if (!hasInitializedFacility && facilitiesData) {
			const firstActive = facilitiesData.find((f) => f.isActive);
			if (firstActive) {
				setSelectedFacilityId(firstActive.facilityId);
			}
			setHasInitializedFacility(true);
		}
	}, [facilitiesData, hasInitializedFacility]);
	const [showFacilityForm, setShowFacilityForm] = useState(false);
	const [editingFacilityId, setEditingFacilityId] = useState<string | null>(
		null,
	);
	const [facilityName, setFacilityName] = useState("");
	const [facilityAddress, setFacilityAddress] = useState("");

	const createFacilityMutation = api.calendar.createFacility.useMutation({
		onSuccess: (newFacility) => {
			void utils.calendar.getFacilities.invalidate();
			setShowFacilityForm(false);
			setFacilityName("");
			setFacilityAddress("");
			setSelectedFacilityId(newFacility.facilityId);
		},
	});
	const updateFacilityMutation = api.calendar.updateFacility.useMutation({
		onSuccess: () => {
			void utils.calendar.getFacilities.invalidate();
			setEditingFacilityId(null);
			setFacilityName("");
			setFacilityAddress("");
		},
	});
	const deactivateFacilityMutation =
		api.calendar.deactivateFacility.useMutation({
			onSuccess: () => {
				void utils.calendar.getFacilities.invalidate();
				setSelectedFacilityId("all");
			},
		});

	function startEditFacility(f: {
		facilityId: string;
		name: string;
		address: string | null;
	}) {
		setEditingFacilityId(f.facilityId);
		setFacilityName(f.name);
		setFacilityAddress(f.address ?? "");
		setShowFacilityForm(false);
	}

	function handleSaveFacility() {
		if (!facilityName.trim()) return;
		if (editingFacilityId) {
			updateFacilityMutation.mutate({
				facilityId: editingFacilityId,
				name: facilityName,
				address: facilityAddress || null,
			});
		} else {
			createFacilityMutation.mutate({
				name: facilityName,
				address: facilityAddress || undefined,
			});
		}
	}

	const facilities = (facilitiesData ?? []).filter((f) => f.isActive);

	// ── Resource Types ──────────────────────────────────────────────────────────
	const { data: typesData } = api.calendar.getResourceTypes.useQuery({});
	const [showTypeForm, setShowTypeForm] = useState(false);
	const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

	const createTypeMutation = api.calendar.createResourceType.useMutation({
		onSuccess: () => {
			void utils.calendar.getResourceTypes.invalidate();
			setShowTypeForm(false);
		},
	});
	const updateTypeMutation = api.calendar.updateResourceType.useMutation({
		onSuccess: () => {
			void utils.calendar.getResourceTypes.invalidate();
			setEditingTypeId(null);
		},
	});
	const deleteTypeMutation = api.calendar.deleteResourceType.useMutation({
		onSuccess: () => void utils.calendar.getResourceTypes.invalidate(),
	});

	// ── Resources ───────────────────────────────────────────────────────────────
	const { data: resourcesData } = api.calendar.getResources.useQuery({});
	const [showResourceForm, setShowResourceForm] = useState(false);
	const [editingResourceId, setEditingResourceId] = useState<string | null>(
		null,
	);
	const [expandedHoursId, setExpandedHoursId] = useState<string | null>(null);

	// Resource form state
	const [resTitle, setResTitle] = useState("");
	const [resDescription, setResDescription] = useState("");
	const [resTypeId, setResTypeId] = useState("");
	const [resFacilityId, setResFacilityId] = useState<string | "">("");
	const [resColor, setResColor] = useState("#4F46E5");
	const [resBgColor, setResBgColor] = useState("#EFF6FF");

	const createResourceMutation = api.calendar.createResource.useMutation({
		onSuccess: () => {
			void utils.calendar.getResources.invalidate();
			void utils.calendar.getFacilities.invalidate();
			setShowResourceForm(false);
			resetResourceForm();
		},
	});
	const updateResourceMutation = api.calendar.updateResource.useMutation({
		onSuccess: () => {
			void utils.calendar.getResources.invalidate();
			void utils.calendar.getFacilities.invalidate();
			setEditingResourceId(null);
			resetResourceForm();
		},
	});
	const deleteResourceMutation = api.calendar.deleteResource.useMutation({
		onSuccess: () => {
			void utils.calendar.getResources.invalidate();
			void utils.calendar.getFacilities.invalidate();
		},
	});

	function resetResourceForm() {
		setResTitle("");
		setResDescription("");
		setResTypeId("");
		setResFacilityId("");
		setResColor("#4F46E5");
		setResBgColor("#EFF6FF");
	}

	function startEditResource(r: {
		resourceId: string;
		title: string;
		description: string | null;
		facilityId: string | null;
		resourceType: { resourceTypeId: string; name: string };
		color: string | null;
		backgroundColor: string | null;
	}) {
		setEditingResourceId(r.resourceId);
		setResTitle(r.title);
		setResDescription(r.description ?? "");
		setResTypeId(r.resourceType.resourceTypeId);
		setResFacilityId(r.facilityId ?? "");
		setResColor(r.color ?? "#4F46E5");
		setResBgColor(r.backgroundColor ?? "#EFF6FF");
		setShowResourceForm(false);
	}

	function handleSaveResource() {
		if (!resTitle.trim() || !resTypeId) return;
		const facilityId = resFacilityId || undefined;
		if (editingResourceId) {
			updateResourceMutation.mutate({
				resourceId: editingResourceId,
				title: resTitle,
				description: resDescription || undefined,
				resourceTypeId: resTypeId,
				facilityId: facilityId ?? null,
				color: resColor,
				backgroundColor: resBgColor,
			});
		} else {
			createResourceMutation.mutate({
				title: resTitle,
				description: resDescription || undefined,
				resourceTypeId: resTypeId,
				facilityId,
				color: resColor,
				backgroundColor: resBgColor,
			});
		}
	}

	const resourceTypes = typesData?.resourceTypes ?? [];
	const allResources = resourcesData?.resources ?? [];
	// Filter resources by selected facility
	const resources =
		selectedFacilityId === "all"
			? allResources
			: allResources.filter((r) => r.facilityId === selectedFacilityId);

	return (
		<div className="min-h-screen bg-[var(--background)] p-6">
			{/* Header */}
			<div className="mb-8 flex items-center gap-4">
				<Link
					href="/calendar"
					className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm transition-colors hover:text-[var(--foreground)]"
				>
					<ArrowLeft size={16} />
					Back to Calendar
				</Link>
				<h1 className="font-semibold text-2xl text-[var(--foreground)]">
					Manage Resources
				</h1>
			</div>

			{/* ── Facilities ────────────────────────────────────────────────── */}
			<section className="mb-8">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-medium text-[var(--foreground)] text-lg">
						Facilities
					</h2>
					<Button
						onClick={() => {
							setShowFacilityForm(true);
							setEditingFacilityId(null);
							setFacilityName("");
							setFacilityAddress("");
						}}
						size="sm"
					>
						<Plus size={14} className="mr-1" />
						Add facility
					</Button>
				</div>

				{showFacilityForm && (
					<div className="mb-4 space-y-3 glass-inset p-4">
						<p className="font-medium text-[var(--foreground)] text-sm">
							New facility
						</p>
						<div>
							<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
								Name
							</label>
							<Input
								type="text"
								value={facilityName}
								onChange={(e) => setFacilityName(e.target.value)}
								placeholder="e.g. Downtown Hall, Main Gym"
								maxLength={200}
							/>
						</div>
						<div>
							<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
								Address (optional)
							</label>
							<Input
								type="text"
								value={facilityAddress}
								onChange={(e) => setFacilityAddress(e.target.value)}
								placeholder="123 Main St"
							/>
						</div>
						{createFacilityMutation.error && (
							<p className="text-red-500 text-xs">
								{createFacilityMutation.error.message}
							</p>
						)}
						<div className="flex gap-2">
							<Button
								onClick={handleSaveFacility}
								disabled={
									!facilityName.trim() || createFacilityMutation.isPending
								}
								size="sm"
							>
								{createFacilityMutation.isPending ? "Saving…" : "Save"}
							</Button>
							<Button
								onClick={() => setShowFacilityForm(false)}
								variant="outline"
								size="sm"
							>
								Cancel
							</Button>
						</div>
					</div>
				)}

				{/* Facility tabs / pills */}
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setSelectedFacilityId("all")}
						className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${
							selectedFacilityId === "all"
								? "bg-[var(--primary)] text-[var(--primary-foreground)]"
								: "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
						}`}
					>
						All ({allResources.length})
					</button>
					{facilities.map((f) => (
						<div key={f.facilityId} className="group relative flex items-center">
							<button
								onClick={() => setSelectedFacilityId(f.facilityId)}
								className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${
									selectedFacilityId === f.facilityId
										? "bg-[var(--primary)] text-[var(--primary-foreground)]"
										: "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
								}`}
							>
								<Building2 size={12} className="mr-1.5 inline" />
								{f.name} ({f.resourceCount})
							</button>
							<div className="ml-1 hidden gap-0.5 group-hover:flex">
								<button
									onClick={() => startEditFacility(f)}
									className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
									title="Edit facility"
								>
									<Pencil size={12} />
								</button>
								<button
									onClick={() => {
										if (
											confirm(
												`Deactivate "${f.name}"? Resources must be reassigned first.`,
											)
										) {
											deactivateFacilityMutation.mutate({
												facilityId: f.facilityId,
											});
										}
									}}
									className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
									title="Deactivate facility"
								>
									<Trash2 size={12} />
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Inline edit form for existing facility */}
				{editingFacilityId && (
					<div className="mt-3 space-y-3 glass-inset p-4">
						<p className="font-medium text-[var(--foreground)] text-sm">
							Edit facility
						</p>
						<div>
							<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
								Name
							</label>
							<Input
								type="text"
								value={facilityName}
								onChange={(e) => setFacilityName(e.target.value)}
								maxLength={200}
							/>
						</div>
						<div>
							<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
								Address (optional)
							</label>
							<Input
								type="text"
								value={facilityAddress}
								onChange={(e) => setFacilityAddress(e.target.value)}
							/>
						</div>
						{updateFacilityMutation.error && (
							<p className="text-red-500 text-xs">
								{updateFacilityMutation.error.message}
							</p>
						)}
						{deactivateFacilityMutation.error && (
							<p className="text-red-500 text-xs">
								{deactivateFacilityMutation.error.message}
							</p>
						)}
						<div className="flex gap-2">
							<Button
								onClick={handleSaveFacility}
								disabled={
									!facilityName.trim() || updateFacilityMutation.isPending
								}
								size="sm"
							>
								{updateFacilityMutation.isPending ? "Saving…" : "Save"}
							</Button>
							<Button
								onClick={() => {
									setEditingFacilityId(null);
									setFacilityName("");
									setFacilityAddress("");
								}}
								variant="outline"
								size="sm"
							>
								Cancel
							</Button>
						</div>
					</div>
				)}
			</section>

			<div className="grid gap-8 lg:grid-cols-2">
				{/* ── Resource Types ─────────────────────────────────────────────── */}
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-medium text-[var(--foreground)] text-lg">
							Resource Types
						</h2>
						<Button
							onClick={() => {
								setShowTypeForm(true);
								setEditingTypeId(null);
							}}
							size="sm"
						>
							<Plus size={14} className="mr-1" />
							Add type
						</Button>
					</div>

					{showTypeForm && (
						<div className="mb-4">
							<ResourceTypeForm
								onSave={(data) => createTypeMutation.mutate(data)}
								onCancel={() => setShowTypeForm(false)}
								isSaving={createTypeMutation.isPending}
							/>
							{createTypeMutation.error && (
								<p className="mt-1 text-red-500 text-xs">
									{createTypeMutation.error.message}
								</p>
							)}
						</div>
					)}

					<div className="space-y-3">
						{resourceTypes.length === 0 && (
							<p className="text-[var(--muted-foreground)] text-sm">
								No resource types yet.
							</p>
						)}
						{resourceTypes.map((rt) => (
							<div
								key={rt.resourceTypeId}
								className="glass-card rounded-lg p-4"
							>
								{editingTypeId === rt.resourceTypeId ? (
									<ResourceTypeForm
										initial={{
											name: rt.name,
											color: rt.color ?? "#4F46E5",
											backgroundColor: rt.backgroundColor ?? "#EFF6FF",
										}}
										onSave={(data) =>
											updateTypeMutation.mutate({
												resourceTypeId: rt.resourceTypeId,
												...data,
											})
										}
										onCancel={() => setEditingTypeId(null)}
										isSaving={updateTypeMutation.isPending}
									/>
								) : (
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span
												className="h-4 w-4 rounded-full border border-[var(--border)]"
												style={{ backgroundColor: rt.color ?? "#4F46E5" }}
											/>
											<span className="font-medium text-[var(--foreground)]">
												{rt.name}
											</span>
											<span className="text-[var(--muted-foreground)] text-xs">
												{rt._count?.resources ?? 0} resource
												{(rt._count?.resources ?? 0) !== 1 ? "s" : ""}
											</span>
										</div>
										<div className="flex gap-1">
											<button
												onClick={() => setEditingTypeId(rt.resourceTypeId)}
												className="rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
												title="Edit"
											>
												<Pencil size={14} />
											</button>
											<button
												onClick={() => {
													if (
														confirm(
															`Delete resource type "${rt.name}"? This will fail if active resources use it.`,
														)
													) {
														deleteTypeMutation.mutate({
															resourceTypeId: rt.resourceTypeId,
														});
													}
												}}
												className="rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-500"
												title="Delete"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								)}
								{deleteTypeMutation.error && (
									<p className="mt-1 text-red-500 text-xs">
										{deleteTypeMutation.error.message}
									</p>
								)}
							</div>
						))}
					</div>
				</section>

				{/* ── Resources ──────────────────────────────────────────────────── */}
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-medium text-[var(--foreground)] text-lg">
							Resources
						</h2>
						<Button
							onClick={() => {
								setShowResourceForm(true);
								setEditingResourceId(null);
								resetResourceForm();
							}}
							disabled={resourceTypes.length === 0}
							size="sm"
							title={
								resourceTypes.length === 0
									? "Create a resource type first"
									: undefined
							}
						>
							<Plus size={14} className="mr-1" />
							Add resource
						</Button>
					</div>

					{/* Resource form (create or edit) */}
					{(showResourceForm || editingResourceId) && (
						<div className="mb-4 space-y-3 glass-inset p-4">
							<p className="font-medium text-[var(--foreground)] text-sm">
								{editingResourceId ? "Edit resource" : "New resource"}
							</p>
							<div>
								<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
									Type
								</label>
								<select
									value={resTypeId}
									onChange={(e) => setResTypeId(e.target.value)}
									className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] text-sm focus:border-[var(--primary)] focus:outline-none"
								>
									<option value="">Select type…</option>
									{resourceTypes.map((rt) => (
										<option key={rt.resourceTypeId} value={rt.resourceTypeId}>
											{rt.name}
										</option>
									))}
								</select>
							</div>
							{facilities.length > 0 && (
								<div>
									<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
										Facility
									</label>
									<select
										value={resFacilityId}
										onChange={(e) => setResFacilityId(e.target.value)}
										className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] text-sm focus:border-[var(--primary)] focus:outline-none"
									>
										<option value="">Unassigned</option>
										{facilities.map((f) => (
											<option key={f.facilityId} value={f.facilityId}>
												{f.name}
											</option>
										))}
									</select>
								</div>
							)}
							<div>
								<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
									Title
								</label>
								<Input
									type="text"
									value={resTitle}
									onChange={(e) => setResTitle(e.target.value)}
									placeholder="e.g. Court 1, Studio A"
									maxLength={200}
								/>
							</div>
							<div>
								<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
									Description (optional)
								</label>
								<Input
									type="text"
									value={resDescription}
									onChange={(e) => setResDescription(e.target.value)}
									placeholder="Short description"
								/>
							</div>
							<div className="flex gap-4">
								<div>
									<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
										Text color
									</label>
									<input
										type="color"
										value={resColor}
										onChange={(e) => setResColor(e.target.value)}
										className="h-9 w-16 cursor-pointer rounded border border-[var(--border)] bg-transparent"
									/>
								</div>
								<div>
									<label className="mb-1 block text-[var(--muted-foreground)] text-xs">
										Background
									</label>
									<input
										type="color"
										value={resBgColor}
										onChange={(e) => setResBgColor(e.target.value)}
										className="h-9 w-16 cursor-pointer rounded border border-[var(--border)] bg-transparent"
									/>
								</div>
							</div>
							{(createResourceMutation.error ??
								updateResourceMutation.error) && (
								<p className="text-red-500 text-xs">
									{
										(
											createResourceMutation.error ??
											updateResourceMutation.error
										)?.message
									}
								</p>
							)}
							<div className="flex gap-2">
								<Button
									onClick={handleSaveResource}
									disabled={
										!resTitle.trim() ||
										!resTypeId ||
										createResourceMutation.isPending ||
										updateResourceMutation.isPending
									}
									size="sm"
								>
									{createResourceMutation.isPending ||
									updateResourceMutation.isPending
										? "Saving…"
										: "Save"}
								</Button>
								<Button
									onClick={() => {
										setShowResourceForm(false);
										setEditingResourceId(null);
										resetResourceForm();
									}}
									variant="outline"
									size="sm"
								>
									Cancel
								</Button>
							</div>
						</div>
					)}

					<div className="space-y-3">
						{resources.length === 0 && (
							<p className="text-[var(--muted-foreground)] text-sm">
								No resources yet.
							</p>
						)}
						{resources.map((r) => (
							<div key={r.resourceId} className="glass-card rounded-lg p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<span
											className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border border-[var(--border)]"
											style={{ backgroundColor: r.color ?? "#4F46E5" }}
										/>
										<div>
											<p className="font-medium text-[var(--foreground)]">
												{r.title}
											</p>
											<p className="text-[var(--muted-foreground)] text-xs">
												{r.resourceType?.name}
												{r.facilityId
													? ` · ${facilities.find((f) => f.facilityId === r.facilityId)?.name ?? "Unknown"}`
													: ""}
												{r.description ? ` · ${r.description}` : ""}
											</p>
										</div>
									</div>
									<div className="flex gap-1">
										<button
											onClick={() =>
												setExpandedHoursId(
													expandedHoursId === r.resourceId
														? null
														: r.resourceId,
												)
											}
											className="flex items-center gap-0.5 rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
											title="Business hours"
										>
											<Clock size={14} />
											{expandedHoursId === r.resourceId ? (
												<ChevronUp size={10} />
											) : (
												<ChevronDown size={10} />
											)}
										</button>
										<button
											onClick={() => startEditResource(r)}
											className="rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
											title="Edit"
										>
											<Pencil size={14} />
										</button>
										<button
											onClick={() => {
												if (
													confirm(
														`Deactivate "${r.title}"? It will no longer appear on the calendar.`,
													)
												) {
													deleteResourceMutation.mutate({
														resourceId: r.resourceId,
													});
												}
											}}
											className="rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-500"
											title="Deactivate"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>

								{/* Business hours inline editor */}
								{expandedHoursId === r.resourceId && (
									<BusinessHoursEditor
										resourceId={r.resourceId}
										existingHours={r.businessHours}
										onClose={() => setExpandedHoursId(null)}
									/>
								)}
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
