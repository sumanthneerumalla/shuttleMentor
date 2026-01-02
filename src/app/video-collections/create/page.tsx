import { Suspense } from "react";
import VideoCollectionForm from "~/app/_components/client/authed/VideoCollectionForm";

export default function CreateVideoCollectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <VideoCollectionForm />
        </Suspense>
      </div>
    </div>
  );
}
