"use client";

import { api } from "~/trpc/react";

export function HelloMessage() {
	const { data: hello } = api.post.hello.useQuery({ text: "from tRPC" });

	return (
		<p className="text-2xl text-white">
			{hello ? hello.greeting : "Loading tRPC query..."}
		</p>
	);
}
