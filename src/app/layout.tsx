import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthedLayout from "~/app/_components/client/layouts/AuthedLayout";
import { Footer } from "~/app/_components/client/public/Footer";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Shuttlementor",
	description: "Level up your game with Shuttlementor",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className="font-sans antialiased">
				<ClerkProvider>
					<TRPCReactProvider>
						<main className="min-h-screen">
							<AuthedLayout>{children}</AuthedLayout>
						</main>
						<Footer />
					</TRPCReactProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
