"use client";

import AnimatedLogo from "~/app/_components/shared/AnimatedLogo";
import Link from "next/link";
import React from "react";

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

const FooterSection = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
  <div className="col-span-1">
    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">{title}</h3>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="text-sm hover:text-[var(--primary)]">
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
              <span className="text-lg font-bold">ShuttleMentor</span>
            </Link>
            <p className="text-sm text-gray-500">
              Connect with expert badminton coaches for personalized video coaching sessions.
            </p>
          </div>
          <FooterSection title="Platform" links={footerLinks.platform} />
          <FooterSection title="Company" links={footerLinks.company} />
          <FooterSection title="Legal" links={footerLinks.legal} />
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ShuttleMentor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;