import {
	Building2,
	Calendar,
	CreditCard,
	LayoutGrid,
	Mail,
	Package,
	QrCode,
	ShoppingCart,
} from "lucide-react";
import React from "react";

const features = [
	{
		icon: <Calendar className="h-6 w-6 text-indigo-500" />,
		title: "Scheduling & Calendar",
		description:
			"Create and manage classes, drop-ins, coaching slots, and recurring events. Embed your public calendar on your website.",
	},
	{
		icon: <QrCode className="h-6 w-6 text-indigo-500" />,
		title: "Member Check-in",
		description:
			"QR-based self-check-in for members. Front desk admin page with barcode scanning and real-time attendance feed.",
	},
	{
		icon: <Package className="h-6 w-6 text-indigo-500" />,
		title: "Packages & Credits",
		description:
			"Sell session packs and open-play credits. Automatic credit deduction on registration. Track remaining credits per member.",
	},
	{
		icon: <LayoutGrid className="h-6 w-6 text-indigo-500" />,
		title: "Court Rentals",
		description:
			"Bookable half-hour slots with configurable availability windows. Members self-book online. Automatic conflict prevention.",
	},
	{
		icon: <ShoppingCart className="h-6 w-6 text-indigo-500" />,
		title: "Products & Billing",
		description:
			"Product catalog with hierarchical categories. Invoice generation, running tabs, and partial payments.",
	},
	{
		icon: <Building2 className="h-6 w-6 text-indigo-500" />,
		title: "Multi-Location Management",
		description:
			"Manage multiple facilities under one account. Per-facility calendars, resources, check-in pages, and staff permissions. Centralized admin dashboard across all locations.",
	},
	{
		icon: <CreditCard className="h-6 w-6 text-indigo-500" />,
		title: "Payments",
		description:
			"Accept online payments via Stripe. Integrate with Square POS for in-person transactions. Unified payment tracking across channels.",
	},
	{
		icon: <Mail className="h-6 w-6 text-indigo-500" />,
		title: "Email Notifications",
		description:
			"Automated email for schedule changes, class cancellations, registration confirmations, low-credit warnings, and invoice reminders. PDF invoice attachments.",
	},
];

export function Features() {
	return (
		<section className="bg-white py-20">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="section-heading mb-6 animate-slide-up">
						Everything You Need to Run Your Facility
					</h2>
					<p
						className="section-subheading animate-slide-up"
						style={{ animationDelay: "0.1s" }}
					>
						Comprehensive tools for scheduling, member management, billing, and
						more — all in one platform.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
