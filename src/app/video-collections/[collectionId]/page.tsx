import VideoCollectionDisplay from "~/app/_components/client/authed/VideoCollectionDisplay";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";
import { VideoCollectionGuard } from "~/app/_components/server/VideoCollectionGuard";

interface VideoCollectionDetailPageProps {
	params: Promise<{
		collectionId: string;
	}>;
}

export default async function VideoCollectionDetailPage({
	params,
}: VideoCollectionDetailPageProps) {
	// Get the collection ID from the URL
	const { collectionId } = await params;

	const user = await getOnboardedUserOrRedirect();
	const userType = user.userType;

	return (
		<>
			{/* Server-side guard to check permissions */}
			<VideoCollectionGuard collectionId={collectionId} user={user} />

			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-5xl">
					<VideoCollectionDisplay
						collectionId={collectionId}
						userType={userType}
					/>
				</div>
			</div>
		</>
	);
}
