"use client";

import { Building2, Check } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/app/_components/shared/dialog";
import { api } from "~/trpc/react";

interface FacilitySwitcherModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function FacilitySwitcherModal({
	open,
	onOpenChange,
}: FacilitySwitcherModalProps) {
	const utils = api.useUtils();
	const { data: memberships, isLoading } =
		api.user.getFacilityMemberships.useQuery(undefined, { enabled: open });

	const switchFacility = api.user.switchFacility.useMutation({
		onSuccess: () => {
			void utils.user.getOrCreateProfile.invalidate();
			void utils.user.getFacilityMemberships.invalidate();
			void utils.calendar.getEvents.invalidate();
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Switch Facility</DialogTitle>
					<DialogDescription>
						Select a facility to view its calendar and resources.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-1 py-2">
					{isLoading && (
						<div className="animate-pulse space-y-2 px-2">
							<div className="h-10 rounded bg-gray-100" />
							<div className="h-10 rounded bg-gray-100" />
						</div>
					)}

					{memberships?.map((m) => (
						<button
							key={m.facilityId}
							onClick={() => {
								if (!m.isActive) {
									switchFacility.mutate({ facilityId: m.facilityId });
								}
							}}
							disabled={switchFacility.isPending}
							className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
								m.isActive
									? "bg-[var(--accent)] font-medium text-[var(--foreground)]"
									: "text-gray-700 hover:bg-[var(--accent)]"
							}`}
						>
							<Building2 size={16} className="shrink-0 text-[var(--muted-foreground)]" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{m.facilityName}</p>
								{m.location && (
									<p className="truncate text-xs text-[var(--muted-foreground)]">
										{m.location}
									</p>
								)}
								<p className="text-xs text-[var(--muted-foreground)]">
									{m.role.charAt(0) + m.role.slice(1).toLowerCase()}
								</p>
							</div>
							{m.isActive && (
								<Check size={16} className="shrink-0 text-[var(--primary)]" />
							)}
						</button>
					))}

					{!isLoading && memberships?.length === 0 && (
						<p className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
							No facilities available.
						</p>
					)}
				</div>

				{switchFacility.error && (
					<p className="px-3 text-xs text-red-500">
						{switchFacility.error.message}
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
