import PackagePlanForm from "~/app/(app)/admin/packages/PackagePlanForm";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default async function EditPackagePlanPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<OnboardedGuard>
			<PackagePlanForm mode="edit" packagePlanId={id} />
		</OnboardedGuard>
	);
}
