"use client";

import "@prisma/studio-core/ui/index.css";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";

const Studio = dynamic(
	() => import("@prisma/studio-core/ui").then((mod) => mod.Studio),
	{ ssr: false },
);

function StudioLoading() {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center">
				<div className="mx-auto h-12 w-12 animate-spin rounded-full border-[var(--primary)] border-b-2"></div>
				<p className="mt-4 text-gray-600">Loading Database Studio...</p>
			</div>
		</div>
	);
}

function ClientOnlyStudio() {
	const adapter = useMemo(() => {
		const executor = createStudioBFFClient({ url: "/api/studio" });
		return createPostgresAdapter({ executor });
	}, []);

	return <Studio adapter={adapter} />;
}

export default function DatabaseStudio() {
	return (
		<div className="h-[calc(100vh-64px)] w-full">
			<Suspense fallback={<StudioLoading />}>
				<ClientOnlyStudio />
			</Suspense>
		</div>
	);
}
