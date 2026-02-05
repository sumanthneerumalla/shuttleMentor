import type { User } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminUser } from "~/server/utils/utils";

export async function getAdminUserOrRedirect({
	unauthenticatedRedirectTo = "/",
	notOnboardedRedirectTo = "/profile",
	unauthorizedRedirectTo = "/dashboard",
}: {
	unauthenticatedRedirectTo?: string;
	notOnboardedRedirectTo?: string;
	unauthorizedRedirectTo?: string;
} = {}): Promise<User> {
	const result = await getAdminUser();

	if (!result.success) {
		if (result.error === "Unauthorized") {
			redirect(unauthenticatedRedirectTo);
		}
		if (result.error === "NotOnboarded") {
			redirect(notOnboardedRedirectTo);
		}
		redirect(unauthorizedRedirectTo);
	}

	return result.user;
}

export async function AdminGuard({
	children,
	unauthenticatedRedirectTo = "/",
	unauthorizedRedirectTo = "/dashboard",
}: {
	children: ReactNode;
	unauthenticatedRedirectTo?: string;
	unauthorizedRedirectTo?: string;
}) {
	await getAdminUserOrRedirect({
		unauthenticatedRedirectTo,
		unauthorizedRedirectTo,
	});

	return <>{children}</>;
}
