import { redirect } from "next/navigation";
import ResourceManagerClient from "~/app/(app)/calendar/resources/ResourceManagerClient";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import { isFacilityOrAbove } from "~/server/utils/utils";

export default async function ResourceManagerPage() {
	const user = await getOnboardedUserOrRedirect();

	if (!isFacilityOrAbove(user)) {
		redirect("/calendar");
	}

	return <ResourceManagerClient />;
}
