"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { ProfileAvatar } from "../shared/ProfileAvatar";
import { ProfileImageDisplay } from "../shared/ProfileImageDisplay";
import { ProfileImageUploader } from "../shared/ProfileImageUploader";

// Character limits
const BIO_CHAR_LIMIT = 500;
const GOALS_CHAR_LIMIT = 500;

interface StudentProfileProps {
	initialProfile: {
		studentProfileId: string;
		skillLevel: string | null;
		goals: string | null;
		bio: string | null;
		profileImageUrl?: string | null;
	} | null;
	userId: string;
	firstName?: string | null;
	lastName?: string | null;
	clubName?: string | null;
}

export default function StudentProfile({
	initialProfile,
	firstName,
	lastName,
	clubName,
}: StudentProfileProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		skillLevel: initialProfile?.skillLevel || "",
		goals: initialProfile?.goals || "",
		bio: initialProfile?.bio || "",
		profileImage: "", // Base64 encoded image data
	});

	const utils = api.useUtils();
	const updateProfile = api.user.updateStudentProfile.useMutation({
		onSuccess: () => {
			setIsEditing(false);
			utils.user.getOrCreateProfile.invalidate();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfile.mutate(formData);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setFormData({
			skillLevel: initialProfile?.skillLevel || "",
			goals: initialProfile?.goals || "",
			bio: initialProfile?.bio || "",
			profileImage: "",
		});
	};

	const handleImageChange = (imageData: string | null) => {
		setFormData({
			...formData,
			// When null is passed, use empty string to explicitly signal image deletion
			profileImage: imageData === null ? "" : imageData,
		});
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-xl">Student Profile</h2>
				{!isEditing && (
					<button
						onClick={() => setIsEditing(true)}
						className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]"
					>
						Edit Student Profile
					</button>
				)}
			</div>

			{!isEditing ? (
				<div className="space-y-4">
					<div>
						<label className="text-gray-500 text-sm">Skill Level</label>
						<p className="text-lg">{formData.skillLevel || "Not set"}</p>
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
						alt="Student Profile"
					/>

					<div>
						<label className="text-gray-500 text-sm">Learning Goals</label>
						<p className="whitespace-pre-wrap text-lg">
							{formData.goals || "Not set"}
						</p>
					</div>

					<div>
						<label className="text-gray-500 text-sm">Bio</label>
						<p className="whitespace-pre-wrap text-lg">
							{formData.bio || "Not set"}
						</p>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="mb-6">
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Profile Image
						</label>
						<ProfileImageUploader
							initialImageUrl={initialProfile?.profileImageUrl}
							onChange={handleImageChange}
						/>
					</div>

					<div>
						<label className="mb-1 block font-medium text-gray-700 text-sm">
							Skill Level
						</label>
						<select
							value={formData.skillLevel}
							onChange={(e) =>
								setFormData({ ...formData, skillLevel: e.target.value })
							}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
						>
							<option value="">Select skill level</option>
							<option value="Beginner">Beginner</option>
							<option value="Intermediate">Intermediate</option>
							<option value="Advanced">Advanced</option>
							<option value="Professional">Professional</option>
						</select>
					</div>

					{/* Learning Goals with character counter */}
					<div>
						<div className="mb-1 flex items-center justify-between">
							<label className="block font-medium text-gray-700 text-sm">
								Learning Goals
							</label>
							<span
								className={`text-xs ${formData.goals.length > GOALS_CHAR_LIMIT ? "text-red-500" : "text-gray-500"}`}
							>
								{formData.goals.length}/{GOALS_CHAR_LIMIT}
							</span>
						</div>
						<textarea
							value={formData.goals}
							onChange={(e) =>
								setFormData({ ...formData, goals: e.target.value })
							}
							className={`w-full border px-3 py-2 ${formData.goals.length > GOALS_CHAR_LIMIT ? "border-red-500" : "border-gray-300"} min-h-[100px] resize-y rounded-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
							placeholder="What are your badminton goals?"
							maxLength={GOALS_CHAR_LIMIT}
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
							placeholder="Tell us about yourself"
							maxLength={BIO_CHAR_LIMIT}
						/>
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
