"use client";

import { UserType } from "@prisma/client";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/app/_components/shared/dialog";
import CoachingNoteForm from "./CoachingNoteForm";
import CoachingNotesList from "./CoachingNotesList";

interface CoachingNoteModalProps {
	isOpen: boolean;
	onClose: () => void;
	mediaId: string;
	mediaTitle: string;
	studentName: string;
	collectionTitle: string;
	userType?: UserType;
}

export default function CoachingNoteModal({
	isOpen,
	onClose,
	mediaId,
	mediaTitle,
	studentName,
	collectionTitle,
	userType,
}: CoachingNoteModalProps) {
	const [activeTab, setActiveTab] = useState<"view" | "add">("view");

	const handleSuccessAdd = () => {
		setActiveTab("view");
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl" hideCloseButton>
				<DialogHeader>
					<DialogTitle>Coaching Notes</DialogTitle>
					<DialogDescription>
						<span className="font-medium">{studentName}</span> •{" "}
						{collectionTitle} • {mediaTitle}
					</DialogDescription>
				</DialogHeader>

				{/* Tabs
			   TODO(ui): The first tab has px-0 + mr-6 and the last tab has no trailing
			   margin, so spacing is inconsistent. Consider switching to a shared Tabs
			   primitive (Radix Tabs) or at least using uniform gap/padding. */}
				<div className="flex border-gray-200 border-b px-6">
					<button
						onClick={() => setActiveTab("view")}
						className={`px-0 py-3 font-medium text-sm transition-colors mr-6 ${
							activeTab === "view"
								? "border-[var(--primary)] border-b-2 text-[var(--primary)]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						View Notes
					</button>
					{(userType === UserType.COACH || userType === UserType.ADMIN) && (
						<button
							onClick={() => setActiveTab("add")}
							className={`px-0 py-3 font-medium text-sm transition-colors ${
								activeTab === "add"
									? "border-[var(--primary)] border-b-2 text-[var(--primary)]"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Add Note
						</button>
					)}
				</div>

				{/* Content */}
				<div className="max-h-[60vh] overflow-y-auto p-6">
					{activeTab === "view" && (
						<CoachingNotesList mediaId={mediaId} userType={userType} />
					)}

					{activeTab === "add" &&
						(userType === UserType.COACH || userType === UserType.ADMIN) && (
							<CoachingNoteForm
								mediaId={mediaId}
								onSuccess={handleSuccessAdd}
								onCancel={() => setActiveTab("view")}
							/>
						)}
				</div>

				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
