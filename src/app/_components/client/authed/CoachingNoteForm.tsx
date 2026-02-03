"use client";

import { MediaCoachNoteType } from "@prisma/client";
import { AlertCircle, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { cn } from "~/lib/utils";
import { extractYouTubeId } from "~/lib/videoUtils";
import { api } from "~/trpc/react";

interface CoachingNoteFormProps {
	mediaId: string;
	existingNote?: {
		noteId: string;
		noteType: MediaCoachNoteType;
		noteContent: string | null;
		videoUrl: string | null;
	};
	onSuccess?: () => void;
	onCancel?: () => void;
}

export default function CoachingNoteForm({
	mediaId,
	existingNote,
	onSuccess,
	onCancel,
}: CoachingNoteFormProps) {
	const [noteType, setNoteType] = useState<MediaCoachNoteType>(
		existingNote?.noteType ?? MediaCoachNoteType.TEXT,
	);
	const [noteContent, setNoteContent] = useState(
		existingNote?.noteContent ?? "",
	);
	const [videoUrl, setVideoUrl] = useState(existingNote?.videoUrl ?? "");
	const [error, setError] = useState<string>("");

	const utils = api.useUtils();

	const isValidYouTubeUrl = (url: string): boolean => {
		const trimmed = url.trim();
		if (!trimmed) return false;

		try {
			const host = new URL(trimmed).hostname.toLowerCase();
			const isAllowedHost =
				host === "youtube.com" ||
				host === "www.youtube.com" ||
				host === "youtu.be";
			if (!isAllowedHost) return false;

			return extractYouTubeId(trimmed) !== null;
		} catch {
			return false;
		}
	};

	// Create note mutation
	const createNote = api.coachingNotes.createNote.useMutation({
		onSuccess: () => {
			setNoteType(MediaCoachNoteType.TEXT);
			setNoteContent("");
			setVideoUrl("");
			setError("");
			// Invalidate and refetch notes and dashboard metrics
			utils.coachingNotes.getNotesByMedia.invalidate({ mediaId });
			utils.user.getCoachDashboardMetrics.invalidate();
			utils.videoCollection.getAllMediaForCoaches.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	// Update note mutation
	const updateNote = api.coachingNotes.updateNote.useMutation({
		onSuccess: () => {
			setError("");
			// Invalidate and refetch notes and dashboard metrics
			utils.coachingNotes.getNotesByMedia.invalidate({ mediaId });
			utils.user.getCoachDashboardMetrics.invalidate();
			utils.videoCollection.getAllMediaForCoaches.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	const isSubmitting = createNote.isPending || updateNote.isPending;
	const isEditing = !!existingNote;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (noteType === MediaCoachNoteType.TEXT) {
			if (!noteContent.trim()) {
				setError("Note content is required");
				return;
			}

			if (noteContent.length > 2000) {
				setError("Note content must be 2000 characters or less");
				return;
			}
		}

		if (noteType === MediaCoachNoteType.YOUTUBE) {
			if (!videoUrl.trim()) {
				setError("YouTube URL is required");
				return;
			}
			if (!isValidYouTubeUrl(videoUrl)) {
				setError("Only youtube.com or youtu.be links are supported");
				return;
			}
		}

		setError("");

		if (isEditing && existingNote) {
			updateNote.mutate({
				noteId: existingNote.noteId,
				noteType,
				noteContent:
					noteType === MediaCoachNoteType.TEXT ? noteContent.trim() : undefined,
				videoUrl:
					noteType === MediaCoachNoteType.YOUTUBE ? videoUrl.trim() : undefined,
			});
		} else {
			createNote.mutate({
				mediaId,
				noteType,
				noteContent:
					noteType === MediaCoachNoteType.TEXT ? noteContent.trim() : undefined,
				videoUrl:
					noteType === MediaCoachNoteType.YOUTUBE ? videoUrl.trim() : undefined,
			});
		}
	};

	const handleCancel = () => {
		if (isEditing) {
			setNoteType(existingNote?.noteType ?? MediaCoachNoteType.TEXT);
			setNoteContent(existingNote?.noteContent ?? "");
			setVideoUrl(existingNote?.videoUrl ?? "");
		} else {
			setNoteType(MediaCoachNoteType.TEXT);
			setNoteContent("");
			setVideoUrl("");
		}
		setError("");
		onCancel?.();
	};

	const characterCount = noteContent.length;
	const isOverLimit =
		noteType === MediaCoachNoteType.TEXT && characterCount > 2000;

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
					<AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			)}

			<div>
				<label
					htmlFor="noteType"
					className="mb-2 block font-medium text-gray-700 text-sm"
				>
					{isEditing ? "Edit Coaching Note" : "Add Coaching Note"}
				</label>

				<select
					id="noteType"
					value={noteType}
					onChange={(e) => setNoteType(e.target.value as MediaCoachNoteType)}
					className={cn(
						"w-full rounded-lg border bg-white px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
						"border-gray-300",
					)}
					disabled={isSubmitting}
				>
					<option value={MediaCoachNoteType.TEXT}>Text</option>
					<option value={MediaCoachNoteType.YOUTUBE}>YouTube Video</option>
				</select>
			</div>

			{noteType === MediaCoachNoteType.TEXT && (
				<div>
					<label
						htmlFor="noteContent"
						className="mb-2 block font-medium text-gray-700 text-sm"
					>
						Coaching Note
					</label>
					<textarea
						id="noteContent"
						value={noteContent}
						onChange={(e) => setNoteContent(e.target.value)}
						className={cn(
							"resize-vertical min-h-[100px] w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
							isOverLimit ? "border-red-300" : "border-gray-300",
						)}
						placeholder="Enter your coaching feedback and observations..."
						disabled={isSubmitting}
					/>
					<div className="mt-1 flex items-center justify-between">
						<div className="text-gray-500 text-xs">
							Provide detailed feedback to help the student improve their
							technique and gameplay.
						</div>
						<div
							className={cn(
								"text-xs",
								isOverLimit
									? "text-red-600"
									: characterCount > 1800
										? "text-yellow-600"
										: "text-gray-500",
							)}
						>
							{characterCount}/2000
						</div>
					</div>
				</div>
			)}

			{noteType === MediaCoachNoteType.YOUTUBE && (
				<div>
					<label
						htmlFor="videoUrl"
						className="mb-2 block font-medium text-gray-700 text-sm"
					>
						YouTube URL
					</label>
					<input
						id="videoUrl"
						type="url"
						value={videoUrl}
						onChange={(e) => setVideoUrl(e.target.value)}
						className={cn(
							"w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
							videoUrl.trim().length > 0 && !isValidYouTubeUrl(videoUrl)
								? "border-red-300"
								: "border-gray-300",
						)}
						placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
						disabled={isSubmitting}
					/>
					<div className="mt-1 text-gray-500 text-xs">
						Only youtube.com or youtu.be links are supported.
					</div>
				</div>
			)}

			<div className="flex justify-end space-x-3">
				<Button
					type="button"
					variant="outline"
					onClick={handleCancel}
					disabled={isSubmitting}
				>
					<X className="mr-1 h-4 w-4" />
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={
						isSubmitting ||
						(noteType === MediaCoachNoteType.TEXT
							? !noteContent.trim() || isOverLimit
							: !videoUrl.trim() || !isValidYouTubeUrl(videoUrl))
					}
				>
					<Save className="mr-1 h-4 w-4" />
					{isSubmitting
						? isEditing
							? "Updating..."
							: "Saving..."
						: isEditing
							? "Update Note"
							: "Save Note"}
				</Button>
			</div>
		</form>
	);
}
