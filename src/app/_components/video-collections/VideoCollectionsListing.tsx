"use client";

import { UserType } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { hasCoachingAccess, isFacilityOrAbove } from "~/lib/utils";
import { getYouTubeThumbnailUrl } from "~/lib/videoUtils";
import { api } from "~/trpc/react";
import { Select } from "~/app/_components/shared/ui/select";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

interface VideoCollectionsListingProps {
	userType: UserType;
	userId: string;
}

export function VideoCollectionsListing({
	userType,
	userId,
}: VideoCollectionsListingProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Derive pagination state directly from URL — single source of truth.
	// State is only used for the search input (controlled input) and debounce.
	const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
	const limit = (() => {
		const v = Number(searchParams.get("limit") ?? "12");
		return PAGE_SIZE_OPTIONS.includes(v as (typeof PAGE_SIZE_OPTIONS)[number])
			? (v as (typeof PAGE_SIZE_OPTIONS)[number])
			: 12;
	})();
	const searchFromUrl = searchParams.get("search") ?? "";

	const [searchInput, setSearchInput] = useState(searchFromUrl);
	const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);

	// Debounce search input — only updates URL after 300 ms of no typing
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
		return () => clearTimeout(t);
	}, [searchInput]);

	// Push changes into URL. Never called on mount — only called from event handlers.
	const syncUrl = useCallback(
		(updates: { page?: number; limit?: number; search?: string }) => {
			const params = new URLSearchParams(searchParams.toString());
			if (updates.page !== undefined) params.set("page", String(updates.page));
			if (updates.limit !== undefined)
				params.set("limit", String(updates.limit));
			if (updates.search !== undefined) {
				if (updates.search) params.set("search", updates.search);
				else params.delete("search");
			}
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// When debounced search changes, push it to URL and reset to page 1
	useEffect(() => {
		if (debouncedSearch !== searchFromUrl) {
			syncUrl({ page: 1, search: debouncedSearch });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	const { data, isLoading } = api.videoCollection.getAll.useQuery({
		page,
		limit,
		search: debouncedSearch || undefined,
	});

	const canCreate =
		userType === UserType.STUDENT ||
		(userType ? isFacilityOrAbove({ userType }) : false);

	const isCoach = userType === UserType.COACH;
	const isAdminOrCoach = userType ? hasCoachingAccess({ userType }) : false;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-5xl">
				{/* Header */}
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<h1 className="section-heading">Video Collections</h1>
					{canCreate && (
						<Link
							href="/video-collections/create"
							className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
						>
							Create New
						</Link>
					)}
				</div>

				{/* Search + page-size controls */}
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<div className="relative min-w-0 flex-1 sm:min-w-[200px]">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Search collections…"
							className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
						/>
					</div>
					<div className="flex items-center gap-2 text-gray-600 text-sm">
						<span>Show</span>
						<Select
							value={limit}
							onChange={(e) => {
								syncUrl({ limit: Number(e.target.value), page: 1 });
							}}
						>
							{PAGE_SIZE_OPTIONS.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</Select>
						<span>per page</span>
					</div>
				</div>

				{/* Collection grid */}
				{isLoading ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: limit }).map((_, i) => (
							<div
								key={i}
								className="animate-pulse rounded-xl bg-gray-100"
								style={{ height: 220 }}
							/>
						))}
					</div>
				) : !data?.collections.length ? (
					<div className="glass-panel p-6 text-center">
						{isCoach ? (
							<p className="mb-4 text-gray-600">
								No video collections have been assigned to you yet.
							</p>
						) : (
							<>
								<p className="mb-4 text-gray-600">
									{debouncedSearch
										? `No collections match "${debouncedSearch}".`
										: "No video collections found."}
								</p>
								{canCreate && !debouncedSearch && (
									<Link
										href="/video-collections/create"
										className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
									>
										Create your first video collection
									</Link>
								)}
							</>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{data.collections.map((collection) => (
							<Link
								key={collection.collectionId}
								href={`/video-collections/${collection.collectionId}`}
								className="glass-card transition-shadow hover:shadow-md"
							>
								{/* Thumbnail */}
								<div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
									{collection.media[0]?.thumbnailUrl ||
									(collection.media[0]?.videoUrl &&
										getYouTubeThumbnailUrl(collection.media[0].videoUrl)) ? (
										<img
											src={
												collection.media[0]?.thumbnailUrl ||
												getYouTubeThumbnailUrl(
													collection.media[0]?.videoUrl ?? "",
												) ||
												""
											}
											alt={collection.title}
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
										{collection.title}
									</h2>

									{collection.description && (
										<p className="mb-2 line-clamp-2 text-gray-600 text-sm">
											{collection.description}
										</p>
									)}

									<div className="mt-2 flex items-center justify-between text-gray-500 text-xs">
										<span>
											{collection._count.media} video
											{collection._count.media !== 1 ? "s" : ""}
										</span>

										{/* Show creator for admin/coach */}
										{isAdminOrCoach && collection.user && (
											<span>
												By: {collection.user.firstName ?? ""}{" "}
												{collection.user.lastName ?? ""}
											</span>
										)}
									</div>

									{/* Assigned coach */}
									{collection.assignedCoach && (
										<div className="mt-2 text-blue-600 text-xs">
											Coach: {collection.assignedCoach.firstName}{" "}
											{collection.assignedCoach.lastName}
											{collection.assignedCoach.coachProfile
												?.displayUsername && (
												<span className="text-gray-500">
													{" "}
													(@
													{
														collection.assignedCoach.coachProfile
															.displayUsername
													}
													)
												</span>
											)}
										</div>
									)}

									{/* No coach assigned — students' own unassigned collections */}
									{userType === UserType.STUDENT &&
										collection.userId === userId &&
										!collection.assignedCoach && (
											<div className="mt-2 text-gray-400 text-xs">
												No coach assigned
											</div>
										)}
								</div>
							</Link>
						))}
					</div>
				)}

				{/* Pagination controls */}
				{data?.pagination && data.pagination.pageCount > 1 && (
					<div className="mt-8 flex flex-wrap items-center justify-between gap-3">
						<p className="text-gray-500 text-sm">
							Showing{" "}
							{Math.min(
								(data.pagination.page - 1) * data.pagination.limit + 1,
								data.pagination.total,
							)}
							–
							{Math.min(
								data.pagination.page * data.pagination.limit,
								data.pagination.total,
							)}{" "}
							of {data.pagination.total} collection
							{data.pagination.total !== 1 ? "s" : ""}
						</p>
						<div className="flex gap-2">
							<button
								className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
								disabled={page === 1}
								onClick={() => syncUrl({ page: Math.max(1, page - 1) })}
							>
								<ChevronLeft size={14} /> Previous
							</button>
							<span className="rounded-md bg-[var(--primary)] px-3 py-1 text-sm text-white">
								{page}
							</span>
							<button
								className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
								disabled={page >= data.pagination.pageCount}
								onClick={() => syncUrl({ page: page + 1 })}
							>
								Next <ChevronRight size={14} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
