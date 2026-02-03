import YouTubeEmbed from "./YouTubeEmbed";

interface ResourceVideoCardProps {
	title: string;
	videoUrl: string;
	description?: string;
}

export default function ResourceVideoCard({
	title,
	videoUrl,
	description,
}: ResourceVideoCardProps) {
	return (
		<div className="glass-card animate-slide-up rounded-xl p-6">
			<h3 className="mb-4 font-semibold text-xl">{title}</h3>
			<YouTubeEmbed url={videoUrl} title={title} />
			{description && (
				<p className="mt-4 whitespace-pre-line text-gray-600">{description}</p>
			)}
		</div>
	);
}
