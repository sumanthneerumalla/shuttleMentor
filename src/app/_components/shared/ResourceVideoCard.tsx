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
		<div className="glass-card rounded-xl p-6 animate-slide-up">
			<h3 className="text-xl font-semibold mb-4">{title}</h3>
			<YouTubeEmbed url={videoUrl} title={title} />
			{description && (
				<p className="mt-4 text-gray-600 whitespace-pre-line">{description}</p>
			)}
		</div>
	);
}
