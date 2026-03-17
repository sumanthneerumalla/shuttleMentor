import { Suspense } from "react";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import CalendarClient from "./CalendarClient";

export default function CalendarPage() {
	return (
		<OnboardedGuard>
			<Suspense
				fallback={
					<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
						<div className="animate-pulse space-y-4">
							<div className="h-8 w-48 rounded bg-gray-200" />
							<div className="h-96 w-full rounded bg-gray-200" />
						</div>
					</div>
				}
			>
				<CalendarClient />
			</Suspense>
		</OnboardedGuard>
	);
}
