"use client";

import { MediaCoachNoteType, UserType } from "@prisma/client";
import { AlertCircle, Edit, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { ProfileAvatar } from "~/app/_components/shared/ProfileAvatar";
import YouTubeEmbed from "~/app/_components/shared/YouTubeEmbed";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import CoachingNoteForm from "./CoachingNoteForm";

interface CoachingNotesListProps {
	mediaId: string;
	userType?: UserType;
	className?: string;
}

export default function CoachingNotesList({
	mediaId,
	userType,
	className,
}: CoachingNotesListProps) {
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);

	const utils = api.useUtils();

	// Fetch coaching notes for this media
	const {
		data: notes,
		isLoading,
		error,
	} = api.coachingNotes.getNotesByMedia.useQuery({ mediaId });

	// Delete note mutation
	const deleteNote = api.coachingNotes.deleteNote.useMutation({
		onSuccess: () => {
			// Invalidate and refetch notes and dashboard metrics
			utils.coachingNotes.getNotesByMedia.invalidate({ mediaId });
			utils.user.getCoachDashboardMetrics.invalidate();
			utils.videoCollection.getAllMediaForCoaches.invalidate();
		},
		onError: (error) => {
			console.error("Error deleting note:", error);
		},
	});

	const canCreateNotes =
		userType === UserType.COACH || userType === UserType.ADMIN;

	const handleDeleteNote = async (noteId: string) => {
		if (window.confirm("Are you sure you want to delete this coaching note?")) {
			deleteNote.mutate({ noteId });
		}
	};

	const handleEditNote = (noteId: string) => {
		setEditingNoteId(noteId);
		setShowAddForm(false);
	};

	const handleCancelEdit = () => {
		setEditingNoteId(null);
	};

	const handleSuccessEdit = () => {
		setEditingNoteId(null);
	};

	const handleShowAddForm = () => {
		setShowAddForm(true);
		setEditingNoteId(null);
	};

	const handleCancelAdd = () => {
		setShowAddForm(false);
	};

	const handleSuccessAdd = () => {
		setShowAddForm(false);
	};

	if (isLoading) {
		return (
			<div className={cn("space-y-4", className)}>
				<div className="flex items-center justify-between">
					<h3 className="flex items-center font-semibold text-lg">
						<MessageSquare className="mr-2 h-5 w-5" />
						Coaching Notes
					</h3>
				</div>
				<div className="animate-pulse space-y-3">
					<div className="h-4 w-1/4 rounded bg-gray-200"></div>
					<div className="h-20 rounded bg-gray-200"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={cn("space-y-4", className)}>
				<div className="flex items-center justify-between">
					<h3 className="flex items-center font-semibold text-lg">
						<MessageSquare className="mr-2 h-5 w-5" />
						Coaching Notes
					</h3>
				</div>
				<div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
					<AlertCircle className="mr-2 h-5 w-5" />
					<span>Error loading coaching notes: {error.message}</span>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between">
				<h3 className="flex items-center font-semibold text-lg">
					<MessageSquare className="mr-2 h-5 w-5" />
					Coaching Notes
					{notes && notes.length > 0 && (
						<span className="ml-2 rounded-full bg-[var(--primary-light)] px-2 py-1 text-[var(--primary)] text-xs">
							{notes.length}
						</span>
					)}
				</h3>

				{canCreateNotes && !showAddForm && !editingNoteId && (
					<Button onClick={handleShowAddForm} size="sm" variant="outline">
						<MessageSquare className="mr-1 h-4 w-4" />
						Add Note
					</Button>
				)}
			</div>

			{/* Add new note form */}
			{showAddForm && canCreateNotes && (
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<CoachingNoteForm
						mediaId={mediaId}
						onSuccess={handleSuccessAdd}
						onCancel={handleCancelAdd}
					/>
				</div>
			)}

			{/* Notes list */}
			{notes && notes.length > 0 ? (
				<div className="space-y-4">
					{notes.map((note) => {
						const isEditing = editingNoteId === note.noteId;
						const coachName =
							`${note.coach.firstName || ""} ${note.coach.lastName || ""}`.trim() ||
							note.coach.coachProfile?.displayUsername ||
							"Unknown Coach";

						return (
							<div
								key={note.noteId}
								className="rounded-lg border border-gray-200 bg-white p-4"
							>
								{isEditing ? (
									<CoachingNoteForm
										mediaId={mediaId}
										existingNote={{
											noteId: note.noteId,
											noteType: note.noteType,
											noteContent: note.noteContent,
											videoUrl: note.videoUrl,
										}}
										onSuccess={handleSuccessEdit}
										onCancel={handleCancelEdit}
									/>
								) : (
									<>
										<div className="mb-3 flex items-start justify-between">
											<div className="flex items-center space-x-3">
												<ProfileAvatar
													imageUrl={
														note.coach.coachProfile?.profileImage &&
														note.coach.coachProfile?.profileImageType
															? `data:${note.coach.coachProfile.profileImageType};base64,${Buffer.from(note.coach.coachProfile.profileImage).toString("base64")}`
															: null
													}
													name={
														`${note.coach.firstName || ""} ${note.coach.lastName || ""}`.trim() ||
														note.coach.coachProfile?.displayUsername
													}
													size="sm"
												/>
												<div>
													<div className="font-medium text-sm">{coachName}</div>
													<div className="text-gray-500 text-xs">
														{new Date(note.createdAt).toLocaleDateString()} at{" "}
														{new Date(note.createdAt).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
														{note.updatedAt !== note.createdAt && (
															<span className="ml-2 text-gray-400">
																(edited{" "}
																{new Date(note.updatedAt).toLocaleDateString()})
															</span>
														)}
													</div>
												</div>
											</div>

											{canCreateNotes && (
												<div className="flex items-center space-x-2">
													<Button
														onClick={() => handleEditNote(note.noteId)}
														size="sm"
														variant="outline"
														className="h-8 w-8 p-0"
													>
														<Edit className="h-3 w-3" />
													</Button>
													<Button
														onClick={() => handleDeleteNote(note.noteId)}
														size="sm"
														variant="outline"
														className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
														disabled={deleteNote.isPending}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											)}
										</div>

										{note.noteType === MediaCoachNoteType.TEXT && (
											<div className="whitespace-pre-wrap text-gray-700 text-sm">
												{note.noteContent ?? ""}
											</div>
										)}

										{note.noteType === MediaCoachNoteType.YOUTUBE &&
											note.videoUrl && (
												<div className="space-y-2">
													<YouTubeEmbed
														url={note.videoUrl}
														title={`Coaching response from ${coachName}`}
														className="max-w-xl"
													/>
												</div>
											)}
									</>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<div className="py-8 text-center text-gray-500">
					<MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
					<p className="text-sm">
						{canCreateNotes
							? "No coaching notes yet. Add the first note to provide feedback on this video."
							: "No coaching notes available for this video yet."}
					</p>
				</div>
			)}
		</div>
	);
}
