import { Badge } from "@/app/_components/ui/badge";
import type { Coach, TeachingStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, Medal, Star } from "lucide-react";
import Link from "next/link";
import React from "react";

interface CoachCardProps {
	coach: Coach;
	className?: string;
}

export function CoachCard({ coach, className }: CoachCardProps) {
	return (
		<Link href={`/coaches/${coach.id}`}>
			<div
				className={cn(
					"glass-card hover:-translate-y-1 overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg",
					className,
				)}
			>
				<div className="relative">
					<img
						src={coach.profileImage}
						alt={`${coach.name} - Badminton Coach`}
						className="aspect-[4/3] w-full object-cover"
					/>
					<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-4">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center">
								<span className="flex items-center space-x-1 rounded-md bg-white/90 px-2 py-1 font-medium text-gray-900 text-sm">
									<Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
									<span>{coach.rating.toFixed(1)}</span>
								</span>
								<span className="ml-1 text-white text-xs">
									({coach.reviewCount} reviews)
								</span>
							</div>
							<div className="flex items-center space-x-1 rounded-md bg-white/90 px-2 py-1 font-medium text-gray-900 text-sm">
								<Clock className="h-4 w-4 text-shuttle-500" />
								<span>{coach.experience}+ yrs</span>
							</div>
						</div>
					</div>
				</div>

				<div className="p-5">
					<div className="mb-2 flex items-start justify-between">
						<h3 className="font-bold text-xl">{coach.name}</h3>
						<div className="font-bold text-shuttle-600">
							${coach.hourlyRate}/hr
						</div>
					</div>

					<p className="mb-3 line-clamp-2 text-muted-foreground text-sm">
						{coach.description}
					</p>

					<div className="mb-3">
						<div className="flex flex-wrap gap-1">
							{coach.specialties.slice(0, 3).map((specialty, index) => (
								<Badge key={index} variant="default" className="font-normal">
									{specialty}
								</Badge>
							))}
							{coach.specialties.length > 3 && (
								<Badge variant="outline" className="font-normal">
									+{coach.specialties.length - 3} more
								</Badge>
							)}
						</div>
					</div>

					<div className="mb-3 flex flex-wrap gap-1">
						{coach.teachingStyles.slice(0, 3).map((style, index) => (
							<span key={index} className="coaching-style-chip">
								{style.name}
							</span>
						))}
					</div>

					{coach.badges && coach.badges.length > 0 && (
						<div className="border-gray-200 border-t pt-3 dark:border-gray-700">
							<div className="flex gap-2">
								{coach.badges.slice(0, 2).map((badge, index) => (
									<div
										key={index}
										className="flex items-center text-muted-foreground text-xs"
									>
										<Medal className="mr-1 h-3 w-3 text-shuttle-500" />
										{badge}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}

export default CoachCard;
