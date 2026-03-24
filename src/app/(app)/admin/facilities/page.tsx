import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import FacilityManagerClient from "./FacilityManagerClient";

export default async function FacilityManagerPage() {
	const user = await getOnboardedUserOrRedirect();

	if (user.userType !== UserType.FACILITY && user.userType !== UserType.ADMIN) {
		redirect("/admin");
	}

	return <FacilityManagerClient />;
}
