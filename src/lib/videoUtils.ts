/**
 * Video utility functions for embedding YouTube and Vimeo videos
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function extractYouTubeId(url: string): string | null {
	const regExp =
		/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[7] && match[7].length === 11 ? match[7] : null;
}

/**
 * Get YouTube thumbnail URL from a YouTube video URL
 * Returns the high-quality default thumbnail (480x360)
 *
 * Note: As a future enhancement, we could auto-populate Media.thumbnailUrl
 * at upload time using this function, avoiding runtime computation.
 */
export function getYouTubeThumbnailUrl(url: string): string | null {
	const videoId = extractYouTubeId(url);
	if (!videoId) return null;
	return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Convert video URLs to embed URLs for iframe embedding
 * Supports YouTube and Vimeo
 */
export function getEmbedUrl(url: string): string {
	try {
		// YouTube
		if (url.includes("youtube.com") || url.includes("youtu.be")) {
			const videoId = extractYouTubeId(url);
			if (videoId) return `https://www.youtube.com/embed/${videoId}`;
		}

		// Vimeo
		if (url.includes("vimeo.com")) {
			const vimeoId = url.split("/").pop();
			if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
		}

		// For other URLs, return as is (may not work as embed)
		return url;
	} catch (e) {
		return url;
	}
}
