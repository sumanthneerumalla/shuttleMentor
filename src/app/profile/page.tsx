"use client";

import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isOnboardedUser } from "~/lib/utils";
import { parseServerError } from "~/lib/validation";
import { api } from "~/trpc/react";
import CoachProfile from "../_components/client/CoachProfile";
import StudentProfile from "../_components/client/StudentProfile";
import AdminClubIdSelector from "../_components/client/authed/AdminClubIdSelector";

export default function ProfilePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isEditing, setIsEditing] = useState(false);
	const clubAssignmentAttempted = useRef(false);

	// Fetch or create user profile
	const {
		data: user,
		isLoading,
		refetch,
	} = api.user.getOrCreateProfile.useQuery();

	// Mutations
	const updateProfile = api.user.updateProfile.useMutation({
		onSuccess: () => {
			setIsEditing(false);
			setServerError("");
			refetch();
		},
		onError: (error) => {
			// Parse server-side validation errors
			const parsedErrors = parseServerError(error.message);

			// Set general error if any
			if (parsedErrors.general) {
				setServerError(parsedErrors.general);
			}
		},
	});

	// Form state (clubName is derived from backend, not editable)
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		timeZone: "",
		clubShortName: "",
		clubName: "",
	});

	const [serverError, setServerError] = useState<string>("");

	const isFirstNameMissing = formData.firstName.trim().length === 0;
	const isLastNameMissing = formData.lastName.trim().length === 0;
	const isEmailMissing = formData.email.trim().length === 0;
	const isMissingRequiredFields =
		isFirstNameMissing || isLastNameMissing || isEmailMissing;

	// Initialize form when user data loads and handle joinClub URL parameter
	useEffect(() => {
		if (!user) return;

		// Initialize form with user data (clubName derived from backend)
		setFormData({
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			email: user.email || "",
			timeZone: user.timeZone || "",
			clubShortName: user.clubShortName || "",
			clubName: user.clubName || "",
		});
		setServerError("");

		// Handle automatic club assignment from URL parameter.
		// This param is set by Clerk's forceRedirectUrl when users sign up/in
		// from a club landing page (/club/{clubShortName}).
		// See: /club/[clubShortName]/page.tsx for the flow documentation.
		const joinClub = searchParams.get("joinClub");

		if (
			joinClub &&
			!clubAssignmentAttempted.current &&
			user.clubShortName === "default-club-001"
		) {
			clubAssignmentAttempted.current = true;
			updateProfile.mutate(
				{ clubShortName: joinClub },
				{
					onSuccess: () => {
						// Remove joinClub param from URL after successful assignment (if present)
						if (searchParams.get("joinClub")) {
							router.replace("/profile");
						}
					},
				},
			);
		}
	}, [user, searchParams]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setServerError("");

		// Store current form data in case we need to restore it on error
		const currentFormData = { ...formData };

		updateProfile.mutate(formData, {
			onError: () => {
				// Preserve form data on error so user doesn't lose their changes
				setFormData(currentFormData);
			},
		});
	};

	const handleCancel = () => {
		setIsEditing(false);
		setServerError("");
		if (user) {
			setFormData({
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				email: user.email || "",
				timeZone: user.timeZone || "",
				clubShortName: user.clubShortName || "",
				clubName: user.clubName || "",
			});
		}
	};

	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<div className="container mx-auto px-4 py-8">
					<div className="mx-auto max-w-2xl">
						<h1 className="mb-2 font-bold text-3xl">My Profile</h1>
						{user && !isOnboardedUser(user) && (
							<p className="mb-8 text-red-600 text-sm">
								First name, last name, and email are required to complete
								onboarding.
							</p>
						)}

						{isLoading ? (
							<div className="py-8 text-center">Loading profile...</div>
						) : user ? (
							<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
								<div className="mb-4 border-gray-100 border-b pb-4">
									<p className="select-text text-gray-400 text-xs">
										User ID:{" "}
										<span className="cursor-text select-all font-mono">
											{user.userId}
										</span>
									</p>
								</div>
								{!isEditing ? (
									<div className="space-y-4">
										<div className="flex items-start justify-between">
											<div className="flex-1 space-y-4">
												<div>
													<label className="text-gray-500 text-sm">
														First Name
													</label>
													<p className="font-medium text-lg">
														{user.firstName ? (
															user.firstName
														) : (
															<span className="text-red-600">Not set</span>
														)}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">
														Last Name
													</label>
													<p className="font-medium text-lg">
														{user.lastName ? (
															user.lastName
														) : (
															<span className="text-red-600">Not set</span>
														)}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">Email</label>
													<p className="text-lg">
														{user.email ? (
															user.email
														) : (
															<span className="text-red-600">Not set</span>
														)}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">
														Time Zone
													</label>
													<p className="text-lg">
														{user.timeZone ? (
															user.timeZone
														) : (
															<span className="text-red-600">Not set</span>
														)}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">Club</label>
													<p className="text-lg">
														{user.clubName ? (
															user.clubName
														) : (
															<span className="text-red-600">Not set</span>
														)}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">
														Account Type
													</label>
													<p className="text-lg capitalize">
														{user.userType.toLowerCase()}
													</p>
												</div>

												<div>
													<label className="text-gray-500 text-sm">
														Member Since
													</label>
													<p className="text-lg">
														{new Date(user.createdAt).toLocaleDateString()}
													</p>
												</div>
											</div>

											<button
												onClick={() => {
													setFormData({
														firstName: user.firstName || "",
														lastName: user.lastName || "",
														email: user.email || "",
														timeZone: user.timeZone || "",
														clubShortName: user.clubShortName || "",
														clubName: user.clubName || "",
													});
													setIsEditing(true);
												}}
												className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]"
											>
												Edit Profile
											</button>
										</div>
									</div>
								) : (
									<form onSubmit={handleSubmit} className="space-y-4">
										{/* Display server error if any */}
										{serverError && (
											<div className="rounded-lg border border-red-200 bg-red-50 p-3">
												<p className="text-red-600 text-sm">{serverError}</p>
												<button
													type="button"
													onClick={() => setServerError("")}
													className="mt-2 text-red-500 text-xs underline hover:text-red-700"
												>
													Dismiss
												</button>
											</div>
										)}

										{/* Display success message if update was successful */}
										{updateProfile.isSuccess && !isEditing && (
											<div className="rounded-lg border border-green-200 bg-green-50 p-3">
												<p className="text-green-600 text-sm">
													Profile updated successfully!
												</p>
											</div>
										)}

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													First Name
												</label>
												<input
													type="text"
													value={formData.firstName}
													onChange={(e) =>
														setFormData({
															...formData,
															firstName: e.target.value,
														})
													}
													className={`required-field-input w-full rounded-lg px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isFirstNameMissing ? "required-field-input--error" : ""}`}
													placeholder="Enter first name"
												/>
												{isFirstNameMissing && (
													<p className="required-field-message">
														First name is required.
													</p>
												)}
											</div>

											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													Last Name
												</label>
												<input
													type="text"
													value={formData.lastName}
													onChange={(e) =>
														setFormData({
															...formData,
															lastName: e.target.value,
														})
													}
													className={`required-field-input w-full rounded-lg px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isLastNameMissing ? "required-field-input--error" : ""}`}
													placeholder="Enter last name"
												/>
												{isLastNameMissing && (
													<p className="required-field-message">
														Last name is required.
													</p>
												)}
											</div>
										</div>

										<div>
											<label className="mb-1 block font-medium text-gray-700 text-sm">
												Email
											</label>
											<input
												type="email"
												value={formData.email}
												onChange={(e) =>
													setFormData({ ...formData, email: e.target.value })
												}
												className={`required-field-input w-full rounded-lg px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isEmailMissing ? "required-field-input--error" : ""}`}
												placeholder="Enter email"
											/>
											{isEmailMissing && (
												<p className="required-field-message">
													Email is required.
												</p>
											)}
										</div>

										<div>
											<label className="mb-1 block font-medium text-gray-700 text-sm">
												Time Zone
											</label>
											<select
												value={formData.timeZone}
												onChange={(e) =>
													setFormData({ ...formData, timeZone: e.target.value })
												}
												className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
											>
												<option value="">Select time zone</option>
												<option value="America/New_York">
													Eastern Time (ET)
												</option>
												<option value="America/Chicago">
													Central Time (CT)
												</option>
												<option value="America/Denver">
													Mountain Time (MT)
												</option>
												<option value="America/Los_Angeles">
													Pacific Time (PT)
												</option>
												<option value="Europe/London">London (GMT)</option>
												<option value="Europe/Paris">Paris (CET)</option>
												<option value="Asia/Tokyo">Tokyo (JST)</option>
												<option value="Australia/Sydney">Sydney (AEDT)</option>
											</select>
										</div>

										{user.userType === "ADMIN" ? (
											<AdminClubIdSelector
												selectedClubShortName={formData.clubShortName}
												selectedClubName={formData.clubName}
												onSelect={(club) => {
													setFormData({
														...formData,
														clubShortName: club.clubShortName,
														clubName: club.clubName,
													});
												}}
											/>
										) : (
											<div>
												<label className="mb-1 block font-medium text-gray-700 text-sm">
													Club
												</label>
												<input
													type="text"
													value={
														formData.clubName
															? `${formData.clubName} (${formData.clubShortName})`
															: formData.clubShortName
													}
													disabled
													className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600"
												/>
											</div>
										)}

										<div className="flex gap-3 pt-4">
											<button
												type="submit"
												disabled={
													updateProfile.isPending || isMissingRequiredFields
												}
												className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
											>
												{updateProfile.isPending ? "Saving..." : "Save Changes"}
											</button>
											<button
												type="button"
												onClick={handleCancel}
												className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
											>
												Cancel
											</button>
										</div>
									</form>
								)}
							</div>
						) : (
							<div className="py-8 text-center">No profile found</div>
						)}

						{/* Student Profile Section */}
						{user?.studentProfile && user.userType === "STUDENT" && (
							<div className="mt-6">
								<StudentProfile
									initialProfile={user.studentProfile}
									userId={user.userId}
									firstName={user.firstName}
									lastName={user.lastName}
									clubName={user.clubName}
								/>
							</div>
						)}

						{/* Coach Profile Section */}
						{user?.coachProfile && user.userType === "COACH" && (
							<div className="mt-6">
								<CoachProfile
									initialProfile={user.coachProfile}
									userId={user.userId}
									firstName={user.firstName}
									lastName={user.lastName}
									clubName={user.clubName}
								/>
							</div>
						)}

						{/* Admin can see both profiles */}
						{user?.userType === "ADMIN" && (
							<>
								{user.studentProfile && (
									<div className="mt-6">
										<StudentProfile
											initialProfile={user.studentProfile}
											userId={user.userId}
											firstName={user.firstName}
											lastName={user.lastName}
											clubName={user.clubName}
										/>
									</div>
								)}
								{user.coachProfile && (
									<div className="mt-6">
										<CoachProfile
											initialProfile={user.coachProfile}
											userId={user.userId}
											firstName={user.firstName}
											lastName={user.lastName}
											clubName={user.clubName}
										/>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</SignedIn>
		</>
	);
}
