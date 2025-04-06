import Link from "next/link";

import { LatestPost } from "~/app/_components/server/post";
import { HydrateClient } from "~/trpc/server";
import { AuthContent } from "~/app/_components/client/authed/AuthContent";
import { HelloMessage } from "~/app/_components/client/public/HelloMessage";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
            Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
          </h1>
          <HelloMessage />
          <AuthContent />
          <LatestPost />
        </div>
      </main>
    </HydrateClient>
  );
}
