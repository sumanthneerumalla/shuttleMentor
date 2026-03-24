import { UserType } from "@prisma/client";
import {
	Building2,
	FileText,
	FileVideo,
	History,
	LayoutTemplate,
	Receipt,
	ReceiptText,
	Search,
	Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOnboardedUserOrRedirect } from "~/app/_components/server/OnboardedGuard";

const quickLinks = [
	{
		title: "All Collections",
		description: "View and manage all video collections across the club.",
		href: "/admin/collections",
		icon: FileVideo,
	},
	{
		title: "Users",
		description: "Manage club members, roles, and facility access.",
		href: "/admin/users",
		icon: Users,
	},
	{
		title: "Database",
		description: "Prisma Studio — browse and edit database records directly.",
		href: "/database",
		icon: Building2,
	},
];

function SectionCard({
	title,
	description,
	icon: Icon,
	id,
}: {
	title: string;
	description: string;
	icon: React.ComponentType<{ size?: number }>;
	id: string;
}) {
	return (
		<div
			id={id}
			className="scroll-mt-20 rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
		>
			<div className="mb-3 text-[var(--muted-foreground)]">
				<Icon size={24} />
			</div>
			<h3 className="mb-1 font-medium text-[var(--foreground)]">{title}</h3>
			<p className="text-sm text-[var(--muted-foreground)]">{description}</p>
			<p className="mt-3 text-xs italic text-[var(--muted-foreground)]">
				Coming soon
			</p>
		</div>
	);
}

export default async function AdminPage() {
	const user = await getOnboardedUserOrRedirect();

	if (user.userType !== UserType.FACILITY && user.userType !== UserType.ADMIN) {
		redirect("/dashboard");
	}

	return (
		<div className="p-6">
			<h1 className="mb-6 text-2xl font-semibold text-[var(--foreground)]">
				Admin
			</h1>

			{/* Quick Links */}
			<div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{quickLinks.map((card) => {
					const Icon = card.icon;
					return (
						<Link
							key={card.href}
							href={card.href}
							className="group rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-[var(--primary)] hover:shadow-sm"
						>
							<div className="mb-3 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary)]">
								<Icon size={24} />
							</div>
							<h2 className="mb-1 font-medium text-[var(--foreground)]">
								{card.title}
							</h2>
							<p className="text-sm text-[var(--muted-foreground)]">
								{card.description}
							</p>
						</Link>
					);
				})}
			</div>

			{/* Documents Section */}
			<section id="documents" className="mb-10 scroll-mt-20">
				<div className="mb-4 flex items-center gap-2">
					<FileText size={20} className="text-[var(--muted-foreground)]" />
					<h2 className="text-lg font-medium text-[var(--foreground)]">
						Documents
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<SectionCard
						id="document-history"
						title="Document History"
						description="View history and status of all documents."
						icon={History}
					/>
					<SectionCard
						id="document-templates"
						title="Document Templates"
						description="Create and edit templates used when generating documents."
						icon={LayoutTemplate}
					/>
				</div>
			</section>

			{/* Billing Section */}
			<section id="billing" className="mb-10 scroll-mt-20">
				<div className="mb-4 flex items-center gap-2">
					<Receipt size={20} className="text-[var(--muted-foreground)]" />
					<h2 className="text-lg font-medium text-[var(--foreground)]">
						Billing
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<SectionCard
						id="uninvoiced-user"
						title="Un-Invoiced Items: User"
						description="The list of uninvoiced items for the logged-in user."
						icon={ReceiptText}
					/>
					<SectionCard
						id="uninvoiced-location"
						title="Un-Invoiced Items: Location"
						description="The list of uninvoiced items for this location."
						icon={Receipt}
					/>
					<SectionCard
						id="review-post-billing"
						title="Review Post Billing"
						description="View, reprint, and email invoices for the last batch of post-billed packages."
						icon={Search}
					/>
				</div>
			</section>
		</div>
	);
}
