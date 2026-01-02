import UnauthorizedAccess from "~/app/_components/shared/UnauthorizedAccess";

export default function UnauthorizedVideoCollectionPage() {
  return (
    <UnauthorizedAccess
      title="Collection Access Denied"
      message="You are not authorized to view this video collection. Only the collection owner and assigned coaches can access this content."
      backUrl="/video-collections"
      backLabel="Back to Collections"
    />
  );
}