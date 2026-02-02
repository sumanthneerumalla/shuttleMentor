import Link from "next/link";

export default function CoachNotFound() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto text-center py-16">
				<h1 className="text-3xl font-bold mb-4">Coach Not Found</h1>
				<p className="text-gray-600 mb-8">
					The coach you are looking for does not exist or may have been removed.
				</p>
				<Link
					href="/coaches"
					className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
				>
					Browse All Coaches
				</Link>
			</div>
		</div>
	);
}
