"use client";

import Link from "next/link";
import React from "react";
import AnimatedLogo from "~/app/_components/shared/AnimatedLogo";

const footerLinks = {
	platform: [
		{ href: "/coaches", label: "Find Coaches" },
		{ href: "/for-students", label: "For Students" },
		{ href: "/for-coaches", label: "For Coaches" },
		{ href: "/pricing", label: "Pricing" },
	],
	company: [
		{ href: "/about", label: "About Us" },
		{ href: "/blog", label: "Blog" },
		{ href: "/careers", label: "Careers" },
		{ href: "/contact", label: "Contact" },
	],
	legal: [
		{ href: "/terms", label: "Terms of Service" },
		{ href: "/privacy", label: "Privacy Policy" },
		{ href: "/cookies", label: "Cookie Policy" },
	],
};

const FooterSection = ({
	title,
	links,
}: { title: string; links: { href: string; label: string }[] }) => (
	<div className="col-span-1">
		<h3 className="mb-4 font-bold text-gray-500 text-sm uppercase tracking-wider">
			{title}
		</h3>
		<ul className="space-y-3">
			{links.map((link) => (
				<li key={link.href}>
					<Link
						href={link.href}
						className="text-sm hover:text-[var(--primary)]"
					>
						{link.label}
					</Link>
				</li>
			))}
		</ul>
	</div>
);

export function Footer() {
	return (
		<footer className="border-t bg-white">
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-4 gap-8">
					<div className="col-span-1">
						<Link href="/" className="mb-4 flex items-center space-x-2">
							<AnimatedLogo size="sm" />
							<span className="font-bold text-lg">ShuttleMentor</span>
						</Link>
						<p className="text-gray-500 text-sm">
							Connect with expert badminton coaches for personalized video
							coaching sessions.
						</p>
					</div>
					<FooterSection title="Platform" links={footerLinks.platform} />
					<FooterSection title="Company" links={footerLinks.company} />
					<FooterSection title="Legal" links={footerLinks.legal} />
				</div>

				<div className="mt-8 flex items-center justify-between border-t pt-8">
					<p className="text-gray-500 text-sm">
						&copy; {new Date().getFullYear()} ShuttleMentor. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
