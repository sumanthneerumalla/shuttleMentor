import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Calendar, Star, Users } from "lucide-react";
import Link from "next/link";
import { Hero } from "~/app/_components/client/public/Hero";
import {
	FAQSection,
	coachFAQs,
	studentFAQs,
} from "~/app/_components/server/FAQ";
import { Features } from "~/app/_components/server/Features";
import { HowItWorks } from "~/app/_components/server/HowItWorks";
import { Button } from "~/app/_components/shared/Button";
import { HydrateClient } from "~/trpc/server";

interface HomePageProps {
	clubShortName?: string;
}

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

				{/* Testimonials Section */}
				<section className="py-20">
					<div className="container mx-auto px-4">
						<div className="mx-auto mb-16 max-w-3xl text-center">
							<h2 className="section-heading animate-slide-up">
								What Our Users Say
							</h2>
							<p
								className="section-subheading animate-slide-up"
								style={{ animationDelay: "0.1s" }}
							>
								Here's what students and coaches have to say about their
								experience with ShuttleMentor.
							</p>
						</div>

						<div className="grid grid-cols-3 gap-8">
							{[
								{
									name: "Sarah Chen",
									role: "Intermediate Player",
									image:
										"https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
									quote:
										"The video analysis from my coach completely transformed my backhand technique. In just three sessions, I saw a dramatic improvement in my game.",
								},
								{
									name: "Michael Wong",
									role: "Professional Coach",
									image:
										"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
									quote:
										"ShuttleMentor has helped me expand my coaching business beyond local players. The platform is intuitive and the scheduling tools are excellent.",
								},
								{
									name: "Aditya Patel",
									role: "Advanced Player",
									image:
										"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
									quote:
										"Having access to coaches from around the world has been incredible. My doubles strategy has improved dramatically thanks to specialized coaching.",
								},
							].map((testimonial, index) => (
								<div
									key={index}
									className="glass-card animate-slide-up rounded-xl p-6"
									style={{ animationDelay: `${0.1 + index * 0.1}s` }}
								>
									<div className="mb-4 flex items-center space-x-1 text-yellow-500">
										{[...Array(5)].map((_, i) => (
											<Star key={i} className="h-4 w-4 fill-yellow-500" />
										))}
									</div>
									<blockquote className="mb-6 text-lg">
										"{testimonial.quote}"
									</blockquote>
									<div className="flex items-center">
										<img
											src={testimonial.image}
											alt={testimonial.name}
											className="mr-4 h-12 w-12 rounded-full object-cover"
										/>
										<div>
											<div className="font-medium">{testimonial.name}</div>
											<div className="text-gray-600 text-sm">
												{testimonial.role}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* FAQ Sections */}
				{/* <FAQSection title="Student FAQs" faqs={studentFAQs} id="student-faq" /> */}

				{/* Stats Section */}
				<section className="bg-gray-50 py-16">
					<div className="container mx-auto px-4">
						<div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 text-center md:grid-cols-2">
							{[
								{
									label: "Coaching Sessions",
									value: "5,000+",
									icon: <Calendar className="mb-2 h-8 w-8 text-indigo-500" />,
								},
								{
									label: "Average Rating",
									value: "4.8/5",
									icon: (
										<Star className="mb-2 h-8 w-8 fill-indigo-500 text-indigo-500" />
									),
								},
							].map((stat, index) => (
								<div
									key={index}
									className="glass-card flex animate-slide-up flex-col items-center rounded-xl px-6 py-10"
									style={{ animationDelay: `${0.1 + index * 0.1}s` }}
								>
									{stat.icon}
									<div className="mb-1 font-bold text-3xl">{stat.value}</div>
									<div className="text-gray-600">{stat.label}</div>
								</div>
							))}
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
						<div className="glass-panel mx-auto max-w-4xl rounded-2xl p-16 text-center">
							<h2 className="section-heading mb-6 animate-slide-up">
								Ready to Transform Your Badminton Game?
							</h2>
							<p
								className="section-subheading mx-auto mb-8 animate-slide-up"
								style={{ animationDelay: "0.1s" }}
							>
								Join ShuttleMentor today and connect with expert coaches who can
								help you reach your full potential.
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
									<Button className="border-2 border-indigo-600 bg-white px-20 py-8 font-bold text-2xl text-indigo-600 transition-all duration-300 hover:scale-105 hover:bg-gray-200">
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
