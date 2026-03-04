import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";
import CalendarClient from "./CalendarClient";

export default function CalendarPage() {
	return (
		<OnboardedGuard>
			<CalendarClient />
		</OnboardedGuard>
	);
}