import { Suspense } from "react";
import VideoCollectionForm from "~/app/_components/client/authed/VideoCollectionForm";
import { OnboardedGuard } from "~/app/_components/server/OnboardedGuard";

export default function CreateVideoCollectionPage() {
  return (
    <OnboardedGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <VideoCollectionForm />
          </Suspense>
        </div>
      </div>
    </OnboardedGuard>
  );
}
