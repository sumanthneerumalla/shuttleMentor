"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { ProfileAvatar } from "../shared/ProfileAvatar";
import { ProfileImageDisplay } from "../shared/ProfileImageDisplay";
import { ProfileImageUploader } from "../shared/ProfileImageUploader";

// Character limits based on Prisma schema
const BIO_CHAR_LIMIT = 300;
const EXPERIENCE_CHAR_LIMIT = 1000;

interface CoachProfileProps {
	initialProfile: {
		coachProfileId: string;
		displayUsername: string | null;
		bio: string | null;
		experience: string | null;
		specialties: string[];
		teachingStyles: string[];
		headerImage: string | null;
		rate: number;
		isVerified: boolean;
		profileImageUrl?: string | null;
	} | null;
	userId: string;
	firstName?: string | null;
	lastName?: string | null;
	clubName?: string | null;
}

export default function CoachProfile({
	initialProfile,
	firstName,
	lastName,
	clubName,
}: CoachProfileProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		bio: initialProfile?.bio || "",
		experience: initialProfile?.experience || "",
		specialties: initialProfile?.specialties || [],
		teachingStyles: initialProfile?.teachingStyles || [],
		headerImage: initialProfile?.headerImage || "",
		rate: initialProfile?.rate || 0,
		profileImage: "",
	});

	const [newSpecialty, setNewSpecialty] = useState("");
	const [newTeachingStyle, setNewTeachingStyle] = useState("");

	const utils = api.useUtils();
	const updateProfile = api.user.updateCoachProfile.useMutation({
		onSuccess: () => {
			setIsEditing(false);
			utils.user.getOrCreateProfile.invalidate();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfile.mutate(formData);
	};

	const handleImageChange = (imageData: string | null) => {
		setFormData({
			...formData,
			// When null is passed, use empty string to explicitly signal image deletion
			profileImage: imageData === null ? "" : imageData,
		});
	};

	const handleCancel = () => {
		setIsEditing(false);
		setFormData({
			bio: initialProfile?.bio || "",
			experience: initialProfile?.experience || "",
			specialties: initialProfile?.specialties || [],
			teachingStyles: initialProfile?.teachingStyles || [],
			headerImage: initialProfile?.headerImage || "",
			rate: initialProfile?.rate || 0,
			profileImage: "",
		});
		setNewSpecialty("");
		setNewTeachingStyle("");
	};

	const addSpecialty = () => {
		if (
			newSpecialty.trim() &&
			!formData.specialties.includes(newSpecialty.trim())
		) {
			setFormData({
				...formData,
				specialties: [...formData.specialties, newSpecialty.trim()],
			});
			setNewSpecialty("");
		}
	};

	const removeSpecialty = (specialty: string) => {
		setFormData({
			...formData,
			specialties: formData.specialties.filter((s) => s !== specialty),
		});
	};

	const addTeachingStyle = () => {
		if (
			newTeachingStyle.trim() &&
			!formData.teachingStyles.includes(newTeachingStyle.trim())
		) {
			setFormData({
				...formData,
				teachingStyles: [...formData.teachingStyles, newTeachingStyle.trim()],
			});
			setNewTeachingStyle("");
		}
	};

	const removeTeachingStyle = (style: string) => {
		setFormData({
			...formData,
			teachingStyles: formData.teachingStyles.filter((s) => s !== style),
		});
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="font-semibold text-xl">Coach Profile</h2>
					{initialProfile?.isVerified && (
						<span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-800 text-xs">
							Verified
						</span>
					)}
				</div>
				{!isEditing && (
					<button
						onClick={() => setIsEditing(true)}
						className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]"
					>
						Edit Coach Profile
					</button>
				)}
			</div>

			{!isEditing ? (
				<div className="space-y-4">
					<div>
						<label className="text-gray-500 text-sm">Session Rate</label>
						<p className="font-semibold text-lg">${formData.rate}</p>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Username</label>
						<p className="whitespace-pre-wrap text-lg">
							{initialProfile?.displayUsername || "Not set"}
						</p>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Club</label>
						<p className="text-lg">{clubName || "Not set"}</p>
					</div>

					<ProfileImageDisplay
						imageUrl={initialProfile?.profileImageUrl}
						name={
							firstName || lastName
								? `${firstName || ""} ${lastName || ""}`.trim()
								: null
						}
						alt="Coach Profile"
					/>

					<div>
						<label className="text-gray-500 text-sm">Bio</label>
						<p className="whitespace-pre-wrap text-lg">
							{formData.bio || "Not set"}
						</p>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Experience</label>
						<p className="whitespace-pre-wrap text-lg">
							{formData.experience || "Not set"}
						</p>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Specialties</label>
						<div className="mt-1 flex flex-wrap gap-2">
							{formData.specialties.length > 0 ? (
								formData.specialties.map((specialty) => (
									<span
										key={specialty}
										className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-sm"
									>
										{specialty}
									</span>
								))
							) : (
								<p className="text-lg">Not set</p>
							)}
						</div>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Teaching Styles</label>
						<div className="mt-1 flex flex-wrap gap-2">
							{formData.teachingStyles.length > 0 ? (
								formData.teachingStyles.map((style) => (
									<span
										key={style}
										className="rounded-full bg-purple-100 px-3 py-1 text-purple-800 text-sm"
									>
										{style}
									</span>
								))
							) : (
								<p className="text-lg">Not set</p>
							)}
						</div>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Session Rate ($)
						</label>
						<input
							type="number"
							min="0"
							step="1"
							value={formData.rate}
							onChange={(e) =>
								setFormData({
									...formData,
									rate: Number.parseInt(e.target.value) || 0,
								})
							}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
							placeholder="Enter session rate"
						/>
					</div>

					<div className="mb-6">
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Profile Image
						</label>
						<ProfileImageUploader
							initialImageUrl={initialProfile?.profileImageUrl}
							onChange={handleImageChange}
						/>
					</div>

					{/* Bio with character counter */}
					<div>
						<div className="mb-1 flex items-center justify-between">
							<label className="block font-medium text-gray-700 text-sm">
								Bio
							</label>
							<span
								className={`text-xs ${formData.bio.length > BIO_CHAR_LIMIT ? "text-red-500" : "text-gray-500"}`}
							>
								{formData.bio.length}/{BIO_CHAR_LIMIT}
							</span>
						</div>
						<textarea
							value={formData.bio}
							onChange={(e) =>
								setFormData({ ...formData, bio: e.target.value })
							}
							className={`w-full border px-3 py-2 ${formData.bio.length > BIO_CHAR_LIMIT ? "border-red-500" : "border-gray-300"} min-h-[100px] resize-y rounded-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
							placeholder="Tell students about yourself (short overview for coach cards)"
							maxLength={BIO_CHAR_LIMIT}
						/>
						<p className="mt-1 text-gray-500 text-xs">
							Short overview displayed on coach cards
						</p>
					</div>

					{/* Experience with character counter */}
					<div>
						<div className="mb-1 flex items-center justify-between">
							<label className="block font-medium text-gray-700 text-sm">
								Experience
							</label>
							<span
								className={`text-xs ${formData.experience.length > EXPERIENCE_CHAR_LIMIT ? "text-red-500" : "text-gray-500"}`}
							>
								{formData.experience.length}/{EXPERIENCE_CHAR_LIMIT}
							</span>
						</div>
						<textarea
							value={formData.experience}
							onChange={(e) =>
								setFormData({ ...formData, experience: e.target.value })
							}
							className={`w-full border px-3 py-2 ${formData.experience.length > EXPERIENCE_CHAR_LIMIT ? "border-red-500" : "border-gray-300"} min-h-[100px] resize-y rounded-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
							placeholder="Describe your coaching experience (detailed information for profile page)"
							maxLength={EXPERIENCE_CHAR_LIMIT}
						/>
						<p className="mt-1 text-gray-500 text-xs">
							Detailed experience shown on your full profile page
						</p>
					</div>

					{/* Specialties */}
					<div>
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Specialties
						</label>
						<div className="mb-2 flex gap-2">
							<input
								type="text"
								value={newSpecialty}
								onChange={(e) => setNewSpecialty(e.target.value)}
								onKeyPress={(e) =>
									e.key === "Enter" && (e.preventDefault(), addSpecialty())
								}
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
								placeholder="Add a specialty"
							/>
							<button
								type="button"
								onClick={addSpecialty}
								className="rounded-lg bg-gray-100 px-4 py-2 transition-colors hover:bg-gray-200"
							>
								Add
							</button>
						</div>
						<div className="flex flex-wrap gap-2">
							{formData.specialties.map((specialty) => (
								<span
									key={specialty}
									className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-sm"
								>
									{specialty}
									<button
										type="button"
										onClick={() => removeSpecialty(specialty)}
										className="ml-1 text-blue-600 hover:text-blue-800"
									>
										×
									</button>
								</span>
							))}
						</div>
					</div>

					{/* Teaching Styles */}
					<div>
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Teaching Styles
						</label>
						<div className="mb-2 flex gap-2">
							<input
								type="text"
								value={newTeachingStyle}
								onChange={(e) => setNewTeachingStyle(e.target.value)}
								onKeyPress={(e) =>
									e.key === "Enter" && (e.preventDefault(), addTeachingStyle())
								}
								className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
								placeholder="Add a teaching style"
							/>
							<button
								type="button"
								onClick={addTeachingStyle}
								className="rounded-lg bg-gray-100 px-4 py-2 transition-colors hover:bg-gray-200"
							>
								Add
							</button>
						</div>
						<div className="flex flex-wrap gap-2">
							{formData.teachingStyles.map((style) => (
								<span
									key={style}
									className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-purple-800 text-sm"
								>
									{style}
									<button
										type="button"
										onClick={() => removeTeachingStyle(style)}
										className="ml-1 text-purple-600 hover:text-purple-800"
									>
										×
									</button>
								</span>
							))}
						</div>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							type="submit"
							disabled={updateProfile.isPending}
							className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
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
	);
}
