import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import HomeClient from "~/app/(app)/home/HomeClient";

export default function HomePage() {
	return (
		<OnboardedGuard>
			<HomeClient />
		</OnboardedGuard>
	);
}
