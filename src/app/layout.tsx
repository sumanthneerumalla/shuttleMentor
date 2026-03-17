import "~/styles/globals.css";
import type { Metadata } from "next";

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
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
