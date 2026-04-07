import CategoriesClient from "~/app/(app)/admin/products/categories/CategoriesClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function CategoriesPage() {
	return (
		<OnboardedGuard>
			<CategoriesClient />
		</OnboardedGuard>
	);
}
