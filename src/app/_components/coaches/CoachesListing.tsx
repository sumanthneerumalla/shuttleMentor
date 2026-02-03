"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CoachCard } from "~/app/_components/coaches/CoachCard";
import { api } from "~/trpc/react";

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
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-xl">Available Coaches</h2>
				<div className="flex items-center gap-2">
					<label className="text-gray-600 text-sm">Sort by:</label>
					<select
						className="rounded-md border border-gray-300 px-2 py-1 text-sm"
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
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
					<span className="ml-2 text-gray-600">Loading coaches...</span>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="my-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
					<p>Error loading coaches. Please try again later.</p>
					<p className="mt-1 text-sm">{error.message}</p>
				</div>
			)}

			{/* Empty State */}
			{data?.coaches.length === 0 && !isLoading && !error && (
				<div className="rounded-lg border border-gray-300 border-dashed py-12 text-center">
					<p className="text-gray-500">
						No coaches found matching your criteria.
					</p>
				</div>
			)}

			{/* Coaches Grid */}
			{data?.coaches && data.coaches.length > 0 && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{data.coaches.map((coach) => (
						<CoachCard key={coach.coachProfileId} coach={coach} />
					))}
				</div>
			)}

			{/* Pagination */}
			{data?.pagination && (
				<div className="mt-8 flex justify-center">
					<div className="flex gap-2">
						<button
							className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
							disabled={page === 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							Previous
						</button>
						<span className="rounded-md bg-[var(--primary)] px-3 py-1 text-white">
							{page}
						</span>
						<button
							className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
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
