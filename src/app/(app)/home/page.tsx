import HomeClient from "~/app/(app)/home/HomeClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function HomePage() {
	return (
		<OnboardedGuard>
			<HomeClient />
		</OnboardedGuard>
	);
}
