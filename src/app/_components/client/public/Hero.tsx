"use client";

import { SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
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
							Record ᐧ Review ᐧ Rise
						</h1>

						<p
							className="mt-6 animate-slide-up text-gray-600 text-xl"
							style={{ animationDelay: "0.1s" }}
						>
							Hassle-free match recording and personalized video analysis to
							fast-track your progress.
						</p>

						<div
							className="mt-8 grid animate-slide-up grid-cols-1 gap-4 sm:grid-cols-3"
							style={{ animationDelay: "0.3s" }}
						>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">Expert coaches</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">Video analysis</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-indigo-500" />
								<span className="text-gray-600 text-sm">
									Hassle-Free Recording
								</span>
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

						{/* <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 to-indigo-500/50 opacity-30 blur-xl" />
              <div className="relative z-10 overflow-hidden rounded-2xl glass-card">
                <div className="relative">
                  <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium backdrop-blur-lg">
                    1:00
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1613922241048-9c5ce93d150e?q=80&w=1000&auto=format&fit=crop"
                    alt="Badminton coaching session"
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        Live Session Coaching
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Real-time feedback and guidance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

						{/* <div className="mt-6">
              <div className="relative overflow-hidden rounded-2xl glass-card">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        Video Analysis
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Detailed review of your gameplay
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">Personalized feedback</div>
                    <div className="text-sm text-gray-600">24hr turnaround</div>
                  </div>
                </div>
              </div>
            </div> */}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Hero;
