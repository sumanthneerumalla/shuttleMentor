"use client";

import { Calendar, CheckCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { ProfileAvatar } from "../shared/ProfileAvatar";

interface CoachDetailProps {
	coach: {
		coachProfileId: string;
		displayUsername: string;
		firstName: string | null;
		lastName: string | null;
		bio: string | null;
		experience: string | null;
		specialties: string[];
		teachingStyles: string[];
		rate: number;
		isVerified: boolean;
		headerImage: string | null;
		profileImageUrl: string | null;
		createdAt: string;
		clubName: string;
	};
}

export function CoachDetail({ coach }: CoachDetailProps) {
	const fullName = `${coach.firstName || ""} ${coach.lastName || ""}`.trim();
	const joinDate = new Date(coach.createdAt).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
	});

	return (
		<div>
			{/* Header Section */}
			<div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
					<div className="flex-shrink-0">
						<ProfileAvatar
							imageUrl={coach.profileImageUrl}
							name={fullName}
							alt={`${fullName}'s profile`}
							size="xl"
						/>
					</div>

					<div className="flex-grow text-center md:text-left">
						<div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
							<h1 className="font-bold text-2xl">{fullName}</h1>
							{coach.isVerified && (
								<div className="flex items-center font-medium text-green-600 text-sm">
									<CheckCircle className="mr-1 h-4 w-4" />
									Verified
								</div>
							)}
						</div>

						<p className="mb-2 font-medium text-gray-600">{coach.clubName}</p>

						<p className="mb-4 text-gray-600">{coach.bio}</p>

						<div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
							{coach.specialties.map((specialty) => (
								<span
									key={specialty}
									className="rounded-full border border-[var(--primary)] bg-white px-3 py-1 text-[var(--primary)] text-sm"
								>
									{specialty}
								</span>
							))}
						</div>

						<p className="text-gray-500 text-sm">Coach since {joinDate}</p>
					</div>

					<div className="flex flex-shrink-0 flex-col items-center gap-3">
						<div className="text-center">
							<p className="text-gray-600 text-sm">Hourly Rate</p>
							<p className="font-bold text-2xl text-[var(--primary)]">
								${coach.rate}
							</p>
						</div>

						<div className="flex flex-col gap-2">
							<button className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]">
								<Calendar className="h-4 w-4" />
								Book a Session
							</button>

							<button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50">
								<MessageCircle className="h-4 w-4" />
								Contact
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Details Section */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* Left Column */}
				<div className="md:col-span-2">
					{/* Experience */}
					<div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="mb-4 font-semibold text-xl">Experience</h2>
						<p className="whitespace-pre-wrap text-gray-700">
							{coach.experience}
						</p>
					</div>

					{/* Teaching Style */}
					<div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="mb-4 font-semibold text-xl">Teaching Style</h2>
						<div className="flex flex-wrap gap-2">
							{coach.teachingStyles.map((style) => (
								<span
									key={style}
									className="rounded-full bg-gray-100 px-3 py-1 text-gray-800 text-sm"
								>
									{style}
								</span>
							))}
						</div>
					</div>

					{/* Reviews - Placeholder */}
					<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="mb-4 font-semibold text-xl">Reviews</h2>
						<p className="text-gray-500 italic">No reviews yet.</p>
					</div>
				</div>

				{/* Right Column */}
				<div>
					{/* Booking Widget - Placeholder */}
					<div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="mb-4 font-semibold text-lg">Book a Session</h2>
						<p className="mb-4 text-gray-500 text-sm">
							Select a date and time to book a session with {fullName}.
						</p>
						<div className="rounded-lg border border-gray-300 border-dashed py-8 text-center">
							<p className="text-gray-500">Booking calendar coming soon</p>
						</div>
					</div>

					{/* Contact Info - Placeholder */}
					<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h2 className="mb-4 font-semibold text-lg">Contact</h2>
						<p className="text-gray-500 text-sm">
							Contact {fullName} directly through ShuttleMentor messaging.
						</p>
						<Link
							href="#"
							className="mt-4 block w-full rounded-lg border border-gray-300 px-4 py-2 text-center transition-colors hover:bg-gray-50"
						>
							Send Message
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
