"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useAuth } from "@clerk/nextjs";
import { UserType } from "@prisma/client";
import CoachingNoteModal from "~/app/_components/client/authed/CoachingNoteModal";
import {
	Users,
	Video,
	MessageSquare,
	TrendingUp,
	Calendar,
	BookOpen,
	Award,
	Clock,
} from "lucide-react";

export default function Dashboard() {
	const { isSignedIn } = useAuth();
	const { data: user } = api.user.getOrCreateProfile.useQuery();
	const {
		data: allMedia,
		isLoading: mediaLoading,
		error: mediaError,
	} = api.videoCollection.getAllMediaForCoaches.useQuery(undefined, {
		enabled: user?.userType === "COACH" || user?.userType === "ADMIN",
	});
	const {
		data: dashboardMetrics,
		isLoading: metricsLoading,
		error: metricsError,
	} = api.user.getCoachDashboardMetrics.useQuery(undefined, {
		enabled: user?.userType === "COACH" || user?.userType === "ADMIN",
	});
	const {
		data: studentCollections,
		isLoading: collectionsLoading,
		error: collectionsError,
	} = api.videoCollection.getAll.useQuery(undefined, {
		enabled: user?.userType === "STUDENT",
	});

	const [selectedMedia, setSelectedMedia] = useState<{
		mediaId: string;
		mediaTitle: string;
		studentName: string;
		collectionTitle: string;
	} | null>(null);

	if (!isSignedIn) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-gray-600">
					Please sign in to access your dashboard.
				</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-gray-600">Loading your dashboard...</p>
			</div>
		);
	}

	const renderStudentDashboard = () => {
		// Calculate total media count across all collections
		const totalMediaCount =
			studentCollections?.reduce((total, collection) => {
				return total + (collection.media?.length || 0);
			}, 0) || 0;

		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center">
							<Video className="h-8 w-8 text-blue-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">
									Video Collections
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{collectionsLoading
										? "..."
										: collectionsError
											? "Error"
											: studentCollections?.length || 0}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center">
							<MessageSquare className="h-8 w-8 text-green-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">
									Coaching Notes
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{collectionsLoading
										? "..."
										: collectionsError
											? "Error"
											: "N/A"}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center">
							<Calendar className="h-8 w-8 text-purple-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Sessions</p>
								<p className="text-2xl font-bold text-gray-900">
									{collectionsLoading
										? "..."
										: collectionsError
											? "Error"
											: "N/A"}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center">
							<TrendingUp className="h-8 w-8 text-orange-600" />
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">
									Total Videos
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{collectionsLoading
										? "..."
										: collectionsError
											? "Error"
											: totalMediaCount}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">
						Quick Actions
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<a
							href="/video-collections/create"
							className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<Video className="h-6 w-6 text-blue-600 mr-3" />
							<div>
								<p className="font-medium text-gray-900">Upload Video</p>
								<p className="text-sm text-gray-600">
									Create a new video collection
								</p>
							</div>
						</a>

						<a
							href="/coaches"
							className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<Users className="h-6 w-6 text-green-600 mr-3" />
							<div>
								<p className="font-medium text-gray-900">Find Coaches</p>
								<p className="text-sm text-gray-600">
									Browse available coaches
								</p>
							</div>
						</a>
					</div>
				</div>
			</div>
		);
	};

	const renderCoachDashboard = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Users className="h-8 w-8 text-blue-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Students</p>
							<p className="text-2xl font-bold text-gray-900">
								{metricsLoading
									? "..."
									: metricsError
										? "Error"
										: (dashboardMetrics?.studentCount ?? 0)}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Video className="h-8 w-8 text-green-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Media to Review
							</p>
							<p className="text-2xl font-bold text-gray-900">
								{mediaLoading
									? "..."
									: mediaError
										? "Error"
										: allMedia?.length || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<MessageSquare className="h-8 w-8 text-purple-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Notes Given</p>
							<p className="text-2xl font-bold text-gray-900">
								{mediaLoading
									? "..."
									: mediaError
										? "Error"
										: allMedia?.reduce(
												(total, media) =>
													total + (media.coachingNotes?.length || 0),
												0,
											) || 0}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Clock className="h-8 w-8 text-orange-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">This Week</p>
							<p className="text-2xl font-bold text-gray-900">
								{metricsLoading
									? "..."
									: metricsError
										? "Error"
										: (dashboardMetrics?.weeklyNotesCount ?? 0)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Student Media Review Section */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">
						Student Media Review
					</h2>
					<p className="text-gray-600 mt-1">
						Review student videos and provide coaching feedback
					</p>
				</div>

				{mediaLoading ? (
					<div className="p-8 text-center">
						<p className="text-gray-600">Loading student media...</p>
					</div>
				) : !allMedia || allMedia.length === 0 ? (
					<div className="p-8 text-center">
						<Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<p className="text-gray-500 text-lg">
							No student media available for review
						</p>
						<p className="text-gray-400 text-sm mt-2">
							Students need to upload videos to their collections first
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Student
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Collection
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Media Title
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Coaching Notes
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Created
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{allMedia.map((media) => (
									<tr key={media.mediaId} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{media.collection.user.firstName}{" "}
												{media.collection.user.lastName}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{media.collection.title}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{media.title}</div>
											{media.description && (
												<div className="text-sm text-gray-500 truncate max-w-xs">
													{media.description}
												</div>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{media.coachingNotes?.length || 0} notes
											</div>
											{media.coachingNotes &&
												media.coachingNotes.length > 0 &&
												media.coachingNotes[0]?.createdAt && (
													<div className="text-xs text-gray-500">
														Latest:{" "}
														{new Date(
															media.coachingNotes[0].createdAt,
														).toLocaleDateString()}
													</div>
												)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(media.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<button
												onClick={() =>
													window.open(
														`/video-collections/${media.collectionId}`,
														"_blank",
													)
												}
												className="text-blue-600 hover:text-blue-900 mr-4"
											>
												View Media
											</button>
											<button
												onClick={() => {
													setSelectedMedia({
														mediaId: media.mediaId,
														mediaTitle: media.title,
														studentName: `${media.collection.user.firstName} ${media.collection.user.lastName}`,
														collectionTitle: media.collection.title,
													});
												}}
												className="text-green-600 hover:text-green-900"
											>
												Manage Notes
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);

	const renderAdminDashboard = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Users className="h-8 w-8 text-blue-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Users</p>
							<p className="text-2xl font-bold text-gray-900">
								{metricsLoading ? "..." : metricsError ? "Error" : "N/A"}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Award className="h-8 w-8 text-green-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Active Coaches
							</p>
							<p className="text-2xl font-bold text-gray-900">
								{metricsLoading ? "..." : metricsError ? "Error" : "N/A"}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<BookOpen className="h-8 w-8 text-purple-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Active Students
							</p>
							<p className="text-2xl font-bold text-gray-900">
								{metricsLoading
									? "..."
									: metricsError
										? "Error"
										: (dashboardMetrics?.studentCount ?? "N/A")}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex items-center">
						<Video className="h-8 w-8 text-orange-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Total Collections
							</p>
							<p className="text-2xl font-bold text-gray-900">
								{mediaLoading
									? "..."
									: mediaError
										? "Error"
										: (allMedia?.length ?? 0)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Admin has access to both coach and student views */}
			{renderCoachDashboard()}
		</div>
	);

	const getDashboardTitle = () => {
		switch (user.userType) {
			case UserType.COACH:
				return "Coach Dashboard";
			case UserType.ADMIN:
				return "Admin Dashboard";
			case UserType.FACILITY:
				return "Facility Dashboard";
			default:
				return "Student Dashboard";
		}
	};

	const getDashboardSubtitle = () => {
		switch (user.userType) {
			case UserType.COACH:
				return "Manage your students and provide coaching feedback";
			case UserType.ADMIN:
				return "Oversee platform operations and user management";
			case UserType.FACILITY:
				return "Manage your facility and bookings";
			default:
				return "Track your progress and manage your training";
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					{getDashboardTitle()}
				</h1>
				<p className="text-gray-600">{getDashboardSubtitle()}</p>
			</div>
			{user.userType === UserType.STUDENT && renderStudentDashboard()}
			{user.userType === UserType.COACH && renderCoachDashboard()}
			{user.userType === UserType.ADMIN && renderAdminDashboard()}
			{user.userType === UserType.FACILITY && renderStudentDashboard()}{" "}
			{/* Placeholder for facility */}
			{/* Coaching Notes Modal */}
			{selectedMedia && (
				<CoachingNoteModal
					isOpen={!!selectedMedia}
					onClose={() => setSelectedMedia(null)}
					mediaId={selectedMedia.mediaId}
					mediaTitle={selectedMedia.mediaTitle}
					studentName={selectedMedia.studentName}
					collectionTitle={selectedMedia.collectionTitle}
					userType={user?.userType}
				/>
			)}
		</div>
	);
}
