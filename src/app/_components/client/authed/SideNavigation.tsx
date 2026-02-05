"use client";

import { UserType } from "@prisma/client";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "~/lib/utils";

interface SideNavigationProps {
	user: any;
	isLoading: boolean;
}

interface NavItem {
	label: string;
	href?: string;
	icon?: React.ReactNode;
	children?: NavItem[];
	userTypes: UserType[];
}

export default function SideNavigation({
	user,
	isLoading,
}: SideNavigationProps) {
	const pathname = usePathname();
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

	// Navigation items with user type restrictions
	const navItems: NavItem[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="3" y="3" width="7" height="9"></rect>
					<rect x="14" y="3" width="7" height="5"></rect>
					<rect x="14" y="12" width="7" height="9"></rect>
					<rect x="3" y="16" width="7" height="5"></rect>
				</svg>
			),
			userTypes: [
				UserType.STUDENT,
				UserType.COACH,
				UserType.FACILITY,
				UserType.ADMIN,
			],
		},
		{
			label: "Video Collections",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polygon points="23 7 16 12 23 17 23 7"></polygon>
					<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
				</svg>
			),
			children: [
				{
					label: "My Collections",
					href: "/video-collections",
					userTypes: [UserType.STUDENT, UserType.FACILITY, UserType.ADMIN],
				},
				{
					label: "Create New",
					href: "/video-collections/create",
					userTypes: [UserType.STUDENT, UserType.FACILITY, UserType.ADMIN],
				},
			],
			userTypes: [UserType.STUDENT, UserType.FACILITY, UserType.ADMIN],
		},
		{
			label: "Browse Coaches",
			href: "/coaches",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
					<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
			),
			userTypes: [
				UserType.STUDENT,
				UserType.COACH,
				UserType.FACILITY,
				UserType.ADMIN,
			],
		},
		{
			label: "Profile",
			href: "/profile",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
			),
			userTypes: [
				UserType.STUDENT,
				UserType.COACH,
				UserType.FACILITY,
				UserType.ADMIN,
			],
		},
		{
			label: "Admin",
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
					<path d="M12 6v4l3 3"></path>
				</svg>
			),
			children: [
				{
					label: "All Collections",
					href: "/admin/collections",
					userTypes: [UserType.ADMIN],
				},
				{
					label: "Users",
					href: "/admin/users",
					userTypes: [UserType.ADMIN],
				},
				{
					label: "Database",
					href: "/database",
					userTypes: [UserType.ADMIN],
				},
			],
			userTypes: [UserType.ADMIN],
		},
	];

	const toggleGroup = (label: string) => {
		setOpenGroups((prev) => ({
			...prev,
			[label]: !prev[label],
		}));
	};

	// Filter items based on user type
	const filterItemsByUserType = (items: NavItem[], userType?: UserType) => {
		if (!userType) return [];

		return items.filter((item) => item.userTypes.includes(userType));
	};

	const renderNavItems = (items: NavItem[], userType?: UserType) => {
		if (!items || !userType) return null;

		const filteredItems = filterItemsByUserType(items, userType);

		return filteredItems.map((item) => {
			const isActive = item.href ? pathname === item.href : false;
			const hasChildren = item.children && item.children.length > 0;
			const isOpen = openGroups[item.label] || false;

			// Filter children based on user type
			const filteredChildren =
				hasChildren && item.children
					? filterItemsByUserType(item.children, userType)
					: [];

			if (hasChildren && filteredChildren.length === 0) {
				return null; // Skip items with no visible children
			}

			return (
				<div key={item.label} className="mb-1">
					{item.href ? (
						<Link
							href={item.href}
							className={cn(
								"flex items-center rounded-lg px-4 py-2 text-sm transition-colors",
								isActive
									? "bg-[var(--accent)] font-medium text-[var(--accent-foreground)]"
									: "text-gray-700 hover:bg-[var(--accent)]",
							)}
						>
							{item.icon && <span className="mr-3">{item.icon}</span>}
							{item.label}
						</Link>
					) : (
						<button
							onClick={() => toggleGroup(item.label)}
							className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-[var(--accent)]"
						>
							<div className="flex items-center">
								{item.icon && <span className="mr-3">{item.icon}</span>}
								{item.label}
							</div>
							{hasChildren && (
								<span className="ml-auto">
									{isOpen ? (
										<ChevronDown size={16} />
									) : (
										<ChevronRight size={16} />
									)}
								</span>
							)}
						</button>
					)}

					{/* Render children if this item has them and is open */}
					{hasChildren && isOpen && (
						<div className="mt-1 ml-6 space-y-1 border-gray-100 border-l-2 pl-2">
							{filteredChildren.map((child) => {
								const isChildActive = child.href
									? pathname === child.href
									: false;

								return (
									<Link
										key={child.label}
										href={child.href || "#"}
										className={cn(
											"flex items-center rounded-lg px-4 py-2 text-sm transition-colors",
											isChildActive
												? "bg-[var(--accent)] font-medium text-[var(--accent-foreground)]"
												: "text-gray-700 hover:bg-[var(--accent)]",
										)}
									>
										{child.label}
									</Link>
								);
							})}
						</div>
					)}
				</div>
			);
		});
	};

	return (
		<div className="h-full overflow-y-auto border-gray-200 border-r p-4">
			{isLoading ? (
				<div className="animate-pulse space-y-2">
					<div className="h-10 rounded bg-gray-200"></div>
					<div className="h-10 rounded bg-gray-200"></div>
					<div className="h-10 rounded bg-gray-200"></div>
				</div>
			) : user ? (
				<nav className="space-y-1">
					{renderNavItems(navItems, user.userType)}
				</nav>
			) : (
				<div className="py-4 text-center text-gray-500 text-sm">
					Unable to load navigation
				</div>
			)}
		</div>
	);
}
