"use client";

import { ChevronDown, ChevronUp, User, UserCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface CoachSelectorProps {
	collectionId: string;
	clubShortName?: string | null;
	currentCoachId?: string | null;
	onCoachAssigned?: (coachId: string | null) => void;
	className?: string;
}

interface ClubCoach {
	userId: string;
	coachProfileId: string;
	displayUsername: string | null;
	firstName: string | null;
	lastName: string | null;
	bio: string | null;
	specialties: string[];
	rate: number;
	isVerified: boolean;
	profileImageUrl: string | null;
	clubShortName: string;
	clubName: string;
}

export default function CoachSelector({
	collectionId,
	clubShortName,
	currentCoachId,
	onCoachAssigned,
	className,
}: CoachSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isAssigning, setIsAssigning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch available coaches from student's club
	const {
		data: clubCoachesData,
		isLoading: coachesLoading,
		error: coachesError,
	} = api.coaches.getClubCoaches.useQuery({
		clubShortName: clubShortName ?? undefined,
	});

	// Coach assignment mutation
	const assignCoachMutation = api.videoCollection.assignCoach.useMutation({
		onSuccess: (data) => {
			setIsAssigning(false);
			setError(null);
			setIsOpen(false);
			// The data returned includes assignedCoachId field
			const assignedCoachId = (data as any).assignedCoachId || null;
			onCoachAssigned?.(assignedCoachId);
		},
		onError: (error) => {
			setIsAssigning(false);

			// Provide user-friendly error messages based on the error type
			let userFriendlyMessage = error.message;

			if (error.message.includes("Coach must be from the same club")) {
				userFriendlyMessage =
					"This coach is from a different club. You can only assign coaches from your own club.";
			} else if (error.message.includes("Selected user is not a coach")) {
				userFriendlyMessage =
					"The selected user is not a coach. Please select a valid coach.";
			} else if (error.message.includes("Coach not found")) {
				userFriendlyMessage =
					"The selected coach could not be found. They may have been removed from the system.";
			} else if (error.message.includes("not authorized")) {
				userFriendlyMessage =
					"You don't have permission to assign coaches to this collection.";
			} else if (error.message.includes("Video collection not found")) {
				userFriendlyMessage = "This video collection could not be found.";
			} else if (
				error.message.includes("Network Error") ||
				error.message.includes("fetch")
			) {
				userFriendlyMessage =
					"Network error. Please check your connection and try again.";
			} else if (error.message.includes("timeout")) {
				userFriendlyMessage = "The request timed out. Please try again.";
			}

			setError(userFriendlyMessage);
		},
	});

	const coaches = clubCoachesData?.coaches || [];
	const currentCoach = coaches.find((coach) => coach.userId === currentCoachId);

	const handleCoachSelection = async (coachId: string | null) => {
		setIsAssigning(true);
		setError(null);

		try {
			await assignCoachMutation.mutateAsync({
				collectionId,
				coachId: coachId || undefined,
			});
		} catch (err) {
			// Error is handled in onError callback
		}
	};

	const handleRemoveCoach = async () => {
		await handleCoachSelection(null);
	};

	const getCoachDisplayName = (coach: ClubCoach) => {
		if (coach.displayUsername) {
			return coach.displayUsername;
		}
		if (coach.firstName && coach.lastName) {
			return `${coach.firstName} ${coach.lastName}`;
		}
		if (coach.firstName) {
			return coach.firstName;
		}
		return "Coach";
	};

	const formatSpecialties = (specialties: string[]) => {
		if (specialties.length === 0) return "";
		if (specialties.length === 1) return specialties[0];
		if (specialties.length === 2) return specialties.join(" & ");
		return `${specialties.slice(0, 2).join(", ")} +${specialties.length - 2} more`;
	};

	if (coachesLoading) {
		return (
			<div className={cn("glass-panel p-4", className)}>
				<div className="animate-pulse">
					<div className="mb-2 h-4 w-32 rounded bg-gray-200"></div>
					<div className="h-8 rounded bg-gray-200"></div>
				</div>
			</div>
		);
	}

	if (coachesError) {
		return (
			<div
				className={cn("glass-panel border-red-200 bg-red-50 p-4", className)}
			>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<p className="mb-1 font-medium text-red-700 text-sm">
							Unable to Load Coaches
						</p>
						<p className="text-red-600 text-sm">
							{coachesError.message.includes("Network Error") ||
							coachesError.message.includes("fetch")
								? "Network error. Please check your connection and try again."
								: coachesError.message.includes("timeout")
									? "The request timed out. Please try again."
									: "There was an error loading coaches from your club. Please try again later."}
						</p>
					</div>
				</div>
				<Button
					onClick={() => window.location.reload()}
					variant="outline"
					size="sm"
					className="mt-2 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
				>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className={cn("glass-panel p-4", className)}>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-gray-900">Assigned Coach</h3>
					{currentCoach && (
						<Button
							onClick={handleRemoveCoach}
							disabled={isAssigning}
							variant="outline"
							size="sm"
							className="text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							<X className="mr-1 h-4 w-4" />
							Remove
						</Button>
					)}
				</div>

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-3">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<p className="mb-1 font-medium text-red-700 text-sm">
									Assignment Failed
								</p>
								<p className="text-red-600 text-sm">{error}</p>
							</div>
							<Button
								onClick={() => setError(null)}
								variant="outline"
								size="sm"
								className="ml-2 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
						{error.includes("Network error") ||
							(error.includes("timed out") && (
								<Button
									onClick={() => {
										setError(null);
										// Retry the last operation if there was one
									}}
									variant="outline"
									size="sm"
									className="mt-2 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
								>
									Try Again
								</Button>
							))}
					</div>
				)}

				{/* Current Coach Display */}
				{currentCoach ? (
					<div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-3">
						<div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
							<UserCheck className="h-4 w-4 text-green-600" />
						</div>
						<div className="flex-1">
							<p className="font-medium text-green-900">
								{getCoachDisplayName(currentCoach)}
							</p>
							<p className="text-green-700 text-sm">{currentCoach.clubName}</p>
							{currentCoach.specialties.length > 0 && (
								<p className="mt-1 text-green-600 text-xs">
									{formatSpecialties(currentCoach.specialties)}
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-3">
						<div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<User className="h-4 w-4 text-gray-400" />
						</div>
						<p className="text-gray-600">No coach assigned</p>
					</div>
				)}

				{/* Coach Selection Dropdown */}
				{coaches.length > 0 && (
					<div className="relative">
						<Button
							onClick={() => setIsOpen(!isOpen)}
							disabled={isAssigning}
							variant="outline"
							className="w-full justify-between"
						>
							<span>{currentCoach ? "Change Coach" : "Select Coach"}</span>
							{isOpen ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>

						{isOpen && (
							<div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
								{coaches
									.filter((coach) => coach.userId !== currentCoachId)
									.map((coach) => (
										<button
											key={coach.userId}
											onClick={() => handleCoachSelection(coach.userId)}
											disabled={isAssigning}
											className="w-full border-gray-100 border-b p-3 text-left last:border-b-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<div className="flex items-center">
												<div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
													<User className="h-4 w-4 text-blue-600" />
												</div>
												<div className="flex-1">
													<p className="font-medium text-gray-900">
														{getCoachDisplayName(coach)}
													</p>
													{coach.specialties.length > 0 && (
														<p className="mt-1 text-gray-500 text-xs">
															{formatSpecialties(coach.specialties)}
														</p>
													)}
												</div>
											</div>
										</button>
									))}

								{coaches.filter((coach) => coach.userId !== currentCoachId)
									.length === 0 && (
									<div className="p-3 text-center text-gray-500">
										{currentCoach
											? "No other coaches available"
											: "No coaches available"}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{coaches.length === 0 && (
					<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
						<p className="text-sm text-yellow-800">
							No coaches available from your club. Contact your club
							administrator to add coaches.
						</p>
					</div>
				)}

				{isAssigning && (
					<div className="flex items-center justify-center p-2">
						<div className="h-4 w-4 animate-spin rounded-full border-blue-600 border-b-2"></div>
						<span className="ml-2 text-gray-600 text-sm">
							{currentCoach ? "Updating assignment..." : "Assigning coach..."}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
