import ProductsClient from "~/app/(app)/products/ProductsClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function ProductsPage() {
	return (
		<OnboardedGuard>
			<ProductsClient />
		</OnboardedGuard>
	);
}
