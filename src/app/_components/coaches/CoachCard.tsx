"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
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
		<div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
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
								<h3 className="font-semibold text-lg">{fullName}</h3>
								{coach.isVerified && (
									<CheckCircle className="h-4 w-4 text-green-500" />
								)}
							</div>
							<p className="text-gray-600 text-sm">{coach.clubName}</p>
							<p className="font-medium text-[var(--primary)]">
								${coach.rate}/hour
							</p>
						</div>
					</div>

					{coach.bio && (
						<p className="mt-3 line-clamp-2 text-gray-600 text-sm">
							{coach.bio}
						</p>
					)}

					{coach.specialties.length > 0 && (
						<div className="mt-3">
							<div className="flex flex-wrap gap-1">
								{coach.specialties.slice(0, 3).map((specialty) => (
									<span
										key={specialty}
										className="rounded-full bg-gray-100 px-2 py-1 text-gray-800 text-xs"
									>
										{specialty}
									</span>
								))}
								{coach.specialties.length > 3 && (
									<span className="rounded-full bg-gray-100 px-2 py-1 text-gray-800 text-xs">
										+{coach.specialties.length - 3} more
									</span>
								)}
							</div>
						</div>
					)}

					<div className="mt-4 flex justify-end">
						<span className="font-medium text-[var(--primary)] text-sm">
							View Profile →
						</span>
					</div>
				</div>
			</Link>
		</div>
	);
}
