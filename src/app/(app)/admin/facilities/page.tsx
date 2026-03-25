import { redirect } from "next/navigation";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import { isFacilityOrAbove } from "~/server/utils/utils";
import FacilityManagerClient from "./FacilityManagerClient";

export default async function FacilityManagerPage() {
	const user = await getOnboardedUserOrRedirect();

	if (!isFacilityOrAbove(user)) {
		redirect("/admin");
	}

	return <FacilityManagerClient />;
}
