import { SignUpButton } from "@clerk/nextjs";
import {
	AlertTriangle,
	ArrowDownUp,
	BarChart3,
	Bell,
	Building,
	Building2,
	Calendar,
	CalendarCheck,
	CalendarDays,
	CheckCircle,
	ClipboardCheck,
	Clock,
	CreditCard,
	DoorOpen,
	Eye,
	Globe,
	Layers,
	LayoutDashboard,
	Mail,
	Monitor,
	MousePointerClick,
	Package,
	Plug,
	QrCode,
	Receipt,
	Repeat,
	ShieldCheck,
	ShoppingCart,
	Smartphone,
	UserCog,
	Wallet,
	Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "~/app/_components/shared/Button";

export const metadata: Metadata = {
	title: "Features | Facility Presence",
	description:
		"Explore all the features of Facility Presence — scheduling, check-in, packages, court rentals, billing, and more.",
};

interface Feature {
	icon: LucideIcon;
	title: string;
	description: string;
}

interface Category {
	name: string;
	features: Feature[];
}

const categories: Category[] = [
	{
		name: "Scheduling",
		features: [
			{
				icon: Calendar,
				title: "Calendar Management",
				description:
					"Classes, drop-ins, coaching slots on a visual calendar.",
			},
			{
				icon: Globe,
				title: "Public Calendar Embed",
				description: "Embed your schedule on your website.",
			},
			{
				icon: Repeat,
				title: "Recurring Events",
				description: "Set up weekly classes with one click.",
			},
			{
				icon: Layers,
				title: "Resource Management",
				description: "Courts, rooms, and equipment with business hours.",
			},
		],
	},
	{
		name: "Check-in",
		features: [
			{
				icon: QrCode,
				title: "Member Self-Check-in",
				description: "QR code scan on their phone.",
			},
			{
				icon: Monitor,
				title: "Front Desk Dashboard",
				description: "Staff lookup, barcode scanning, real-time feed.",
			},
			{
				icon: ClipboardCheck,
				title: "Attendance Tracking",
				description: "Know who showed up and when.",
			},
			{
				icon: DoorOpen,
				title: "General Facility Check-in",
				description: "Track walk-ins for open play.",
			},
		],
	},
	{
		name: "Packages & Credits",
		features: [
			{
				icon: Package,
				title: "Session Packages",
				description: "Sell 10-packs, monthly bundles, open play credits.",
			},
			{
				icon: Zap,
				title: "Automatic Credit Deduction",
				description:
					"Credits consumed at registration, no manual tracking.",
			},
			{
				icon: BarChart3,
				title: "Package Management",
				description:
					"Track active, depleted, and expired packages per member.",
			},
			{
				icon: ArrowDownUp,
				title: "FIFO Credit Usage",
				description: "Soonest-expiring packages used first.",
			},
		],
	},
	{
		name: "Court Rentals",
		features: [
			{
				icon: Clock,
				title: "Rental Windows",
				description: "Define when courts are available for booking.",
			},
			{
				icon: MousePointerClick,
				title: "Online Self-Booking",
				description: "Members pick court, time, and book instantly.",
			},
			{
				icon: ShieldCheck,
				title: "Conflict Prevention",
				description:
					"No double-bookings, automatic availability updates.",
			},
			{
				icon: CalendarCheck,
				title: "Calendar Integration",
				description: "Bookings appear on the admin calendar.",
			},
		],
	},
	{
		name: "Products & Billing",
		features: [
			{
				icon: ShoppingCart,
				title: "Product Catalog",
				description:
					"Hierarchical categories, SKU support, flexible pricing.",
			},
			{
				icon: Receipt,
				title: "Invoicing & Running Tabs",
				description: "Charges accumulate, members pay when ready.",
			},
			{
				icon: Wallet,
				title: "Partial Payments",
				description: "Accept deposits and split payments.",
			},
			{
				icon: Building,
				title: "Multi-Location Billing",
				description: "Track revenue across all your facilities.",
			},
		],
	},
	{
		name: "Multi-Location Management",
		features: [
			{
				icon: Building2,
				title: "Multiple Facilities",
				description:
					"Manage courts, rooms, and resources across locations.",
			},
			{
				icon: CalendarDays,
				title: "Per-Facility Calendars",
				description:
					"Each location has its own schedule and resources.",
			},
			{
				icon: LayoutDashboard,
				title: "Centralized Admin",
				description: "One dashboard to oversee all locations.",
			},
			{
				icon: UserCog,
				title: "Staff Permissions",
				description:
					"Control who can access what at each facility.",
			},
		],
	},
	{
		name: "Payments",
		features: [
			{
				icon: CreditCard,
				title: "Stripe Online Payments",
				description:
					"Members pay invoices online via embedded checkout.",
			},
			{
				icon: Smartphone,
				title: "Square POS Integration",
				description:
					"Sync in-person transactions to member accounts.",
			},
			{
				icon: Eye,
				title: "Unified Payment Tracking",
				description: "Online and in-person payments in one view.",
			},
			{
				icon: Plug,
				title: "Platform-Ready",
				description:
					"Built on Stripe Connect for seamless club payouts.",
			},
		],
	},
	{
		name: "Email Notifications",
		features: [
			{
				icon: Bell,
				title: "Schedule Change Alerts",
				description:
					"Members notified automatically when classes change or cancel.",
			},
			{
				icon: CheckCircle,
				title: "Registration Confirmations",
				description:
					"Instant email when members register for events.",
			},
			{
				icon: AlertTriangle,
				title: "Low-Credit Warnings",
				description:
					"Alert members when their package credits are running low.",
			},
			{
				icon: Mail,
				title: "Invoice & Payment Emails",
				description: "PDF invoice attachments and payment receipts.",
			},
		],
	},
];

export default function FeaturesPage() {
	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<section className="bg-white py-20">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="section-heading mb-6 animate-slide-up text-4xl md:text-5xl">
							Everything You Need to Run Your Facility
						</h1>
						<p
							className="section-subheading animate-slide-up"
							style={{ animationDelay: "0.1s" }}
						>
							Scheduling, check-in, packages, court rentals, billing, payments,
							and email notifications — all in one platform built for sports and
							recreation facilities.
						</p>
					</div>
				</div>
			</section>

			{/* Category Sections */}
			{categories.map((category, catIndex) => (
				<section
					key={category.name}
					className={catIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
				>
					<div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
						<h2
							className="section-heading mb-10 animate-slide-up text-center"
							style={{ animationDelay: "0.05s" }}
						>
							{category.name}
						</h2>
						<div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
							{category.features.map((feature, featureIndex) => {
								const Icon = feature.icon;
								return (
									<div
										key={feature.title}
										className="glass-card flex animate-slide-up flex-col rounded-xl p-6 transition-all hover:shadow-xl"
										style={{
											animationDelay: `${0.1 + featureIndex * 0.05}s`,
										}}
									>
										<div className="mb-4 inline-flex items-center justify-center rounded-lg bg-gray-100 p-3">
											<Icon className="h-6 w-6 text-indigo-500" />
										</div>
										<h3 className="mb-2 font-bold text-xl">
											{feature.title}
										</h3>
										<p className="text-gray-600 text-sm">
											{feature.description}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			))}

			{/* CTA Section */}
			<section className="py-20">
				<div className="container mx-auto px-4">
					<div className="glass-panel mx-auto max-w-4xl rounded-2xl p-8 text-center md:p-16">
						<h2 className="section-heading mb-6 animate-slide-up">
							Ready to Get Started?
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
							<SignUpButton>
								<Button className="border-2 border-indigo-600 bg-white px-10 py-6 font-bold text-indigo-600 text-xl transition-all duration-300 hover:scale-105 hover:bg-gray-200 md:px-20 md:py-8 md:text-2xl">
									Sign Up
								</Button>
							</SignUpButton>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
