"use client";

import { ProfileAvatar } from "./ProfileAvatar";

/**
 * ProfileImageDisplay serves as a specialized component for displaying profile images
 * in a consistent format throughout the application, particularly in profile views.
 *
 * Why this exists as a separate component from ProfileAvatar:
 * 1. Consistent Labeling: Ensures all profile images have the same "Profile Image" label
 * 2. Standardized Sizing: Always uses the "xl" size for profile displays
 * 3. Consistent Layout: Provides standard spacing and wrapper structure
 * 4. Simplified API: Reduces the number of props needed when displaying profile images
 * 5. Separation of Concerns: ProfileAvatar handles avatar display logic while this component
 *    handles the specific context of displaying a profile image in a form-like layout
 */

interface ProfileImageDisplayProps {
	imageUrl?: string | null;
	name?: string | null;
	alt?: string;
}

/**
 * ProfileImageDisplay component that displays a user's profile image with a label
 *
 * @param imageUrl - URL of the profile image
 * @param name - User's name for fallback initials (used when image is not available)
 * @param alt - Alt text for the image for accessibility
 */
export function ProfileImageDisplay({
	imageUrl,
	name,
	alt = "Profile",
}: ProfileImageDisplayProps) {
	return (
		<div>
			{/* Consistent label for all profile images */}
			<label className="text-sm text-gray-500">Profile Image</label>

			{/* Wrapper with standard spacing */}
			<div className="mt-2">
				{/* 
          Using ProfileAvatar with fixed "xl" size for consistency across all profile displays.
          This ensures that all profile images in the application have the same large size,
          which is appropriate for profile detail views.
        */}
				<ProfileAvatar imageUrl={imageUrl} name={name} alt={alt} size="xl" />
			</div>
		</div>
	);
}
