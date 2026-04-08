import { SignUpButton } from "@clerk/nextjs";
import { Hero } from "~/app/_components/client/public/Hero";
import { Features } from "~/app/_components/server/Features";
import { HowItWorks } from "~/app/_components/server/HowItWorks";
import { Button } from "~/app/_components/shared/Button";
import { HydrateClient } from "~/trpc/server";

interface HomePageProps {
	clubShortName?: string;
}

const modules = [
	"Scheduling",
	"Check-in",
	"Packages",
	"Court Rentals",
	"Products",
	"Billing",
	"Payments",
	"Email Notifications",
];

export function HomePage({ clubShortName }: HomePageProps) {
	// Build redirect URL for CTA section
	const ctaRedirectUrl = clubShortName
		? `/profile?joinClub=${encodeURIComponent(clubShortName)}`
		: undefined;
	return (
		<HydrateClient>
			<div className="flex flex-col">
				<Hero clubShortName={clubShortName} />
				<Features />
				<HowItWorks />

				{/* Modules Section */}
				<section className="bg-gray-50 py-16">
					<div className="container mx-auto px-4">
						<div className="mx-auto max-w-4xl text-center">
							<h2 className="section-heading mb-8 animate-slide-up">
								8+ Integrated Modules
							</h2>
							<div className="flex flex-wrap justify-center gap-3">
								{modules.map((mod, index) => (
									<span
										key={index}
										className="glass-card animate-slide-up rounded-full px-5 py-2 font-medium text-gray-700 text-sm"
										style={{ animationDelay: `${0.05 + index * 0.05}s` }}
									>
										{mod}
									</span>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Questions Section */}
				<section className="py-16">
					<div className="container mx-auto px-4">
						<div className="mx-auto max-w-3xl text-center">
							<h2 className="section-heading mb-6 animate-slide-up">
								Questions?
							</h2>
							<p
								className="section-subheading animate-slide-up"
								style={{ animationDelay: "0.1s" }}
							>
								Call us at +1(410)2456615
							</p>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-20">
					<div className="container mx-auto px-4">
						<div className="glass-panel mx-auto max-w-4xl rounded-2xl p-8 text-center md:p-16">
							<h2 className="section-heading mb-6 animate-slide-up">
								Ready to Transform Your Facility?
							</h2>
							<p
								className="section-subheading mx-auto mb-8 animate-slide-up"
								style={{ animationDelay: "0.1s" }}
							>
								Join Facility Presence and streamline your operations.
							</p>
							<div
								className="flex animate-slide-up justify-center"
								style={{ animationDelay: "0.2s" }}
							>
								<SignUpButton
									{...(ctaRedirectUrl && {
										forceRedirectUrl: ctaRedirectUrl,
										signInForceRedirectUrl: ctaRedirectUrl,
									})}
								>
									<Button className="border-2 border-indigo-600 bg-white px-10 py-6 font-bold text-indigo-600 text-xl transition-all duration-300 hover:scale-105 hover:bg-gray-200 md:px-20 md:py-8 md:text-2xl">
										Sign Up
									</Button>
								</SignUpButton>
							</div>
						</div>
					</div>
				</section>
			</div>
		</HydrateClient>
	);
}

export default function Home() {
	return <HomePage />;
}
