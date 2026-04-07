import ProductsClient from "~/app/(app)/products/ProductsClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function AdminProductsPage() {
	return (
		<OnboardedGuard>
			<ProductsClient />
		</OnboardedGuard>
	);
}
