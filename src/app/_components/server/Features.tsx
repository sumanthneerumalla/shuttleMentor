import {
	Calendar,
	Clock,
	CreditCard,
	MessageCircle,
	Star,
	Upload,
	Users,
	Video,
} from "lucide-react";
import React from "react";

const features = [
	{
		icon: <Upload className="h-6 w-6 text-indigo-500" />,
		title: "Hassle Free Video Recording and Upload",
		description:
			"Request your club to record your gameplay for you or upload your own gameplay videos securely and organize them into collections for coaches to review.",
	},
	// {
	//   icon: <Video className="h-6 w-6 text-indigo-500" />,
	//   title: "Live Coaching Sessions",
	//   description:
	//     "Schedule and join high-quality video calls with coaches for real-time instruction and feedback.",
	// },
	{
		icon: <Calendar className="h-6 w-6 text-indigo-500" />,
		title: "Flexible Scheduling",
		description:
			"Request coaching video whenever you want, even outside club operation hours.",
	},
	// {
	//   icon: <MessageCircle className="h-6 w-6 text-indigo-500" />,
	//   title: "Direct Messaging",
	//   description:
	//     "Chat directly with coaches to discuss your goals, skills, and arrange coaching sessions.",
	// },
	{
		icon: <Clock className="h-6 w-6 text-indigo-500" />,
		title: "Session Recordings",
		description:
			"All coaching sessions are recoreded upon request and available for you to review later at your convenience.",
	},
	{
		icon: <CreditCard className="h-6 w-6 text-indigo-500" />,
		title: "Secure Payments",
		description: "Pay the club/coaches directly.",
	},
	// {
	//   icon: <Users className="h-6 w-6 text-indigo-500" />,
	//   title: "Expert Coaches",
	//   description:
	//     "Connect with a diverse range of certified and experienced badminton coaches from around the world.",
	// },
	// {
	//   icon: <Star className="h-6 w-6 text-indigo-500" />,
	//   title: "Ratings & Reviews",
	//   description:
	//     "Leave feedback after sessions and choose coaches based on verified student reviews.",
	// },
];

export function Features() {
	return (
		<section className="bg-white py-20">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="section-heading mb-6 animate-slide-up">
						Everything You Need to Improve Your Game
					</h2>
					<p
						className="section-subheading animate-slide-up"
						style={{ animationDelay: "0.1s" }}
					>
						Our platform offers comprehensive tools for badminton players to
						connect with coaches, get personalized feedback, and track
						improvement over time.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					{features.map((feature, index) => (
						<div
							key={index}
							className="glass-card flex animate-slide-up flex-col rounded-xl p-6 transition-all hover:shadow-xl"
							style={{ animationDelay: `${0.1 + index * 0.05}s` }}
						>
							<div className="mb-4 inline-flex items-center justify-center rounded-lg bg-gray-100 p-3">
								{feature.icon}
							</div>
							<h3 className="mb-2 font-bold text-xl">{feature.title}</h3>
							<p className="text-gray-600 text-sm">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Features;
