'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export function NavBar() {
  return (
    <header className="flex h-16 items-center justify-end gap-4 p-4">
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
