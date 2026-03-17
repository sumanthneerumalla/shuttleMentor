import { Suspense } from "react";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import { VideoCollectionsListing } from "~/app/_components/video-collections/VideoCollectionsListing";

export default async function VideoCollectionsPage() {
	const user = await getOnboardedUserOrRedirect();

	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center">
					Loading collections…
				</div>
			}
		>
			<VideoCollectionsListing
				userType={user.userType}
				userId={user.userId}
			/>
		</Suspense>
	);
}

