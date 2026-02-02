"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "~/trpc/react";

export function AuthContent() {
	const { isSignedIn, userId } = useAuth();
	const { data: posts } = api.post.getMyPosts.useQuery();

	return (
		<div className="flex flex-col items-center gap-4">
			{isSignedIn ? (
				<div className="flex flex-col items-center gap-2">
					<h2 className="text-2xl font-bold">Protected Posts</h2>
					<div className="flex flex-col gap-2">
						{posts?.map((post) => (
							<div key={post.id} className="text-lg">
								• {post.name}
							</div>
						))}
					</div>
				</div>
			) : (
				<p className="text-lg text-white">
					You need to be signed in to view protected posts
				</p>
			)}
		</div>
	);
}
