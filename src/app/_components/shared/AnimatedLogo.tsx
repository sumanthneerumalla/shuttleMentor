import React from "react";
import { cn } from "~/lib/utils";

interface AnimatedLogoProps {
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function AnimatedLogo({ className, size = "md" }: AnimatedLogoProps) {
	const sizeClasses = {
		sm: "h-8 w-8",
		md: "h-10 w-10",
		lg: "h-12 w-12",
	};

	return (
		<div
			className={cn(
				"relative flex items-center justify-center",
				sizeClasses[size],
				className,
			)}
		>
			<div className="absolute inset-0 flex items-center justify-center">
				<svg
					viewBox="0 0 100 100"
					className="h-full w-full"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Court background */}
					<rect
						x="10"
						y="20"
						width="80"
						height="60"
						rx="4"
						fill="currentColor"
						className="text-indigo-100"
					/>

					{/* Court lines */}
					<line
						x1="50"
						y1="20"
						x2="50"
						y2="80"
						stroke="currentColor"
						strokeWidth="2"
						className="text-indigo-300"
					/>
					<line
						x1="10"
						y1="50"
						x2="90"
						y2="50"
						stroke="currentColor"
						strokeWidth="2"
						className="text-indigo-300"
					/>

					{/* Shuttlecock head */}
					<circle
						cx="50"
						cy="35"
						r="12"
						fill="currentColor"
						className="stroke-indigo-500 text-white"
						stroke="currentColor"
						strokeWidth="2"
					/>

					{/* Shuttlecock feathers */}
					<path
						d="M50 47 L44 65"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						className="text-indigo-500"
					/>
					<path
						d="M50 47 L50 65"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						className="text-indigo-500"
					/>
					<path
						d="M50 47 L56 65"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						className="text-indigo-500"
					/>
				</svg>
			</div>
		</div>
	);
}

export default AnimatedLogo;
