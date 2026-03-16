import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import DashboardClient from "~/app/(app)/dashboard/DashboardClient";

export default function DashboardPage() {
	return (
		<OnboardedGuard>
			<DashboardClient />
		</OnboardedGuard>
	);
}
