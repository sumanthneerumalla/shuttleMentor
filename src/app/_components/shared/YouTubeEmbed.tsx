import { cn } from "~/lib/utils";
import { getEmbedUrl } from "~/lib/videoUtils";

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
				"aspect-video overflow-hidden rounded-lg bg-black",
				className,
			)}
		>
			<iframe
				src={embedUrl}
				className={cn("h-full w-full", iframeClassName)}
				title={title}
				allowFullScreen
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			/>
		</div>
	);
}
