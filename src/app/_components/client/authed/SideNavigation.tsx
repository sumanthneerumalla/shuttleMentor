"use client";

import { UserType } from "@prisma/client";
// we should be using lucide-react icons instead of custom svg icons
import {
	Calendar,
	ChevronDown,
	ShoppingCart,
	Users,
	Video,
	User,
	LayoutDashboard,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "~/app/_components/shared/ui/sidebar";

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

const ALL_TYPES: UserType[] = [
	UserType.STUDENT,
	UserType.COACH,
	UserType.FACILITY,
	UserType.ADMIN,
];

export const navItems: NavItem[] = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: <LayoutDashboard size={20} />,
		userTypes: ALL_TYPES,
	},
	{
		label: "Calendar",
		href: "/calendar",
		icon: <Calendar size={20} />,
		userTypes: ALL_TYPES,
	},
	{
		label: "Products",
		href: "/products",
		icon: <ShoppingCart size={20} />,
		userTypes: [UserType.FACILITY, UserType.ADMIN],
	},
	{
		label: "Video Collections",
		icon: <Video size={20} />,
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
		icon: <Users size={20} />,
		userTypes: ALL_TYPES,
	},
	{
		label: "Profile",
		href: "/profile",
		icon: <User size={20} />,
		userTypes: ALL_TYPES,
	},
	{
		label: "Admin",
		icon: <Settings size={20} />,
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

function filterByUserType(items: NavItem[], userType: UserType): NavItem[] {
	return items.filter((item) => item.userTypes.includes(userType));
}

export default function SideNavigation({
	user,
	isLoading,
}: SideNavigationProps) {
	const pathname = usePathname();
	const { isMobile, setOpenMobile } = useSidebar();
	const handleLeafClick = isMobile ? () => setOpenMobile(false) : undefined;

	return (
		<Sidebar className="h-full border-r border-gray-200">
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						{isLoading ? (
							<div className="animate-pulse space-y-2 p-4">
								<div className="h-9 rounded bg-gray-200" />
								<div className="h-9 rounded bg-gray-200" />
								<div className="h-9 rounded bg-gray-200" />
							</div>
						) : user ? (
							<SidebarMenu>
								{filterByUserType(navItems, user.userType).map((item) => {
									const hasChildren = item.children && item.children.length > 0;
									const filteredChildren = hasChildren && item.children
										? filterByUserType(item.children, user.userType)
										: [];

									if (hasChildren && filteredChildren.length === 0) {
										return null;
									}

									if (hasChildren) {
										const isAnyChildActive = filteredChildren.some(
											(c) => c.href && pathname === c.href,
										);
										return (
											<Collapsible
												key={item.label}
												defaultOpen={isAnyChildActive}
												className="group/collapsible"
											>
												<SidebarMenuItem>
													<CollapsibleTrigger asChild>
														<SidebarMenuButton>
															{item.icon}
															<span>{item.label}</span>
															<ChevronDown
																size={16}
																className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
															/>
														</SidebarMenuButton>
													</CollapsibleTrigger>
													<CollapsibleContent>
														<SidebarMenuSub>
															{filteredChildren.map((child) => (
																<SidebarMenuSubItem key={child.label}>
																	<SidebarMenuSubButton
																		asChild
																		isActive={pathname === child.href}
																	>
																		<Link href={child.href ?? "#"} onClick={handleLeafClick}>
																			{child.label}
																		</Link>
																	</SidebarMenuSubButton>
																</SidebarMenuSubItem>
															))}
														</SidebarMenuSub>
													</CollapsibleContent>
												</SidebarMenuItem>
											</Collapsible>
										);
									}

									return (
										<SidebarMenuItem key={item.label}>
											<SidebarMenuButton
												asChild
												isActive={pathname === item.href}
											>
												<Link href={item.href ?? "#"} onClick={handleLeafClick}>
													{item.icon}
													<span>{item.label}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						) : (
							<p className="px-4 py-4 text-center text-gray-500 text-sm">
								Unable to load navigation
							</p>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
