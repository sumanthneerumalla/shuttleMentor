import { UserType } from "@prisma/client";
import Link from "next/link";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import { getYouTubeThumbnailUrl } from "~/lib/videoUtils";
import { db } from "~/server/db";

export default async function VideoCollectionsPage() {
	const user = await getOnboardedUserOrRedirect();

	// Fetch video libraries based on user type
	let libraries;
	let mediaCountMap: Record<string, number> = {};

	if (user.userType === UserType.ADMIN) {
		// Admins can see all libraries
		libraries = await db.videoCollection.findMany({
			where: { isDeleted: false },
			include: {
				media: {
					where: { isDeleted: false },
					take: 1,
				},
				user: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
				assignedCoach: {
					select: {
						firstName: true,
						lastName: true,
						coachProfile: {
							select: {
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	} else if (user.userType === UserType.COACH) {
		// Coaches can only see collections assigned to them
		libraries = await db.videoCollection.findMany({
			where: {
				assignedCoachId: user.userId,
				isDeleted: false,
			},
			include: {
				media: {
					where: { isDeleted: false },
					take: 1,
				},
				user: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
				assignedCoach: {
					select: {
						firstName: true,
						lastName: true,
						coachProfile: {
							select: {
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	} else if (user.userType === UserType.FACILITY) {
		libraries = await db.videoCollection.findMany({
			where: {
				uploadedByUserId: user.userId,
				isDeleted: false,
			},
			include: {
				media: {
					where: { isDeleted: false },
					take: 1,
				},
				user: {
					select: {
						firstName: true,
						lastName: true,
					},
				},
				assignedCoach: {
					select: {
						firstName: true,
						lastName: true,
						coachProfile: {
							select: {
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	} else {
		// Students can only see their own libraries
		libraries = await db.videoCollection.findMany({
			where: {
				userId: user.userId,
				isDeleted: false,
			},
			include: {
				media: {
					where: { isDeleted: false },
					take: 1,
				},
				assignedCoach: {
					select: {
						firstName: true,
						lastName: true,
						coachProfile: {
							select: {
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	// Get media counts for all libraries
	const libraryIds = libraries.map((lib) => lib.collectionId);
	const mediaCounts = await db.media.groupBy({
		by: ["collectionId"],
		where: {
			collectionId: { in: libraryIds },
			isDeleted: false,
		},
		_count: {
			mediaId: true,
		},
	});

	// Create a map of collection ID to media count
	mediaCountMap = mediaCounts.reduce(
		(acc, item) => {
			acc[item.collectionId] = item._count.mediaId;
			return acc;
		},
		{} as Record<string, number>,
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="section-heading">Video Collections</h1>

					{/* Only show create button for students and admins */}
					{(user.userType === UserType.STUDENT ||
						user.userType === UserType.ADMIN ||
						user.userType === UserType.FACILITY) && (
						<Link
							href="/video-collections/create"
							className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary)]/90"
						>
							Create New
						</Link>
					)}
				</div>

				{libraries.length === 0 ? (
					<div className="glass-panel p-6 text-center">
						{user.userType === UserType.COACH ? (
							<p className="mb-4 text-gray-600">
								No video collections have been assigned to you yet.
							</p>
						) : (
							<>
								<p className="mb-4 text-gray-600">
									No video collections found.
								</p>
								{(user.userType === UserType.STUDENT ||
									user.userType === UserType.ADMIN ||
									user.userType === UserType.FACILITY) && (
									<Link
										href="/video-collections/create"
										className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary)]/90"
									>
										Create your first video collection
									</Link>
								)}
							</>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{libraries.map((library) => (
							<Link
								key={library.collectionId}
								href={`/video-collections/${library.collectionId}`}
								className="glass-card transition-shadow hover:shadow-md"
							>
								<div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
									{library.media[0]?.thumbnailUrl ||
									(library.media[0]?.videoUrl &&
										getYouTubeThumbnailUrl(library.media[0].videoUrl)) ? (
										<img
											src={
												library.media[0]?.thumbnailUrl ||
												getYouTubeThumbnailUrl(
													library.media[0]?.videoUrl ?? "",
												) ||
												""
											}
											alt={library.title}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-gray-200">
											<span className="text-gray-500">No thumbnail</span>
										</div>
									)}
								</div>

								<div className="p-4">
									<h2 className="mb-1 truncate font-semibold text-lg">
										{library.title}
									</h2>

									{library.description && (
										<p className="mb-2 line-clamp-2 text-gray-600 text-sm">
											{library.description}
										</p>
									)}

									<div className="mt-2 flex items-center justify-between text-gray-500 text-xs">
										<span>
											{mediaCountMap[library.collectionId] || 0} video
											{(mediaCountMap[library.collectionId] || 0) !== 1
												? "s"
												: ""}
										</span>

										{/* Show creator name for admins and coaches */}
										{(user.userType === UserType.ADMIN ||
											user.userType === UserType.COACH) && (
											<span>
												By: {(library as any).user?.firstName || "Unknown"}{" "}
												{(library as any).user?.lastName || ""}
											</span>
										)}
									</div>

									{/* Show assigned coach information */}
									{(library as any).assignedCoach && (
										<div className="mt-2 text-blue-600 text-xs">
											Coach: {(library as any).assignedCoach.firstName}{" "}
											{(library as any).assignedCoach.lastName}
											{(library as any).assignedCoach.coachProfile
												?.displayUsername && (
												<span className="text-gray-500">
													{" "}
													(@
													{
														(library as any).assignedCoach.coachProfile
															.displayUsername
													}
													)
												</span>
											)}
										</div>
									)}

									{/* Show "No coach assigned" for students' own collections without assigned coach */}
									{user.userType === UserType.STUDENT &&
										library.userId === user.userId &&
										!(library as any).assignedCoach && (
											<div className="mt-2 text-gray-400 text-xs">
												No coach assigned
											</div>
										)}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
