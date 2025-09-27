import "~/styles/globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { Footer } from "~/app/_components/client/public/Footer";
import AuthedLayout from "~/app/_components/client/layouts/AuthedLayout";

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
            <main className="min-h-screen">
              <AuthedLayout>
                {children}
              </AuthedLayout>
            </main>
            <Footer />
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
