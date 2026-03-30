/**
 * useUrlPagination — derive pagination + filter state from URL search params.
 *
 * Usage:
 *   const { page, limit, search, setPage, setLimit, syncUrl } = useUrlPagination({
 *     defaultLimit: 20,
 *     validLimits: [10, 20, 50],
 *   });
 *
 * All state lives in the URL. Browser back/forward navigates between pages.
 * Search is debounced (300ms) before syncing to URL.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UseUrlPaginationOptions {
	defaultLimit?: number;
	validLimits?: number[];
}

export function useUrlPagination({
	defaultLimit = 20,
	validLimits = [10, 20, 50],
}: UseUrlPaginationOptions = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Derive state from URL
	const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
	const limit = (() => {
		const v = Number(searchParams.get("limit") ?? String(defaultLimit));
		return validLimits.includes(v) ? v : defaultLimit;
	})();
	const searchFromUrl = searchParams.get("search") ?? "";

	const [searchInput, setSearchInput] = useState(searchFromUrl);
	const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);

	// Debounce search
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
		return () => clearTimeout(t);
	}, [searchInput]);

	// Push changes to URL
	const syncUrl = useCallback(
		(updates: Record<string, string | number | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(updates)) {
				if (val === undefined || val === "") {
					params.delete(key);
				} else {
					params.set(key, String(val));
				}
			}
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// When debounced search changes, sync to URL and reset page
	useEffect(() => {
		if (debouncedSearch !== searchFromUrl) {
			syncUrl({ page: "1", search: debouncedSearch || undefined });
		}
	}, [debouncedSearch, searchFromUrl, syncUrl]);

	const setPage = useCallback(
		(p: number) => syncUrl({ page: String(p) }),
		[syncUrl],
	);

	const setLimit = useCallback(
		(l: number) => syncUrl({ page: "1", limit: String(l) }),
		[syncUrl],
	);

	return {
		page,
		limit,
		search: debouncedSearch,
		searchInput,
		setSearchInput,
		setPage,
		setLimit,
		syncUrl,
	};
}
