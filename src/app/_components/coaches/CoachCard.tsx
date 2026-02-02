"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { ProfileAvatar } from "../shared/ProfileAvatar";

interface CoachCardProps {
	coach: {
		coachProfileId: string;
		displayUsername: string | null;
		firstName: string | null;
		lastName: string | null;
		bio: string | null;
		specialties: string[];
		rate: number;
		isVerified: boolean;
		profileImageUrl: string | null;
		clubName: string;
	};
}

export function CoachCard({ coach }: CoachCardProps) {
	const fullName = `${coach.firstName || ""} ${coach.lastName || ""}`.trim();

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
			<Link href={`/coaches/${coach.displayUsername || coach.coachProfileId}`}>
				<div className="p-4">
					<div className="flex items-center gap-4">
						<ProfileAvatar
							imageUrl={coach.profileImageUrl}
							name={fullName}
							alt={`${fullName}'s profile`}
							size="lg"
						/>
						<div>
							<div className="flex items-center gap-1">
								<h3 className="text-lg font-semibold">{fullName}</h3>
								{coach.isVerified && (
									<CheckCircle className="w-4 h-4 text-green-500" />
								)}
							</div>
							<p className="text-sm text-gray-600">{coach.clubName}</p>
							<p className="text-[var(--primary)] font-medium">
								${coach.rate}/hour
							</p>
						</div>
					</div>

					{coach.bio && (
						<p className="mt-3 text-gray-600 text-sm line-clamp-2">
							{coach.bio}
						</p>
					)}

					{coach.specialties.length > 0 && (
						<div className="mt-3">
							<div className="flex flex-wrap gap-1">
								{coach.specialties.slice(0, 3).map((specialty) => (
									<span
										key={specialty}
										className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
									>
										{specialty}
									</span>
								))}
								{coach.specialties.length > 3 && (
									<span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
										+{coach.specialties.length - 3} more
									</span>
								)}
							</div>
						</div>
					)}

					<div className="mt-4 flex justify-end">
						<span className="text-sm text-[var(--primary)] font-medium">
							View Profile →
						</span>
					</div>
				</div>
			</Link>
		</div>
	);
}
