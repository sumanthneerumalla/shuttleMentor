import { Button } from "@/app/_components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export function Hero() {
	return (
		<div className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
			{/* Background decorative elements */}
			<div className="absolute inset-0 z-0 opacity-20">
				<div className="-left-10 absolute top-1/4 h-60 w-60 rounded-full bg-shuttle-200 blur-3xl" />
				<div className="absolute right-0 bottom-1/3 h-80 w-80 rounded-full bg-shuttle-200 blur-3xl" />
			</div>

			<div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-6">
					<div className="max-w-xl flex-1 text-center lg:text-left">
						<div className="mb-6 inline-flex items-center rounded-full border border-shuttle-200 bg-shuttle-50 px-3 py-1 font-medium text-shuttle-800 text-sm">
							<span className="mr-1 animate-pulse-slow">•</span> Now accepting
							coaches and students
						</div>

						<h1 className="animate-slide-up font-bold font-display text-4xl leading-tight tracking-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight">
							Elevate Your Badminton Game with Expert Coaching
						</h1>

						<p
							className="mt-6 animate-slide-up text-muted-foreground text-xl"
							style={{ animationDelay: "0.1s" }}
						>
							Connect with professional badminton coaches for personalized video
							analysis and live coaching sessions. Upload your gameplay, get
							expert feedback, and improve faster.
						</p>

						<div
							className="mt-8 flex animate-slide-up flex-col justify-center gap-4 sm:flex-row lg:justify-start"
							style={{ animationDelay: "0.2s" }}
						>
							<Link href="/signup" passHref>
								<Button size="lg" className="w-full rounded-lg sm:w-auto">
									Get Started <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
							<Link href="/coaches" passHref>
								<Button
									size="lg"
									variant="outline"
									className="w-full rounded-lg sm:w-auto"
								>
									Browse Coaches
								</Button>
							</Link>
						</div>

						<div
							className="mt-8 grid animate-slide-up grid-cols-1 gap-3 md:grid-cols-3"
							style={{ animationDelay: "0.3s" }}
						>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-shuttle-500" />
								<span className="text-sm">Expert coaches</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-shuttle-500" />
								<span className="text-sm">Video analysis</span>
							</div>
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-5 w-5 text-shuttle-500" />
								<span className="text-sm">Live coaching</span>
							</div>
						</div>
					</div>

					<div className="mx-auto w-full max-w-md flex-1 animate-slide-in-right lg:mx-0 lg:max-w-lg">
						<div className="relative">
							<div className="-inset-1 absolute rounded-2xl bg-gradient-to-r from-shuttle-300 to-shuttle-500 opacity-30 blur-xl" />
							<div className="glass-panel relative z-10 overflow-hidden rounded-2xl">
								<video
									autoPlay
									muted
									loop
									className="aspect-video w-full rounded-tl-2xl rounded-tr-2xl object-cover"
									poster="https://images.unsplash.com/photo-1613922241048-9c5ce93d150e?q=80&w=1000&auto=format&fit=crop"
								>
									<source
										src="https://videos.pexels.com/videos/man-playing-badminton-in-an-arena-9252082"
										type="video/mp4"
									/>
									Your browser does not support the video tag.
								</video>

								<div className="p-5">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-bold text-lg">
												Live Session Coaching
											</h3>
											<p className="mt-1 text-muted-foreground text-sm">
												Real-time feedback and guidance
											</p>
										</div>
										<div className="text-right">
											<div className="font-bold text-shuttle-600">$45</div>
											<div className="text-muted-foreground text-xs">
												per session
											</div>
										</div>
									</div>

									<div className="mt-4 flex justify-between">
										<div className="inline-flex items-center rounded-full bg-shuttle-50 px-2.5 py-1 font-medium text-shuttle-700 text-xs">
											<span className="mr-1 h-2 w-2 rounded-full bg-shuttle-500" />{" "}
											Live sessions
										</div>
										<div className="inline-flex items-center rounded-full bg-shuttle-50 px-2.5 py-1 font-medium text-shuttle-700 text-xs">
											30 min sessions
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="relative mt-4">
							<div className="-inset-1 absolute rounded-2xl bg-gradient-to-r from-shuttle-300 to-shuttle-500 opacity-30 blur-xl" />
							<div className="glass-panel relative z-10 rounded-2xl p-5">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-bold text-lg">Video Analysis</h3>
										<p className="mt-1 text-muted-foreground text-sm">
											Detailed review of your gameplay
										</p>
									</div>
									<div className="text-right">
										<div className="font-bold text-shuttle-600">$30</div>
										<div className="text-muted-foreground text-xs">
											per video
										</div>
									</div>
								</div>

								<div className="mt-4 flex justify-between">
									<div className="inline-flex items-center rounded-full bg-shuttle-50 px-2.5 py-1 font-medium text-shuttle-700 text-xs">
										Personalized feedback
									</div>
									<div className="inline-flex items-center rounded-full bg-shuttle-50 px-2.5 py-1 font-medium text-shuttle-700 text-xs">
										24hr turnaround
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Hero;
