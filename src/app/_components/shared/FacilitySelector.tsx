"use client";

import { Building2, ChevronDown } from "lucide-react";

export interface FacilityOption {
	facilityId: string;
	facilityName: string;
}

interface FacilitySelectorProps {
	facilities: FacilityOption[];
	selectedFacilityId: string | null;
	onSelect: (facilityId: string) => void;
}

/**
 * Reusable facility dropdown. Shows a select when 2+ facilities,
 * a static label when exactly 1, nothing when 0.
 */
export function FacilitySelector({
	facilities,
	selectedFacilityId,
	onSelect,
}: FacilitySelectorProps) {
	if (facilities.length === 0) return null;

	if (facilities.length === 1) {
		return (
			<span className="flex items-center gap-1.5 text-sm text-gray-500">
				<Building2 size={14} />
				{facilities[0]!.facilityName}
			</span>
		);
	}

	return (
		<div className="relative">
			<select
				value={selectedFacilityId ?? ""}
				onChange={(e) => onSelect(e.target.value)}
				className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-8 text-sm text-gray-700 transition-colors hover:border-gray-300 focus:border-[var(--primary)] focus:outline-none"
			>
				{facilities.map((f) => (
					<option key={f.facilityId} value={f.facilityId}>
						{f.facilityName}
					</option>
				))}
			</select>
			<Building2
				size={14}
				className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
			/>
			<ChevronDown
				size={14}
				className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
			/>
		</div>
	);
}
