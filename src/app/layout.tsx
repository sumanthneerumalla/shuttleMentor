import "~/styles/globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { NavBar } from "~/app/_components/client/public/NavBar";
import { Footer } from "~/app/_components/client/public/Footer";

export const metadata: Metadata = {
  title: "Shuttlementor",
  description: "Level up your game with Shuttlementor",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <html lang="en">
          <body className="font-sans antialiased">
            <NavBar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
