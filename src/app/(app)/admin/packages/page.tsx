import PackagePlansClient from "~/app/(app)/admin/packages/PackagePlansClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function PackagePlansPage() {
	return (
		<OnboardedGuard>
			<PackagePlansClient />
		</OnboardedGuard>
	);
}
