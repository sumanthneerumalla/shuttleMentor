"use client";

import Link from "next/link";
import { Button } from "./Button";
import { ShieldAlert } from "lucide-react";

interface UnauthorizedAccessProps {
	title?: string;
	message?: string;
	showBackButton?: boolean;
	backUrl?: string;
	backLabel?: string;
}

export default function UnauthorizedAccess({
	title = "Access Denied",
	message = "You are not authorized to access this content. This media collection may be private or assigned to a different coach.",
	showBackButton = true,
	backUrl = "/video-collections",
	backLabel = "Back to Collections",
}: UnauthorizedAccessProps) {
	return (
		<div className="container mx-auto px-4 py-8 mt-16">
			<div className="max-w-2xl mx-auto text-center">
				<div className="glass-panel p-8">
					{/* 403 Icon */}
					<div className="mb-6">
						<div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
							<ShieldAlert className="w-10 h-10 text-red-600" />
						</div>
					</div>

					{/* Error Content */}
					<h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

					<p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{showBackButton && (
							<Link href={backUrl}>
								<Button variant="default" className="w-full sm:w-auto">
									{backLabel}
								</Button>
							</Link>
						)}

						<Link href="/dashboard">
							<Button variant="outline" className="w-full sm:w-auto">
								Go to Dashboard
							</Button>
						</Link>
					</div>

					{/* Additional Help */}
					<div className="mt-8 pt-6 border-t border-gray-200">
						<p className="text-sm text-gray-500">
							If you believe this is an error, please contact your coach or
							administrator for assistance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
