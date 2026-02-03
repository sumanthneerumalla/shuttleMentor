"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "./Button";

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
		<div className="container mx-auto mt-16 px-4 py-8">
			<div className="mx-auto max-w-2xl text-center">
				<div className="glass-panel p-8">
					{/* 403 Icon */}
					<div className="mb-6">
						<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
							<ShieldAlert className="h-10 w-10 text-red-600" />
						</div>
					</div>

					{/* Error Content */}
					<h1 className="mb-4 font-bold text-2xl text-gray-900">{title}</h1>

					<p className="mb-6 text-gray-600 leading-relaxed">{message}</p>

					{/* Action Buttons */}
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
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
					<div className="mt-8 border-gray-200 border-t pt-6">
						<p className="text-gray-500 text-sm">
							If you believe this is an error, please contact your coach or
							administrator for assistance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
