"use client";

import { UserType } from "@prisma/client";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
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

	if (!isOpen) return null;

	const handleSuccessAdd = () => {
		setActiveTab("view");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-gray-200 border-b p-6">
					<div>
						<h2 className="font-semibold text-gray-900 text-xl">
							Coaching Notes
						</h2>
						<p className="mt-1 text-gray-600 text-sm">
							<span className="font-medium">{studentName}</span> •{" "}
							{collectionTitle} • {mediaTitle}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 transition-colors hover:text-gray-600"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-gray-200 border-b">
					<button
						onClick={() => setActiveTab("view")}
						className={`px-6 py-3 font-medium text-sm transition-colors ${
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
							className={`px-6 py-3 font-medium text-sm transition-colors ${
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

				{/* Footer */}
				<div className="flex justify-end border-gray-200 border-t p-6">
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
