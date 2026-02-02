import HomeClient from "~/app/home/HomeClient";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function HomePage() {
	return (
		<OnboardedGuard>
			<HomeClient />
		</OnboardedGuard>
	);
}
