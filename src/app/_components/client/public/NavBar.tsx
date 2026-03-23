"use client";

import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
	useAuth,
} from "@clerk/nextjs";
import { BookOpen, Home } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedLogo from "~/app/_components/shared/AnimatedLogo";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "~/app/_components/shared/navigation-menu";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface NavBarProps {
	/** Optional club short name for redirect after auth */
	clubShortName?: string;
}

export function NavBar({ clubShortName }: NavBarProps) {
	// Build redirect URL with joinClub param if clubShortName is provided
	const redirectUrl = clubShortName
		? `/profile?joinClub=${encodeURIComponent(clubShortName)}`
		: undefined;
	const [isScrolled, setIsScrolled] = useState(false);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const router = useRouter();
	const pathname = usePathname();

	// Automatically create user profile in database after sign-in
	const { isSignedIn, isLoaded } = useAuth();
	const { data: user } = api.user.getOrCreateProfile.useQuery(undefined, {
		enabled: isLoaded && isSignedIn === true, // Only query when auth is loaded AND user is signed in
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes
		retry: false, // Don't retry if user is not authenticated
	});

	// Redirect to home page after login
	useEffect(() => {
		if (isLoaded && isSignedIn && user) {
			// Check if we're on the landing page
			const publicPaths = ["/"];
			const currentPath = window.location.pathname;
			if (publicPaths.includes(currentPath)) {
				router.push("/home");
			}
		}
	}, [isLoaded, isSignedIn, user, router]);

	// Scroll handler for header blur/shadow
	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const showPublicNav = !isLoaded || pathname === "/" || !isSignedIn;

	return (
		<header
			className={cn(
				"fixed top-0 right-0 left-0 z-50 transition-all duration-300",
				isScrolled
					? "bg-white/80 shadow-sm backdrop-blur-lg"
					: "bg-white/50 backdrop-blur-sm",
			)}
		>
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo Section */}
					<Link href="/" className="flex items-center space-x-2">
						<AnimatedLogo size="sm" />
						<span className="font-bold text-[var(--primary)] text-xl">
							ShuttleMentor
						</span>
					</Link>

					{/* Navigation */}
					<nav className="flex items-center space-x-4">
						{showPublicNav && mounted && (
							<NavigationMenu>
								<NavigationMenuList>
									{/* How It Works dropdown */}
									<NavigationMenuItem>
										<NavigationMenuTrigger>How It Works</NavigationMenuTrigger>
										<NavigationMenuContent>
											<ul className="w-48 p-2">
												<li>
													<NavigationMenuLink asChild>
														<Link href="/#how-it-works" className="dropdown-item block">
															How It Works
														</Link>
													</NavigationMenuLink>
												</li>
											</ul>
										</NavigationMenuContent>
									</NavigationMenuItem>

									{/* Resources dropdown */}
									<NavigationMenuItem>
										<NavigationMenuTrigger>
											<BookOpen size={16} className="mr-1" />
											Resources
										</NavigationMenuTrigger>
										<NavigationMenuContent>
											<ul className="w-48 p-2">
												<li>
													<NavigationMenuLink asChild>
														<Link href="/resources/getting-started" className="dropdown-item block">
															Getting Started
														</Link>
													</NavigationMenuLink>
												</li>
											</ul>
										</NavigationMenuContent>
									</NavigationMenuItem>
								</NavigationMenuList>
							</NavigationMenu>
						)}

						{/* Authenticated navigation */}
						<SignedIn>
							<Link href="/home" className="nav-link flex items-center">
								<Home size={16} className="mr-1" />
								Home
							</Link>
						</SignedIn>
					</nav>

					{/* Authentication */}
					<div className="flex items-center space-x-4">
						<SignedOut>
							<div className="nav-button">
								<SignInButton
									{...(redirectUrl && {
										forceRedirectUrl: redirectUrl,
										signUpForceRedirectUrl: redirectUrl,
									})}
								/>
							</div>
							<div className="nav-button">
								<SignUpButton
									{...(redirectUrl && {
										forceRedirectUrl: redirectUrl,
										signInForceRedirectUrl: redirectUrl,
									})}
								/>
							</div>
						</SignedOut>
						<SignedIn>
							<Link href="/profile" className="nav-link">
								My Profile
							</Link>
							<div className="nav-button">
								<UserButton />
							</div>
						</SignedIn>
					</div>
				</div>
			</div>
		</header>
	);
}

export default NavBar;
