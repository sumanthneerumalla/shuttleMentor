import { getEmbedUrl } from "~/lib/videoUtils";
import { cn } from "~/lib/utils";

interface YouTubeEmbedProps {
	url: string;
	title: string;
	className?: string;
	iframeClassName?: string;
}

export default function YouTubeEmbed({
	url,
	title,
	className,
	iframeClassName,
}: YouTubeEmbedProps) {
	const embedUrl = getEmbedUrl(url);

	return (
		<div
			className={cn(
				"aspect-video bg-black rounded-lg overflow-hidden",
				className,
			)}
		>
			<iframe
				src={embedUrl}
				className={cn("w-full h-full", iframeClassName)}
				title={title}
				allowFullScreen
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			/>
		</div>
	);
}
