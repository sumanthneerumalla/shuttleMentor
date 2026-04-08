"use client";

import { SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs";
import { CheckCircle } from "lucide-react";
import React from "react";
import { Button } from "~/app/_components/shared/Button";

interface HeroProps {
	/** Optional club short name for redirect after auth */
	clubShortName?: string;
}

export function Hero({ clubShortName }: HeroProps) {
	// Build redirect URL with joinClub param if clubShortName is provided
	const redirectUrl = clubShortName
		? `/profile?joinClub=${encodeURIComponent(clubShortName)}`
		: undefined;

	return (
		<div className="relative overflow-hidden pt-20 pb-20 md:pt-24 md:pb-24">
			{/* Background decorative elements */}
			<div className="absolute inset-0 z-0">
				<div className="-left-10 absolute top-1/4 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
				<div className="absolute right-0 bottom-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
			</div>

			<div className="container relative z-10 mx-auto px-4">
				<div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-20">
					<div className="max-w-2xl flex-1 text-center lg:text-left">
						<h1 className="animate-slide-up font-bold font-display text-4xl tracking-tight md:text-5xl lg:text-6xl">
							Manage Your Facility. Delight Your Members.
						</h1>

						<p
							className="mt-6 animate-slide-up text-gray-600 text-xl"
							style={{ animationDelay: "0.1s" }}
						>
							All-in-one platform for scheduling, check-in, packages, court
							rentals, and billing — built for sports and recreation facilities.
						</p>

						<div
							className="mt-8 grid animate-slide-up grid-cols-1 gap-4 md:grid-cols-3"
							style={{ animationDelay: "0.3s" }}
						>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">Member Check-in</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">
									Packages &amp; Credits
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">Court Rentals</span>
							</div>
						</div>
					</div>

					<div className="mx-auto w-full max-w-md flex-1 animate-slide-in-right lg:mx-0 lg:max-w-lg">
						<SignedOut>
							<div className="mt-12 flex flex-col gap-6">
								<SignInButton
									{...(redirectUrl && {
										forceRedirectUrl: redirectUrl,
										signUpForceRedirectUrl: redirectUrl,
									})}
								>
									<Button className="w-full border-2 border-indigo-600 bg-white px-12 py-6 font-bold text-indigo-600 text-xl transition-all duration-300 hover:scale-105 hover:bg-gray-50">
										Sign In
									</Button>
								</SignInButton>

								<SignUpButton
									{...(redirectUrl && {
										forceRedirectUrl: redirectUrl,
										signInForceRedirectUrl: redirectUrl,
									})}
								>
									<Button className="w-full border-2 border-indigo-600 bg-white px-12 py-6 font-bold text-indigo-600 text-xl transition-all duration-300 hover:scale-105 hover:bg-gray-50">
										Sign Up
									</Button>
								</SignUpButton>
							</div>
						</SignedOut>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Hero;
