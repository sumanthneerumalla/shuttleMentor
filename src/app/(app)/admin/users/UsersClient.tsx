"use client";

import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Pencil,
	Search,
	UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import {
	ToastContainer,
	useToast,
} from "~/app/_components/shared/Toast";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/app/_components/shared/dialog";
import { assignableRoles, ROLE_HIERARCHY } from "~/lib/utils";
import { api, type RouterInputs } from "~/trpc/react";

type UserRole = RouterInputs["user"]["createUser"]["role"];

// ---------------------------------------------------------------------------
// Role badge colors
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
	STUDENT: "bg-gray-100 text-gray-700",
	COACH: "bg-blue-100 text-blue-700",
	FACILITY: "bg-green-100 text-green-700",
	CLUB_ADMIN: "bg-purple-100 text-purple-700",
	PLATFORM_ADMIN: "bg-red-100 text-red-700",
};

function RoleBadge({ role }: { role: string }) {
	return (
		<span
			className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"}`}
		>
			{role.replace("_", " ")}
		</span>
	);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClubUser = {
	userId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	userType: string;
	activeFacilityId: string | null;
	clubShortName: string;
	clubMemberships: {
		facilityId: string;
		role: string;
		facility: { facilityId: string; name: string };
	}[];
};

// ---------------------------------------------------------------------------
// Create User Modal
// ---------------------------------------------------------------------------

function CreateUserModal({
	open,
	onClose,
	callerType,
	toast,
}: {
	open: boolean;
	onClose: () => void;
	callerType: string;
	toast: (msg: string, variant: "success" | "error") => void;
}) {
	const utils = api.useUtils();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<UserRole>("STUDENT");
	const [facilityId, setFacilityId] = useState("");
	const [error, setError] = useState("");

	const { data: facilities } = api.calendar.getFacilities.useQuery();
	const roles = useMemo(() => assignableRoles(callerType), [callerType]);

	// Set default facility when facilities load
	useEffect(() => {
		if (facilities?.[0] && !facilityId) {
			setFacilityId(facilities[0].facilityId);
		}
	}, [facilities, facilityId]);

	const createMutation = api.user.createUser.useMutation({
		onSuccess: () => {
			void utils.user.listClubUsers.invalidate();
			toast("User created", "success");
			resetAndClose();
		},
		onError: (err) => setError(err.message),
	});

	function resetAndClose() {
		setFirstName("");
		setLastName("");
		setEmail("");
		setRole("STUDENT");
		setFacilityId(facilities?.[0]?.facilityId ?? "");
		setError("");
		onClose();
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create User</DialogTitle>
					<DialogDescription>
						Add a new member to your club. They'll receive an email to set their
						password.
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<div className="space-y-2">
						<label className="text-sm font-medium text-[var(--foreground)]">
							Name
						</label>
						<div className="grid grid-cols-2 gap-2">
							<Input
								placeholder="First name"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
							/>
							<Input
								placeholder="Last name"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-[var(--foreground)]">
							Email
						</label>
						<Input
							placeholder="email@example.com"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Role
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value as UserRole)}
								className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
							>
								{roles.map((r) => (
									<option key={r} value={r}>
										{r.replace("_", " ")}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-[var(--foreground)]">
								Facility
							</label>
							<select
								value={facilityId}
								onChange={(e) => setFacilityId(e.target.value)}
								className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
							>
								{facilities?.map((f) => (
									<option key={f.facilityId} value={f.facilityId}>
										{f.name}
									</option>
								))}
							</select>
						</div>
					</div>

					{error && (
						<p className="text-red-500 text-xs">{error}</p>
					)}
				</DialogBody>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={resetAndClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							setError("");
							createMutation.mutate({
								firstName,
								lastName,
								email,
								role,
								facilityId,
							});
						}}
						disabled={
							createMutation.isPending ||
							!firstName.trim() ||
							!lastName.trim() ||
							!email.trim() ||
							!facilityId
						}
					>
						{createMutation.isPending ? "Creating..." : "Create User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// Edit User Modal
// ---------------------------------------------------------------------------

function EditUserModal({
	user,
	onClose,
	callerType,
	toast,
}: {
	user: ClubUser | null;
	onClose: () => void;
	callerType: string;
	toast: (msg: string, variant: "success" | "error") => void;
}) {
	const utils = api.useUtils();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [error, setError] = useState("");

	const { data: facilities } = api.calendar.getFacilities.useQuery();
	const roles = useMemo(() => assignableRoles(callerType), [callerType]);
	// Derive canEdit from the user's highest role in this club (clubMemberships
	// is already club-scoped by the query), not user.userType which reflects
	// their active club context and may be a different club entirely.
	const canEdit = useMemo(() => {
		if (!user) return false;
		const highestRole = user.clubMemberships.reduce(
			(max, m) => Math.max(max, ROLE_HIERARCHY[m.role] ?? 0),
			0,
		);
		return (ROLE_HIERARCHY[callerType] ?? 0) > highestRole;
	}, [user, callerType]);

	// Populate fields when user changes
	useEffect(() => {
		if (user) {
			setFirstName(user.firstName ?? "");
			setLastName(user.lastName ?? "");
			setError("");
		}
	}, [user]);

	function invalidateAndRefresh() {
		void utils.user.listClubUsers.invalidate();
	}

	const updateProfileMutation = api.user.updateUserProfile.useMutation({
		onSuccess: () => {
			invalidateAndRefresh();
			toast("Profile updated", "success");
		},
		onError: (err) => setError(err.message),
	});

	const updateRoleMutation = api.user.updateUserRole.useMutation({
		onSuccess: () => {
			invalidateAndRefresh();
			toast("Role updated", "success");
		},
		onError: (err) => setError(err.message),
	});

	const addFacilityMutation = api.user.addUserToFacility.useMutation({
		onSuccess: () => {
			invalidateAndRefresh();
			toast("Added to facility", "success");
		},
		onError: (err) => setError(err.message),
	});

	const removeFacilityMutation = api.user.removeUserFromFacility.useMutation({
		onSuccess: () => {
			invalidateAndRefresh();
			toast("Removed from facility", "success");
		},
		onError: (err) => setError(err.message),
	});

	if (!user) return null;

	const membershipMap = new Map(
		user.clubMemberships.map((m) => [m.facilityId, m.role]),
	);

	return (
		<Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						{user.firstName} {user.lastName} • {user.email}
					</DialogDescription>
				</DialogHeader>

				<DialogBody className="space-y-6">
					{/* Profile section */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-[var(--muted-foreground)]">
							Profile
						</h3>
						<div className="grid grid-cols-2 gap-2">
							<Input
								placeholder="First name"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={!canEdit}
							/>
							<Input
								placeholder="Last name"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								disabled={!canEdit}
							/>
						</div>
						{canEdit && (
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									updateProfileMutation.mutate({
										userId: user.userId,
										firstName: firstName.trim(),
										lastName: lastName.trim(),
									})
								}
								disabled={updateProfileMutation.isPending}
							>
								{updateProfileMutation.isPending
									? "Saving..."
									: "Save Changes"}
							</Button>
						)}
					</div>

					{/* Facilities & Roles section */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-[var(--muted-foreground)]">
							Facilities & Roles
						</h3>
						<div className="space-y-1">
							{facilities?.map((f) => {
								const currentRole = membershipMap.get(f.facilityId);
								const isMember = !!currentRole;

								return (
									<div
										key={f.facilityId}
										className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
											isMember
												? "bg-[var(--accent)]"
												: "hover:bg-[var(--accent)]"
										}`}
									>
										<input
											type="checkbox"
											checked={isMember}
											disabled={!canEdit}
											onChange={() => {
												if (isMember) {
													removeFacilityMutation.mutate({
														userId: user.userId,
														facilityId: f.facilityId,
													});
												} else {
													addFacilityMutation.mutate({
														userId: user.userId,
														facilityId: f.facilityId,
														role: "STUDENT" as UserRole,
													});
												}
											}}
											className="h-4 w-4 rounded border-gray-300 accent-[var(--primary)]"
										/>
										<span className="min-w-0 flex-1 truncate text-sm font-medium">
											{f.name}
										</span>
										{isMember && canEdit && (
											<select
												value={currentRole}
												onChange={(e) =>
													updateRoleMutation.mutate({
														userId: user.userId,
														facilityId: f.facilityId,
														newRole: e.target.value as UserRole,
													})
												}
												className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-[var(--primary)] focus:outline-none"
											>
												{roles.map((r) => (
													<option key={r} value={r}>
														{r.replace("_", " ")}
													</option>
												))}
											</select>
										)}
										{isMember && !canEdit && (
											<RoleBadge role={currentRole} />
										)}
									</div>
								);
							})}
						</div>
					</div>

					{error && (
						<p className="text-red-500 text-xs">{error}</p>
					)}
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// Main UsersClient
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function UsersClient({
	userType,
	clubShortName,
}: {
	userType: string;
	clubShortName: string;
}) {
	const utils = api.useUtils();
	const { toasts, toast, dismiss } = useToast();
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [searchInput, setSearchInput] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [facilityFilter, setFacilityFilter] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchInput);
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const queryInput = {
		page,
		limit,
		search: debouncedSearch || undefined,
		facilityId: facilityFilter || undefined,
		role: (roleFilter as UserRole) || undefined,
	};

	const { data, isLoading } = api.user.listClubUsers.useQuery(queryInput, {
		staleTime: 30_000,
	});

	const { data: facilities } = api.calendar.getFacilities.useQuery();

	// Prefetch next page
	useEffect(() => {
		if (data && data.pagination.page < data.pagination.pageCount) {
			void utils.user.listClubUsers.prefetch(
				{ ...queryInput, page: page + 1 },
				{ staleTime: 30_000 },
			);
		}
	}, [data, page, limit, debouncedSearch, facilityFilter, roleFilter, utils]);

	const users = (data?.users ?? []) as ClubUser[];
	const pagination = data?.pagination;

	// Derive editingUser from fresh query data so it stays in sync after mutations
	const editingUser = editingUserId
		? users.find((u) => u.userId === editingUserId) ?? null
		: null;

	return (
		<div className="p-6">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />

			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/admin">
						<Button variant="ghost" size="icon">
							<ArrowLeft size={18} />
						</Button>
					</Link>
					<h1 className="font-semibold text-2xl text-[var(--foreground)]">
						Users
					</h1>
				</div>
				<Button variant="outline" onClick={() => setIsCreateOpen(true)}>
					<UserPlus size={16} className="mr-2" />
					Create User
				</Button>
			</div>

			{/* Filters */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative min-w-[200px] flex-1">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
					/>
					<Input
						placeholder="Search by name or email..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
				</div>

				<select
					value={facilityFilter}
					onChange={(e) => {
						setFacilityFilter(e.target.value);
						setPage(1);
					}}
					className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
				>
					<option value="">All Facilities</option>
					{facilities?.map((f) => (
						<option key={f.facilityId} value={f.facilityId}>
							{f.name}
						</option>
					))}
				</select>

				<select
					value={roleFilter}
					onChange={(e) => {
						setRoleFilter(e.target.value);
						setPage(1);
					}}
					className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
				>
					<option value="">All Roles</option>
					<option value="STUDENT">Student</option>
					<option value="COACH">Coach</option>
					<option value="FACILITY">Facility</option>
					<option value="CLUB_ADMIN">Club Admin</option>
					<option value="PLATFORM_ADMIN">Platform Admin</option>
				</select>

				<select
					value={limit}
					onChange={(e) => {
						setLimit(Number(e.target.value));
						setPage(1);
					}}
					className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
				>
					{PAGE_SIZE_OPTIONS.map((n) => (
						<option key={n} value={n}>
							{n} / page
						</option>
					))}
				</select>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="h-14 animate-pulse rounded-lg bg-gray-100"
						/>
					))}
				</div>
			) : users.length === 0 ? (
				<div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-[var(--muted-foreground)]">
					No users found.
				</div>
			) : (
				<div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
									Name
								</th>
								<th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
									Email
								</th>
								<th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
									Facilities & Roles
								</th>
								<th className="px-4 py-3 font-medium text-[var(--muted-foreground)]" />
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr
									key={u.userId}
									className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
								>
									<td className="px-4 py-3 font-medium text-[var(--foreground)]">
										{u.firstName} {u.lastName}
									</td>
									<td className="px-4 py-3 text-[var(--muted-foreground)]">
										{u.email}
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1">
											{u.clubMemberships.map((m) => (
												<span
													key={m.facilityId}
													className="inline-flex items-center gap-1"
												>
													<span className="text-xs text-[var(--muted-foreground)]">
														{m.facility.name}:
													</span>
													<RoleBadge role={m.role} />
												</span>
											))}
										</div>
									</td>
									<td className="px-4 py-3">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setEditingUserId(u.userId)}
										>
											<Pencil size={14} />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.pageCount > 1 && (
				<div className="mt-4 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
					<span>
						Showing {(pagination.page - 1) * pagination.limit + 1}–
						{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
						{pagination.total}
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft size={14} />
							Prev
						</Button>
						<span>
							Page {pagination.page} of {pagination.pageCount}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPage((p) => Math.min(pagination.pageCount, p + 1))
							}
							disabled={page === pagination.pageCount}
						>
							Next
							<ChevronRight size={14} />
						</Button>
					</div>
				</div>
			)}

			{/* Modals */}
			<CreateUserModal
				open={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				callerType={userType}
				toast={toast}
			/>
			<EditUserModal
				user={editingUser}
				onClose={() => setEditingUserId(null)}
				callerType={userType}
				toast={toast}
			/>
		</div>
	);
}
