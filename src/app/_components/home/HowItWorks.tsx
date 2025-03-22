import { ArrowRight } from "lucide-react";
import React from "react";

export function HowItWorks() {
	const steps = [
		{
			number: "01",
			title: "Create Your Profile",
			description:
				"Sign up and create your profile, specifying whether you're a student looking for coaching or a coach offering services.",
			color: "shuttle",
		},
		{
			number: "02",
			title: "Upload Videos or Browse Coaches",
			description:
				"Students can upload gameplay videos and browse available coaches. Coaches can set up their profile, hourly rates, and availability.",
			color: "court",
		},
		{
			number: "03",
			title: "Book a Coaching Session",
			description:
				"Students can book 30-minute or longer sessions with coaches in their local timezone. Coaches can accept bookings that fit their schedule.",
			color: "shuttle",
		},
		{
			number: "04",
			title: "Attend Virtual Sessions",
			description:
				"Join live video coaching sessions where coaches provide feedback, analyze technique, and offer personalized guidance.",
			color: "court",
		},
	];

	return (
		<section className="bg-gray-50 py-20 dark:bg-gray-800/50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="section-heading animate-slide-up">
						How ShuttleCoach Works
					</h2>
					<p
						className="section-subheading animate-slide-up"
						style={{ animationDelay: "0.1s" }}
					>
						Our platform makes it easy to connect students with coaches through
						a simple, streamlined process designed for the best coaching
						experience.
					</p>
				</div>

				<div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					{/* Connection line */}
					<div className="-translate-y-1/2 absolute top-1/2 right-0 left-0 z-0 hidden h-0.5 bg-gray-200 lg:block dark:bg-gray-700" />

					{steps.map((step, index) => (
						<div
							key={index}
							className={`relative z-10 animate-slide-up`}
							style={{ animationDelay: `${0.1 + index * 0.1}s` }}
						>
							<div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
								<div
									className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-${step.color}-100 dark:bg-${step.color}-900/30 text-${step.color}-600 dark:text-${step.color}-400 mb-4 font-bold text-lg`}
								>
									{step.number}
								</div>
								<h3 className="mb-2 font-bold text-xl">{step.title}</h3>
								<p className="text-muted-foreground text-sm">
									{step.description}
								</p>

								{index < steps.length - 1 && (
									<div className="-right-4 -translate-y-1/2 absolute top-1/2 z-20 hidden lg:flex">
										<div className="rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
											<ArrowRight className="h-4 w-4 text-gray-400" />
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default HowItWorks;
