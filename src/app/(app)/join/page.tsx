"use client";

import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBanner } from "~/app/_components/shared/ErrorBanner";
import { api } from "~/trpc/react";

// Minimum characters before we fire the typeahead query
const MIN_QUERY_LEN = 4;

function JoinPageContent() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Track clubs joined this session so the badge appears immediately after success
	const [justJoined, setJustJoined] = useState<Set<string>>(new Set());

	// Debounce the query so we don't fire on every keystroke
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setDebouncedQuery(query.trim());
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	const isSearchReady = debouncedQuery.length >= MIN_QUERY_LEN;

	const {
		data: results,
		isFetching,
		error,
	} = api.user.searchClubs.useQuery(
		{ query: debouncedQuery },
		{ enabled: isSearchReady },
	);

	// getOrCreateProfile gives us User.clubShortName — the active club even for
	// users who have no UserClub rows yet (e.g. freshly created default-club users).
	const { data: profile } = api.user.getOrCreateProfile.useQuery();

	// getClubMemberships covers any additional clubs from the UserClub join table.
	const { data: memberships } = api.user.getClubMemberships.useQuery();

	// Combine all known memberships: active club from profile + UserClub rows + this session
	const alreadyMemberOf = new Set([
		...(profile?.clubShortName ? [profile.clubShortName] : []),
		...(memberships?.map((m) => m.clubShortName) ?? []),
		...justJoined,
	]);

	const joinClub = api.user.joinClub.useMutation({
		onSuccess: (data) => {
			// Mark as joined locally so the badge flips immediately
			setJustJoined((prev) => new Set([...prev, data.clubShortName]));
			// joinClub already switches the active club server-side — just navigate
			router.push("/dashboard");
			router.refresh();
		},
	});

	return (
		<div className="mx-auto max-w-xl px-4 py-16">
			<div className="mb-8 text-center">
				<h1 className="font-bold text-3xl text-gray-900">Find your club</h1>
				<p className="mt-2 text-gray-500 text-sm">
					Search by club name or short ID. Results appear after{" "}
					{MIN_QUERY_LEN} characters.
				</p>
			</div>

			{/* Search input */}
			<div className="relative mb-6">
				<Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					autoFocus
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="e.g. Badminton Ontario or badminton-ontario"
					className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
				/>
			</div>

			{/* Status / results */}
			{!isSearchReady && query.length > 0 && (
				<p className="text-center text-gray-400 text-sm">
					Keep typing… ({MIN_QUERY_LEN - query.trim().length} more character
					{MIN_QUERY_LEN - query.trim().length === 1 ? "" : "s"})
				</p>
			)}

			{isSearchReady && isFetching && (
				<p className="text-center text-gray-400 text-sm">Searching…</p>
			)}

			{isSearchReady && error && (
				<ErrorBanner message={error.message} />
			)}

			{isSearchReady && !isFetching && results && results.length === 0 && (
				<p className="text-center text-gray-500 text-sm">
					No clubs found for &ldquo;{debouncedQuery}&rdquo;.
				</p>
			)}

			{isSearchReady && results && results.length > 0 && (
				<div className="glass-panel divide-y divide-gray-100 overflow-hidden rounded-lg">
					{results.map((club) => {
						const isMember = alreadyMemberOf.has(club.clubShortName);
						const isPending =
							joinClub.isPending &&
							joinClub.variables?.clubShortName === club.clubShortName;

						return (
							<div
								key={club.clubShortName}
								className="flex items-center justify-between gap-4 px-4 py-3"
							>
								<div className="min-w-0">
									<p className="truncate font-medium text-gray-900 text-sm">
										{club.clubName}
									</p>
									<p className="truncate text-gray-500 text-xs">
										{club.clubShortName}
									</p>
								</div>

								{isMember ? (
									<span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-green-700 text-xs font-medium">
										Already a member
									</span>
								) : (
									<button
										type="button"
										disabled={joinClub.isPending}
										onClick={() =>
											joinClub.mutate({ clubShortName: club.clubShortName })
										}
										className="shrink-0 rounded-lg bg-[var(--primary)] px-4 py-1.5 text-white text-xs font-medium transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isPending ? "Joining…" : "Join"}
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}

			{joinClub.isError && (
				<ErrorBanner message={joinClub.error.message} className="mt-4" />
			)}
		</div>
	);
}

export default function JoinPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<Suspense
					fallback={<div className="py-16 text-center text-gray-500">Loading…</div>}
				>
					<JoinPageContent />
				</Suspense>
			</SignedIn>
		</>
	);
}
