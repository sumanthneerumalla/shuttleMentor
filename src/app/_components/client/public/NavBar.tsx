"use client";

import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
	useAuth,
} from "@clerk/nextjs";
import { BookOpen, ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedLogo from "~/app/_components/shared/AnimatedLogo";
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
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	// Automatically create user profile in database after sign-in
	const { isSignedIn, isLoaded } = useAuth();
	const { data: user } = api.user.getOrCreateProfile.useQuery(undefined, {
		enabled: isLoaded && !!isSignedIn, // Only query when auth is loaded AND user is signed in
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

	// Add scroll handler
	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Add click outside handler
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isDropdownOpen &&
				!(event.target as Element).closest(".dropdown-container")
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isDropdownOpen]);

	// Add hover handler
	const handleHover = (hover: boolean) => {
		setIsDropdownOpen(hover);
	};

	// Track if we're hovering over the dropdown
	const [isHovering, setIsHovering] = useState(false);
	const [isResourcesHovering, setIsResourcesHovering] = useState(false);

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
						{/* Public navigation - show on landing page for all users, hide on other pages when signed in */}
						{pathname === "/" || !isSignedIn ? (
							<>
								{/* <Link 
                  href="/coaches" 
                  className="nav-link"
                >
                  Find Coaches
                </Link> */}

								<div className="group relative">
									<button
										onMouseDown={(e) => {
											e.preventDefault();
											// Toggle dropdown and reset hover state
											setIsDropdownOpen(!isDropdownOpen);
											setIsHovering(false);
										}}
										onMouseEnter={() => setIsHovering(true)}
										onMouseLeave={() => setIsHovering(false)}
										className="nav-link flex items-center"
									>
										<span>How It Works</span>
										<ChevronDown
											className={cn(
												"ml-1.5 inline-flex h-4 w-4 transition-transform",
												(isDropdownOpen || isHovering) && "rotate-180",
											)}
										/>
									</button>
									{
										<div
											className="dropdown-container"
											onMouseEnter={() => setIsHovering(true)}
											onMouseLeave={() => setIsHovering(false)}
										>
											<div
												className={
													isDropdownOpen || isHovering
														? "nav-dropdown visible opacity-100"
														: "nav-dropdown invisible opacity-0"
												}
											>
												<Link
													href="/#how-it-works"
													className="dropdown-item"
													onClick={() => {
														setIsDropdownOpen(false);
														setIsHovering(false);
													}}
												>
													How It Works
												</Link>
											</div>
										</div>
									}
								</div>

								{/* Resources Dropdown */}
								<div className="group relative">
									<button
										onMouseDown={(e) => {
											e.preventDefault();
											setIsResourcesDropdownOpen(!isResourcesDropdownOpen);
											setIsResourcesHovering(false);
										}}
										onMouseEnter={() => setIsResourcesHovering(true)}
										onMouseLeave={() => setIsResourcesHovering(false)}
										className="nav-link flex items-center"
									>
										<BookOpen size={16} className="mr-1" />
										<span>Resources</span>
										<ChevronDown
											className={cn(
												"ml-1.5 inline-flex h-4 w-4 transition-transform",
												(isResourcesDropdownOpen || isResourcesHovering) &&
													"rotate-180",
											)}
										/>
									</button>
									<div
										className="dropdown-container"
										onMouseEnter={() => setIsResourcesHovering(true)}
										onMouseLeave={() => setIsResourcesHovering(false)}
									>
										<div
											className={
												isResourcesDropdownOpen || isResourcesHovering
													? "nav-dropdown visible opacity-100"
													: "nav-dropdown invisible opacity-0"
											}
										>
											<Link
												href="/resources/getting-started"
												className="dropdown-item"
												onClick={() => {
													setIsResourcesDropdownOpen(false);
													setIsResourcesHovering(false);
												}}
											>
												Getting Started
											</Link>
										</div>
									</div>
								</div>
							</>
						) : null}

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
