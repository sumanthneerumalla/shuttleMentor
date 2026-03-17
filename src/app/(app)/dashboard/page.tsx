import DashboardClient from "~/app/(app)/dashboard/DashboardClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function DashboardPage() {
	return (
		<OnboardedGuard>
			<DashboardClient />
		</OnboardedGuard>
	);
}
