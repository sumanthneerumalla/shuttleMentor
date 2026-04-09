import PackagePlanForm from "~/app/(app)/admin/packages/PackagePlanForm";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function NewPackagePlanPage() {
	return (
		<OnboardedGuard>
			<PackagePlanForm mode="create" />
		</OnboardedGuard>
	);
}
