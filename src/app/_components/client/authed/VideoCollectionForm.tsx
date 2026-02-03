"use client";

import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { MediaType, UserType } from "@prisma/client";
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

// Define strongly typed interfaces
interface VideoFormData {
	title: string;
	description: string;
	videoUrl: string;
}

interface CollectionFormData {
	title: string;
	description: string;
	mediaType: MediaType;
	videos: VideoFormData[];
}

export default function VideoCollectionForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	// Get user profile to check permissions and ensure user exists in database
	const { data: user, isLoading: userLoading } =
		api.user.getOrCreateProfile.useQuery();

	// Redirect if not a student or admin
	useEffect(() => {
		if (
			!userLoading &&
			user &&
			user.userType !== "STUDENT" &&
			user.userType !== "ADMIN" &&
			user.userType !== "FACILITY"
		) {
			router.push("/home");
		}
	}, [user, userLoading, router]);

	// Initialize form with empty values
	const [formData, setFormData] = useState<CollectionFormData>({
		title: "",
		description: "",
		mediaType: MediaType.URL_VIDEO,
		videos: [{ title: "", description: "", videoUrl: "" }],
	});

	const [ownerQuery, setOwnerQuery] = useState("");
	const [selectedOwner, setSelectedOwner] = useState<{
		userId: string;
		firstName: string | null;
		lastName: string | null;
		email: string | null;
	} | null>(null);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const ownersEnabled =
		!!user &&
		(user.userType === UserType.ADMIN || user.userType === UserType.FACILITY);

	const { data: eligibleOwners, isLoading: eligibleOwnersLoading } =
		api.videoCollection.eligibleVideoCollectionOwners.useQuery(
			{ query: ownerQuery || undefined, limit: 10 },
			{
				enabled: ownersEnabled,
			},
		);

	// Create mutations
	const createCollection = api.videoCollection.create.useMutation({
		onSuccess: (data) => {
			// After collection is created, add videos
			addVideosToCollection(data.collectionId);
		},
		onError: (error) => {
			setIsSubmitting(false);
			setErrors({ form: error.message });
		},
	});

	const addMedia = api.videoCollection.addMedia.useMutation({
		onError: (error) => {
			setIsSubmitting(false);
			setErrors({ form: error.message });
		},
	});

	// Function to add videos to the collection
	const addVideosToCollection = async (collectionId: string) => {
		try {
			// Add each video sequentially
			for (const video of formData.videos) {
				if (video.title && video.videoUrl) {
					await addMedia.mutateAsync({
						collectionId,
						title: video.title,
						description: video.description,
						videoUrl: video.videoUrl,
					});
				}
			}

			// Invalidate dashboard queries to update metrics
			utils.videoCollection.getAll.invalidate();
			utils.videoCollection.getAllMediaForCoaches.invalidate();
			utils.user.getCoachDashboardMetrics.invalidate();

			// Navigate to the collection page after all videos are added
			router.push(`/video-collections/${collectionId}`);
		} catch (error) {
			setIsSubmitting(false);
			setErrors({ form: "Error adding videos to collection" });
		}
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form
		const validationErrors: Record<string, string> = {};

		if (user?.userType === UserType.FACILITY && !selectedOwner?.userId) {
			validationErrors.ownerStudentUserId = "Student owner is required";
		}

		if (!formData.title) {
			validationErrors.title = "Collection title is required";
		}

		if (formData.videos.length === 0) {
			validationErrors.videos = "At least one video is required";
		} else {
			formData.videos.forEach((video, index) => {
				if (!video.title) {
					validationErrors[`video_${index}_title`] = "Video title is required";
				}
				if (!video.videoUrl) {
					validationErrors[`video_${index}_url`] = "Video URL is required";
				} else if (!isValidUrl(video.videoUrl)) {
					validationErrors[`video_${index}_url`] = "Please enter a valid URL";
				}
			});
		}

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		// Clear errors and set submitting state
		setErrors({});
		setIsSubmitting(true);

		// Create the collection
		createCollection.mutate({
			title: formData.title,
			description: formData.description || undefined,
			mediaType: formData.mediaType,
			ownerStudentUserId:
				user?.userType === UserType.ADMIN ||
				user?.userType === UserType.FACILITY
					? selectedOwner?.userId
					: undefined,
		});
	};

	// Add a new video form
	const addVideoForm = () => {
		if (formData.videos.length >= 3) {
			setErrors({ videos: "URL video collections are limited to 3 videos" });
			return;
		}

		const newVideo: VideoFormData = {
			title: "",
			description: "",
			videoUrl: "",
		};

		setFormData({
			...formData,
			videos: [...formData.videos, newVideo],
		});
	};

	// Remove a video form
	const removeVideoForm = (index: number) => {
		const updatedVideos = [...formData.videos];
		updatedVideos.splice(index, 1);

		setFormData({
			...formData,
			videos: updatedVideos,
		});
	};

	// Update video form data
	const updateVideoForm = (
		index: number,
		field: keyof VideoFormData,
		value: string,
	) => {
		const updatedVideos = [...formData.videos];
		const updatedVideo = { ...updatedVideos[index] };
		updatedVideo[field] = value;
		updatedVideos[index] = updatedVideo as VideoFormData;

		setFormData({
			...formData,
			videos: updatedVideos,
		});

		// Clear related error if any
		if (errors[`video_${index}_${field}`]) {
			const updatedErrors = { ...errors };
			delete updatedErrors[`video_${index}_${field}`];
			setErrors(updatedErrors);
		}
	};

	// Helper function to validate URLs
	const isValidUrl = (url: string) => {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	};

	// Helper function to ensure string values
	const ensureString = (value: string | null): string => {
		return value !== null ? value : "";
	};

	// Check for URL parameters to prepopulate the form
	useEffect(() => {
		const title = searchParams.get("title");
		const description = searchParams.get("description");
		const videoTitle = searchParams.get("videoTitle");
		const videoUrl = searchParams.get("videoUrl");
		const videoDescription = searchParams.get("videoDescription");

		if (title || description || videoTitle || videoUrl || videoDescription) {
			// Create a properly typed video object
			const initialVideo: VideoFormData = {
				title: ensureString(videoTitle),
				description: ensureString(videoDescription),
				videoUrl: ensureString(videoUrl),
			};

			setFormData({
				title: ensureString(title),
				description: ensureString(description),
				mediaType: MediaType.URL_VIDEO,
				videos: [initialVideo],
			});
		}
	}, [searchParams]);

	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<div>
					<h1 className="section-heading">Create New Video Collection</h1>
					<p className="section-subheading mb-6">
						Add up to 3 videos to your collection.
					</p>

					{errors.form && (
						<div className="mb-6 flex items-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
							<AlertCircle className="mr-2 h-5 w-5" />
							<span>{errors.form}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Collection Details */}
						<div className="glass-panel rounded-lg p-6">
							<h2 className="mb-4 font-semibold text-xl">Collection Details</h2>

							<div className="space-y-4">
								{(user?.userType === UserType.ADMIN ||
									user?.userType === UserType.FACILITY) && (
									<div>
										<label
											htmlFor="owner"
											className="mb-1 block font-medium text-gray-700 text-sm"
										>
											Student To Set Ownership Of This Collection to{" "}
											{user?.userType === UserType.FACILITY && (
												<span className="text-red-500">*</span>
											)}
										</label>
										<input
											id="owner"
											type="text"
											value={
												selectedOwner
													? `${selectedOwner.firstName ?? ""} ${selectedOwner.lastName ?? ""}`.trim()
													: ownerQuery
											}
											onChange={(e) => {
												setSelectedOwner(null);
												setOwnerQuery(e.target.value);
												if (errors.ownerStudentUserId) {
													const updatedErrors = { ...errors };
													delete updatedErrors.ownerStudentUserId;
													setErrors(updatedErrors);
												}
											}}
											className={cn(
												"w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
												errors.ownerStudentUserId
													? "border-red-300"
													: "border-gray-300",
											)}
											placeholder="Search students by name, email, or username"
										/>
										{errors.ownerStudentUserId && (
											<p className="mt-1 text-red-600 text-sm">
												{errors.ownerStudentUserId}
											</p>
										)}
										{!selectedOwner && ownerQuery.trim().length > 0 && (
											<div className="glass-panel mt-2 overflow-hidden rounded-lg">
												{eligibleOwnersLoading ? (
													<div className="px-3 py-2 text-gray-500 text-sm">
														Loading...
													</div>
												) : (eligibleOwners?.length ?? 0) === 0 ? (
													<div className="px-3 py-2 text-gray-500 text-sm">
														No students found
													</div>
												) : (
													<div className="max-h-56 overflow-y-auto">
														{(eligibleOwners ?? []).map((owner) => (
															<button
																key={owner.userId}
																type="button"
																onClick={() => {
																	setSelectedOwner(owner);
																	setOwnerQuery("");
																}}
																className="dropdown-item w-full text-left"
															>
																<div className="text-gray-900 text-sm">
																	{owner.firstName ?? ""} {owner.lastName ?? ""}
																</div>
																{owner.email && (
																	<div className="text-gray-500 text-xs">
																		{owner.email}
																	</div>
																)}
															</button>
														))}
													</div>
												)}
											</div>
										)}
									</div>
								)}

								<div>
									<label
										htmlFor="title"
										className="mb-1 block font-medium text-gray-700 text-sm"
									>
										Collection Title <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										id="title"
										value={formData.title}
										onChange={(e) => {
											setFormData({ ...formData, title: e.target.value });
											if (errors.title) {
												const updatedErrors = { ...errors };
												delete updatedErrors.title;
												setErrors(updatedErrors);
											}
										}}
										className={cn(
											"w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
											errors.title ? "border-red-300" : "border-gray-300",
										)}
										placeholder="Enter collection title"
									/>
									{errors.title && (
										<p className="mt-1 text-red-600 text-sm">{errors.title}</p>
									)}
								</div>

								<div>
									<label
										htmlFor="description"
										className="mb-1 block font-medium text-gray-700 text-sm"
									>
										Description
									</label>
									<textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
										placeholder="Enter collection description"
										rows={3}
									/>
								</div>
							</div>
						</div>

						{/* Videos */}
						<div className="glass-panel rounded-lg p-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="font-semibold text-xl">Videos</h2>
								<Button
									type="button"
									onClick={addVideoForm}
									disabled={formData.videos.length >= 3}
									variant="outline"
									size="sm"
									className={cn(
										formData.videos.length >= 3
											? "cursor-not-allowed bg-gray-100 text-gray-400"
											: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/80",
									)}
								>
									<PlusCircle className="mr-1.5 h-4 w-4" />
									Add Video
								</Button>
							</div>

							{errors.videos && (
								<p className="mb-4 text-red-600 text-sm">{errors.videos}</p>
							)}

							<div className="space-y-6">
								{formData.videos.map((video, index) => (
									<div
										key={index}
										className="rounded-lg border border-gray-200 p-4"
									>
										<div className="mb-4 flex items-center justify-between">
											<h3 className="font-medium">Video {index + 1}</h3>
											{formData.videos.length > 1 && (
												<button
													type="button"
													onClick={() => removeVideoForm(index)}
													className="text-red-500 transition-colors hover:text-red-700"
												>
													<Trash2 className="h-5 w-5" />
												</button>
											)}
										</div>

										<div className="space-y-4">
											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													Video Title <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={video.title}
													onChange={(e) =>
														updateVideoForm(index, "title", e.target.value)
													}
													className={cn(
														"w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
														errors[`video_${index}_title`]
															? "border-red-300"
															: "border-gray-300",
													)}
													placeholder="Enter video title"
												/>
												{errors[`video_${index}_title`] && (
													<p className="mt-1 text-red-600 text-sm">
														{errors[`video_${index}_title`]}
													</p>
												)}
											</div>

											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													Video URL <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													value={video.videoUrl}
													onChange={(e) =>
														updateVideoForm(index, "videoUrl", e.target.value)
													}
													className={cn(
														"w-full rounded-lg border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
														errors[`video_${index}_url`]
															? "border-red-300"
															: "border-gray-300",
													)}
													placeholder="https://example.com/video.mp4"
												/>
												{errors[`video_${index}_url`] && (
													<p className="mt-1 text-red-600 text-sm">
														{errors[`video_${index}_url`]}
													</p>
												)}
											</div>

											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													Video Description
												</label>
												<textarea
													value={video.description}
													onChange={(e) =>
														updateVideoForm(
															index,
															"description",
															e.target.value,
														)
													}
													className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
													placeholder="Enter video description"
													rows={2}
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={isSubmitting}
								size="lg"
								className={cn(
									isSubmitting
										? "cursor-not-allowed opacity-70"
										: "hover:bg-[var(--primary)]/90",
								)}
							>
								{isSubmitting ? "Creating Collection..." : "Create Collection"}
							</Button>
						</div>
					</form>
				</div>
			</SignedIn>
		</>
	);
}
