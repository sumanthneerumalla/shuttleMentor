"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/app/_components/shared/Button";
import CoachingNoteForm from "./CoachingNoteForm";
import CoachingNotesList from "./CoachingNotesList";
import { UserType } from "@prisma/client";

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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Coaching Notes
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							<span className="font-medium">{studentName}</span> •{" "}
							{collectionTitle} • {mediaTitle}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200">
					<button
						onClick={() => setActiveTab("view")}
						className={`px-6 py-3 text-sm font-medium transition-colors ${
							activeTab === "view"
								? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						View Notes
					</button>
					{(userType === UserType.COACH || userType === UserType.ADMIN) && (
						<button
							onClick={() => setActiveTab("add")}
							className={`px-6 py-3 text-sm font-medium transition-colors ${
								activeTab === "add"
									? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Add Note
						</button>
					)}
				</div>

				{/* Content */}
				<div className="p-6 max-h-[60vh] overflow-y-auto">
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
				<div className="flex justify-end p-6 border-t border-gray-200">
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
