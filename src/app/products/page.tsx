import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import ProductsClient from "~/app/products/ProductsClient";

export default function ProductsPage() {
	return (
		<OnboardedGuard>
			<ProductsClient />
		</OnboardedGuard>
	);
}
