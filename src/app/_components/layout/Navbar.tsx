"use client";

import AnimatedLogo from "@/app/_components/ui/AnimatedLogo";
import { Button } from "@/app/_components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

export function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with actual auth

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	return (
		<header
			className={cn(
				"fixed top-0 right-0 left-0 z-50 py-4 transition-all duration-300 ease-in-out",
				isScrolled
					? "bg-white/80 shadow-sm backdrop-blur-md dark:bg-gray-900/80"
					: "bg-transparent",
			)}
		>
			<div className="container mx-auto px-4 md:px-6">
				<div className="flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center space-x-2"
						onClick={closeMenu}
					>
						<AnimatedLogo />
						<span className="font-bold font-display text-xl">
							ShuttleMentor
						</span>
					</Link>

					{/* Desktop navigation */}
					<nav className="hidden items-center space-x-1 md:flex">
						<Link
							href="/coaches"
							className="rounded-lg px-4 py-2 font-medium text-sm transition-colors hover:bg-accent"
						>
							Find Coaches
						</Link>
						<div className="group relative">
							<button className="flex items-center rounded-lg px-4 py-2 font-medium text-sm transition-colors hover:bg-accent">
								How It Works{" "}
								<ChevronDown
									size={16}
									className="ml-1 transition-transform group-hover:rotate-180"
								/>
							</button>
							<div className="invisible absolute left-0 z-10 mt-2 w-48 origin-top-left transform overflow-hidden rounded-lg bg-white opacity-0 shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-gray-800">
								<Link
									href="/for-students"
									className="block px-4 py-2 text-sm transition-colors hover:bg-accent dark:hover:bg-gray-700"
								>
									For Students
								</Link>
								<Link
									href="/for-coaches"
									className="block px-4 py-2 text-sm transition-colors hover:bg-accent dark:hover:bg-gray-700"
								>
									For Coaches
								</Link>
							</div>
						</div>
						<Link
							href="/pricing"
							className="rounded-lg px-4 py-2 font-medium text-sm transition-colors hover:bg-accent"
						>
							Pricing
						</Link>
					</nav>

					<div className="hidden items-center space-x-4 md:flex">
						{isLoggedIn ? (
							<Link href="/dashboard">
								<Button variant="ghost" className="rounded-lg">
									Dashboard
								</Button>
							</Link>
						) : (
							<>
								<Link href="/login">
									<Button variant="ghost" className="rounded-lg">
										Log in
									</Button>
								</Link>
								<Link href="/signup">
									<Button variant="default" className="rounded-lg">
										Sign up
									</Button>
								</Link>
							</>
						)}
					</div>

					{/* Mobile menu button */}
					<button
						onClick={toggleMenu}
						className="rounded-lg p-2 transition-colors hover:bg-accent md:hidden"
						aria-label="Toggle menu"
					>
						{isOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{/* Mobile navigation */}
				{isOpen && (
					<div className="mt-2 animate-slide-down py-4 md:hidden">
						<nav className="flex flex-col space-y-1">
							<Link
								href="/coaches"
								className="rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-accent"
								onClick={closeMenu}
							>
								Find Coaches
							</Link>

							<div className="space-y-1 px-4 py-3">
								<div className="font-medium text-sm">How It Works</div>
								<Link
									href="/for-students"
									className="block rounded-lg py-2 pl-4 text-sm transition-colors hover:bg-accent"
									onClick={closeMenu}
								>
									For Students
								</Link>
								<Link
									href="/for-coaches"
									className="block rounded-lg py-2 pl-4 text-sm transition-colors hover:bg-accent"
									onClick={closeMenu}
								>
									For Coaches
								</Link>
							</div>

							<Link
								href="/pricing"
								className="rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-accent"
								onClick={closeMenu}
							>
								Pricing
							</Link>

							<div className="mt-2 border-gray-200 border-t pt-2 dark:border-gray-700">
								{isLoggedIn ? (
									<Link
										href="/dashboard"
										className="block rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-accent"
										onClick={closeMenu}
									>
										Dashboard
									</Link>
								) : (
									<>
										<Link
											href="/login"
											className="block rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-accent"
											onClick={closeMenu}
										>
											Log in
										</Link>
										<Link
											href="/signup"
											className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
											onClick={closeMenu}
										>
											Sign up
										</Link>
									</>
								)}
							</div>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}

export default Navbar;
