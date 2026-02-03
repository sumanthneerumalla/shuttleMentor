"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ProfileAvatarProps {
	imageUrl?: string | null;
	name?: string | null;
	alt?: string;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

/**
 * ProfileAvatar component that displays a user's profile image or their initials as fallback
 *
 * @param imageUrl - URL of the profile image
 * @param name - User's name to generate initials from
 * @param alt - Alt text for the image
 * @param size - Size of the avatar (sm: 32px, md: 48px, lg: 64px, xl: 96px)
 * @param className - Additional CSS classes
 */
export function ProfileAvatar({
	imageUrl,
	name,
	alt = "Profile",
	size = "md",
	className = "",
}: ProfileAvatarProps) {
	// Generate initials from name
	const getInitials = (name: string | null | undefined): string => {
		if (!name) return "?";

		const parts = name.trim().split(/\s+/);
		if (parts.length === 0) return "?";

		if (parts.length === 1 && parts[0]) {
			return parts[0].charAt(0).toUpperCase();
		}

		// Safe access with nullish coalescing to handle potential undefined values
		const firstInitial = parts[0]?.charAt(0) || "";
		const lastInitial = parts[parts.length - 1]?.charAt(0) || "";

		return (firstInitial + lastInitial).toUpperCase();
	};

	// Determine size class and font size
	const sizeClasses = {
		sm: "h-8 w-8",
		md: "h-12 w-12",
		lg: "h-16 w-16",
		xl: "h-24 w-24",
	};

	const fontSizeClasses = {
		sm: "text-xs",
		md: "text-base",
		lg: "text-xl",
		xl: "text-3xl font-bold",
	};

	const sizeClass = sizeClasses[size];

	// Determine background color based on name (if provided)
	const getColorClass = (name?: string | null) => {
		if (!name) return "bg-gray-200";

		// Simple hash function to get consistent color for the same name
		const hash = name.split("").reduce((acc, char) => {
			return acc + char.charCodeAt(0);
		}, 0);

		// List of background colors
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-yellow-500",
			"bg-red-500",
			"bg-purple-500",
			"bg-pink-500",
			"bg-indigo-500",
			"bg-teal-500",
		];

		return colors[hash % colors.length];
	};

	const fontSizeClass = fontSizeClasses[size];
	const initials = name ? getInitials(name) : "?";

	return (
		<Avatar className={`${sizeClass} ${className}`}>
			{/* Only render AvatarImage if imageUrl exists and is not empty */}
			{imageUrl ? (
				<AvatarImage
					src={imageUrl}
					alt={alt}
					onError={() => {
						// If image fails to load, force re-render to show fallback
						const img = document.querySelector(
							`img[alt="${alt}"]`,
						) as HTMLImageElement | null;
						if (img) img.style.display = "none";
					}}
				/>
			) : null}
			<AvatarFallback
				className={`${getColorClass(name)} flex items-center justify-center text-white ${fontSizeClass}`}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}
