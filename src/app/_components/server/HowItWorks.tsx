import { ArrowRight } from "lucide-react";
import React from "react";

export function HowItWorks() {
	const steps = [
		{
			number: "01",
			title: "Set Up Your Facility",
			description:
				"Add your courts, rooms, and resources. Configure business hours and staff permissions.",
			color: "indigo",
		},
		{
			number: "02",
			title: "Create Your Schedule",
			description:
				"Build classes, drop-in sessions, and rental windows on the calendar.",
			color: "blue",
		},
		{
			number: "03",
			title: "Members Check In",
			description:
				"Members scan a QR code or staff looks them up. Credits deduct automatically.",
			color: "indigo",
		},
		{
			number: "04",
			title: "Track Everything",
			description:
				"Attendance, revenue, packages, and memberships — all in one dashboard.",
			color: "blue",
		},
	];

	return (
		<section id="how-it-works" className="bg-gray-50 py-20">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="section-heading animate-slide-up">
						How Facility Presence Works
					</h2>
					<p
						className="section-subheading animate-slide-up"
						style={{ animationDelay: "0.1s" }}
					>
						Get your facility up and running in four simple steps.
					</p>
				</div>

				<div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{/* Connection line for desktop */}
					<div className="-translate-y-1/2 absolute top-1/2 right-0 left-0 z-0 hidden h-0.5 bg-gray-200 lg:block" />

					{steps.map((step, index) => (
						<div
							key={index}
							className="relative z-10 animate-slide-up"
							style={{ animationDelay: `${0.1 + index * 0.1}s` }}
						>
							<div className="glass-card flex h-full flex-col rounded-xl p-6 transition-all hover:shadow-lg">
								<div
									className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${
										step.color === "indigo"
											? "bg-indigo-100 text-indigo-600"
											: "bg-blue-100 text-blue-600"
									}`}
								>
									{step.number}
								</div>
								<h3 className="mb-2 font-bold text-xl">{step.title}</h3>
								<p className="text-gray-600 text-sm">{step.description}</p>

								{index < steps.length - 1 && (
									<div className="-right-4 -translate-y-1/2 absolute top-1/2 z-20 hidden lg:flex">
										<div className="rounded-full border border-gray-200 bg-white p-1">
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
