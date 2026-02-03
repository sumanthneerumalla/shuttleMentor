"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type ClubOption = {
	clubShortName: string;
	clubName: string;
};

interface AdminClubIdSelectorProps {
	selectedClubShortName: string;
	selectedClubName: string;
	onSelect: (club: ClubOption) => void;
	className?: string;
}

export default function AdminClubIdSelector({
	selectedClubShortName,
	selectedClubName,
	onSelect,
	className,
}: AdminClubIdSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");

	const {
		data: clubs,
		isLoading,
		error,
	} = api.user.getAvailableClubs.useQuery(undefined, {
		enabled: true,
	});

	const filteredClubs = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const list: ClubOption[] = clubs ?? [];

		if (!normalizedQuery) return list;

		return list.filter((club: ClubOption) => {
			return (
				club.clubShortName.toLowerCase().includes(normalizedQuery) ||
				club.clubName.toLowerCase().includes(normalizedQuery)
			);
		});
	}, [clubs, query]);

	const currentLabel = selectedClubName
		? `${selectedClubName} (${selectedClubShortName})`
		: selectedClubShortName || "Select a club";

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between">
				<label className="block font-medium text-gray-700 text-sm">
					Club ID
				</label>
			</div>

			<Button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				variant="outline"
				className="w-full justify-between"
			>
				<span className="truncate">{currentLabel}</span>
				{isOpen ? (
					<ChevronUp className="h-4 w-4" />
				) : (
					<ChevronDown className="h-4 w-4" />
				)}
			</Button>

			{isOpen && (
				<div className="glass-panel overflow-hidden rounded-lg">
					<div className="border-gray-200 border-b p-3">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
							placeholder="Search clubs by id or name"
						/>
					</div>

					{isLoading ? (
						<div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
					) : error ? (
						<div className="px-3 py-2 text-red-600 text-sm">
							{error.message}
						</div>
					) : filteredClubs.length === 0 ? (
						<div className="px-3 py-2 text-gray-500 text-sm">
							No clubs found
						</div>
					) : (
						<div className="max-h-56 overflow-y-auto">
							{filteredClubs.map((club) => {
								const isSelected = club.clubShortName === selectedClubShortName;

								return (
									<button
										key={club.clubShortName}
										type="button"
										className="dropdown-item w-full text-left"
										onClick={() => {
											onSelect(club);
											setIsOpen(false);
											setQuery("");
										}}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="truncate text-gray-900 text-sm">
													{club.clubShortName}
												</div>
												<div className="truncate text-gray-500 text-xs">
													{club.clubName}
												</div>
											</div>
											{isSelected && (
												<Check className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}

			<p className="text-gray-500 text-xs">
				Admins can only select from existing clubs.
			</p>
		</div>
	);
}
