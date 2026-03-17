"use client";

import { UserType } from "@prisma/client";
import { Check, ExternalLink, Pencil, Play, X } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { getEmbedUrl } from "~/lib/videoUtils";
import { api } from "~/trpc/react";
import { useToast } from "~/app/_components/shared/Toast";
import CoachSelector from "./CoachSelector";
import CoachingNotesList from "./CoachingNotesList";

interface VideoCollectionDisplayProps {
	collectionId: string;
}

// ---------------------------------------------------------------------------
// Shared inline-edit header for the collection title + description
// ---------------------------------------------------------------------------
interface CollectionHeaderProps {
	title: string;
	description: string | null;
	canEdit: boolean;
	isEditing: boolean;
	editTitle: string;
	editDescription: string;
	isPending: boolean;
	onEditStart: () => void;
	onEditSave: () => void;
	onEditCancel: () => void;
	onTitleChange: (v: string) => void;
	onDescriptionChange: (v: string) => void;
}

function CollectionHeader({
	title,
	description,
	canEdit,
	isEditing,
	editTitle,
	editDescription,
	isPending,
	onEditStart,
	onEditSave,
	onEditCancel,
	onTitleChange,
	onDescriptionChange,
}: CollectionHeaderProps) {
	if (isEditing) {
		return (
			<div className="mb-6 space-y-3">
				<input
					type="text"
					value={editTitle}
					onChange={(e) => onTitleChange(e.target.value)}
					className="w-full rounded-lg border border-[var(--primary)] px-3 py-2 font-bold text-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
					placeholder="Collection title"
					autoFocus
				/>
				<textarea
					value={editDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					rows={3}
					className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-600 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/40"
					placeholder="Description (optional)"
				/>
				<div className="flex gap-2">
					<button
						onClick={onEditSave}
						disabled={isPending}
						className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
					>
						<Check size={14} />
						{isPending ? "Saving…" : "Save"}
					</button>
					<button
						onClick={onEditCancel}
						disabled={isPending}
						className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-50"
					>
						<X size={14} /> Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="mb-6 flex items-start justify-between gap-3">
			<div>
				<h1 className="section-heading">{title}</h1>
				{description && (
					<p className="section-subheading">{description}</p>
				)}
			</div>
			{canEdit && (
				<button
					onClick={onEditStart}
					className="mt-1 flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-gray-600 text-sm transition-colors hover:bg-gray-50"
				>
					<Pencil size={13} /> Edit
				</button>
			)}
		</div>
	);
}

export default function VideoCollectionDisplay({
	collectionId,
}: VideoCollectionDisplayProps) {
	const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const { toast } = useToast();

	// Fetch the video collection and its media
	const {
		data: collection,
		isLoading,
		error,
		refetch,
	} = api.videoCollection.getById.useQuery({ collectionId });

	// Get user profile to determine permissions
	const { data: user } = api.user.getOrCreateProfile.useQuery();

	// Update mutation for title/description (B2)
	const utils = api.useUtils();
	const updateMutation = api.videoCollection.updateVideoCollection.useMutation({
		onSuccess: () => {
			void utils.videoCollection.getById.invalidate({ collectionId });
			setIsEditing(false);
			toast("Collection updated", "success");
		},
		onError: (err) => toast(err.message, "error"),
	});

	const handleEditStart = () => {
		setEditTitle(collection?.title ?? "");
		setEditDescription(collection?.description ?? "");
		setIsEditing(true);
	};

	const handleEditSave = () => {
		if (!editTitle.trim()) {
			toast("Title is required", "error");
			return;
		}
		updateMutation.mutate({
			collectionId,
			title: editTitle.trim(),
			description: editDescription.trim() || undefined,
		});
	};

	// Handle coach assignment updates
	const handleCoachAssigned = (_coachId: string | null) => {
		// Refetch the collection to get updated coach assignment
		refetch();
	};

	// Check if current user is the collection owner
	const isOwner = user && collection && user.userId === collection.userId;
	const isUploader =
		user && collection && user.userId === collection.uploadedByUserId;

	const isAdminUser = user?.userType === UserType.ADMIN;
	const isFacilityUser = user?.userType === UserType.FACILITY;
	// Can edit title/description: owner, uploader, or admin.
	// An assigned coach may edit only if they are also the owner/uploader.
	const canEditMetadata = Boolean(isAdminUser || isOwner || isUploader);
	const isFacilitySameClub =
		isFacilityUser &&
		user?.clubShortName != null &&
		user.clubShortName === collection?.user?.clubShortName;

	const canAssignCoach =
		Boolean(user && collection) &&
		(isOwner || isAdminUser || isFacilitySameClub);

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="animate-pulse-slow">Loading collection...</div>
			</div>
		);
	}

	if (error || !collection) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
				<h2 className="font-medium">Error loading collection</h2>
				<p>{error?.message || "Collection not found"}</p>
			</div>
		);
	}

	// Filter out deleted media
	const videos = collection.media.filter((media: any) => !media.isDeleted);

	if (videos.length === 0) {
		return (
			<div className="glass-panel p-6">
				<CollectionHeader
					title={collection.title}
					description={collection.description}
					canEdit={canEditMetadata}
					isEditing={isEditing}
					editTitle={editTitle}
					editDescription={editDescription}
					isPending={updateMutation.isPending}
					onEditStart={handleEditStart}
					onEditSave={handleEditSave}
					onEditCancel={() => setIsEditing(false)}
					onTitleChange={setEditTitle}
					onDescriptionChange={setEditDescription}
				/>
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700">
					No videos available in this collection.
				</div>
			</div>
		);
	}

	// Make sure we have a valid active video
	const activeVideo = videos[activeVideoIndex] || videos[0];

	// If somehow we still don't have a valid video, show an error
	if (!activeVideo) {
		return (
			<div className="glass-panel p-6">
				<CollectionHeader
					title={collection.title}
					description={collection.description}
					canEdit={canEditMetadata}
					isEditing={isEditing}
					editTitle={editTitle}
					editDescription={editDescription}
					isPending={updateMutation.isPending}
					onEditStart={handleEditStart}
					onEditSave={handleEditSave}
					onEditCancel={() => setIsEditing(false)}
					onTitleChange={setEditTitle}
					onDescriptionChange={setEditDescription}
				/>
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
					No valid video found in this collection.
				</div>
			</div>
		);
	}

	return (
		<div className="animate-slide-up">
			<div className="glass-panel p-6">
				<CollectionHeader
					title={collection.title}
					description={collection.description}
					canEdit={canEditMetadata}
					isEditing={isEditing}
					editTitle={editTitle}
					editDescription={editDescription}
					isPending={updateMutation.isPending}
					onEditStart={handleEditStart}
					onEditSave={handleEditSave}
					onEditCancel={() => setIsEditing(false)}
					onTitleChange={setEditTitle}
					onDescriptionChange={setEditDescription}
				/>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Main video player */}
					<div className="space-y-6 lg:col-span-2">
						<div>
							<div className="aspect-video overflow-hidden rounded-lg bg-black">
								{activeVideo.videoUrl && (
									<iframe
										src={getEmbedUrl(activeVideo.videoUrl)}
										className="h-full w-full"
										title={activeVideo.title}
										allowFullScreen
										frameBorder="0"
									/>
								)}
							</div>

							<div className="mt-4">
								<h2 className="font-semibold text-xl">{activeVideo.title}</h2>
								{activeVideo.description && (
									<p className="mt-2 text-gray-600">
										{activeVideo.description}
									</p>
								)}

								<div className="mt-4 flex items-center">
									<a
										href={activeVideo.videoUrl || "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center text-[var(--primary)] hover:underline"
									>
										<ExternalLink className="mr-1 h-4 w-4" />
										Open in new tab
									</a>
								</div>
							</div>
						</div>

						{/* Coaching Notes Section */}
						<div className="glass-panel p-6">
							<CoachingNotesList
								mediaId={activeVideo.mediaId}
								userType={user?.userType}
								isOwner={Boolean(isOwner)}
								isUploader={Boolean(isUploader)}
								currentUserId={user?.userId}
							/>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6 lg:col-span-1">
						{/* Coach Selector */}
						{canAssignCoach && (
							<CoachSelector
								collectionId={collectionId}
								clubShortName={collection.user?.clubShortName}
								currentCoachId={collection.assignedCoachId}
								onCoachAssigned={handleCoachAssigned}
							/>
						)}

						{/* Currently assigned coach display for non-owners */}
						{!canAssignCoach && collection.assignedCoach && (
							<div className="glass-panel p-4">
								<h3 className="mb-3 font-medium text-gray-900">
									Assigned Coach
								</h3>
								<div className="flex items-center rounded-lg border border-blue-200 bg-blue-50 p-3">
									<div className="flex-1">
										<p className="font-medium text-blue-900">
											{collection.assignedCoach.coachProfile?.displayUsername ||
												`${collection.assignedCoach.firstName} ${collection.assignedCoach.lastName}`}
										</p>
										<p className="text-blue-700 text-sm">
											{collection.assignedCoach.club?.clubName}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Video list */}
						<div>
							<h3 className="mb-3 font-medium">Videos in this collection</h3>
							<div className="space-y-3">
								{videos.map((video: any, index: number) => (
									<div
										key={video.mediaId}
										onClick={() => setActiveVideoIndex(index)}
										className={cn(
											"cursor-pointer rounded-lg border p-3 transition-colors",
											activeVideoIndex === index
												? "border-[var(--primary)] bg-[var(--primary-light)]"
												: "border-gray-200 bg-white hover:bg-gray-50",
										)}
									>
										<div className="flex items-center">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
												{activeVideoIndex === index ? (
													<Play className="h-4 w-4 fill-current" />
												) : (
													<span className="font-medium">{index + 1}</span>
												)}
											</div>
											<div className="ml-3 flex-1 truncate">
												<h4 className="font-medium text-sm">{video.title}</h4>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
