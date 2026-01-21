"use client";

import { useParams } from "next/navigation";
import CoachMediaCollectionDisplay from "~/app/_components/client/authed/CoachMediaCollectionDisplay";

export default function CoachMediaCollectionDetailPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;

  return <CoachMediaCollectionDisplay collectionId={collectionId} />;
}
