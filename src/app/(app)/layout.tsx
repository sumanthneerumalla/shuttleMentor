import { ClerkProvider } from "@clerk/nextjs";
import AuthedLayout from "~/app/_components/client/layouts/AuthedLayout";
import { Footer } from "~/app/_components/client/public/Footer";
import { TRPCReactProvider } from "~/trpc/react";

export default function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<ClerkProvider>
			<TRPCReactProvider>
				<main className="min-h-screen">
					<AuthedLayout>{children}</AuthedLayout>
				</main>
				<Footer />
			</TRPCReactProvider>
		</ClerkProvider>
	);
}
