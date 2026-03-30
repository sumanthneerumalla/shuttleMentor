"use client";

import { Building2, ChevronDown } from "lucide-react";
import { Select } from "~/app/_components/shared/ui/select";

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
			<span className="flex items-center gap-1.5 text-gray-500 text-sm">
				<Building2 size={14} />
				{facilities[0]!.facilityName}
			</span>
		);
	}

	return (
		<div className="relative">
			<Select
				value={selectedFacilityId ?? ""}
				onChange={(e) => onSelect(e.target.value)}
				className="appearance-none rounded-lg border-gray-200 bg-white py-2 pr-8 pl-8 text-gray-700 text-sm transition-colors hover:border-gray-300"
			>
				{facilities.map((f) => (
					<option key={f.facilityId} value={f.facilityId}>
						{f.facilityName}
					</option>
				))}
			</Select>
			<Building2
				size={14}
				className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 text-gray-400"
			/>
			<ChevronDown
				size={14}
				className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 text-gray-400"
			/>
		</div>
	);
}
