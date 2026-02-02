"use client";

import { useState } from "react";
import { CoachCard } from "~/app/_components/coaches/CoachCard";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";

// Define the type locally since we're not importing from a schema file
type SortBy = "rate" | "createdAt" | "name";
type SortOrder = "asc" | "desc";

type GetCoachesInput = {
	page: number;
	limit: number;
	search?: string;
	specialties?: string[];
	teachingStyles?: string[];
	minRate?: number;
	maxRate?: number;
	isVerified?: boolean;
	sortBy: SortBy;
	sortOrder: SortOrder;
};

export function CoachesListing() {
	const [page, setPage] = useState(1);
	const [limit] = useState(10);

	const [sortBy, setSortBy] = useState<GetCoachesInput["sortBy"]>("createdAt");
	const [sortOrder, setSortOrder] =
		useState<GetCoachesInput["sortOrder"]>("desc");

	// Use the API to fetch coaches
	const { data, isLoading, error } = api.coaches.getCoaches.useQuery({
		page,
		limit,
		sortBy,
		sortOrder,
	});

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Available Coaches</h2>
				<div className="flex items-center gap-2">
					<label className="text-sm text-gray-600">Sort by:</label>
					<select
						className="border border-gray-300 rounded-md px-2 py-1 text-sm"
						value={`${sortBy}_${sortOrder}`}
						onChange={(e) => {
							const [newSortBy, newSortOrder] = e.target.value.split("_") as [
								GetCoachesInput["sortBy"],
								GetCoachesInput["sortOrder"],
							];
							setSortBy(newSortBy);
							setSortOrder(newSortOrder);
						}}
					>
						<option value="rate_asc">Price: Low to High</option>
						<option value="rate_desc">Price: High to Low</option>
						<option value="name_asc">Name: A to Z</option>
						<option value="name_desc">Name: Z to A</option>
						<option value="createdAt_desc">Newest First</option>
						<option value="createdAt_asc">Oldest First</option>
					</select>
				</div>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex justify-center items-center py-12">
					<Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
					<span className="ml-2 text-gray-600">Loading coaches...</span>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md my-4">
					<p>Error loading coaches. Please try again later.</p>
					<p className="text-sm mt-1">{error.message}</p>
				</div>
			)}

			{/* Empty State */}
			{data?.coaches.length === 0 && !isLoading && !error && (
				<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
					<p className="text-gray-500">
						No coaches found matching your criteria.
					</p>
				</div>
			)}

			{/* Coaches Grid */}
			{data?.coaches && data.coaches.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{data.coaches.map((coach) => (
						<CoachCard key={coach.coachProfileId} coach={coach} />
					))}
				</div>
			)}

			{/* Pagination */}
			{data?.pagination && (
				<div className="flex justify-center mt-8">
					<div className="flex gap-2">
						<button
							className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
							disabled={page === 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							Previous
						</button>
						<span className="px-3 py-1 bg-[var(--primary)] text-white rounded-md">
							{page}
						</span>
						<button
							className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
							disabled={page >= data.pagination.pageCount}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
