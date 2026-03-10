import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import ResourceManagerClient from "~/app/calendar/resources/ResourceManagerClient";

export default async function ResourceManagerPage() {
	const user = await getOnboardedUserOrRedirect();

	if (
		user.userType !== UserType.FACILITY &&
		user.userType !== UserType.ADMIN
	) {
		redirect("/calendar");
	}

	return <ResourceManagerClient />;
}
