import AdminCheckinClient from "~/app/(app)/admin/checkin/AdminCheckinClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function AdminCheckinPage() {
	return (
		<OnboardedGuard>
			<AdminCheckinClient />
		</OnboardedGuard>
	);
}
