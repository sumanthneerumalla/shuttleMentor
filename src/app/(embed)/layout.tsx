import { TRPCReactProvider } from "~/trpc/react";

export default function EmbedLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<TRPCReactProvider>
			{children}
		</TRPCReactProvider>
	);
}
