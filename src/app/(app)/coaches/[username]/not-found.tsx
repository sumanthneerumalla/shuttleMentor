import Link from "next/link";

export default function CoachNotFound() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-7xl py-16 text-center">
				<h1 className="mb-4 font-bold text-3xl">Coach Not Found</h1>
				<p className="mb-8 text-gray-600">
					The coach you are looking for does not exist or may have been removed.
				</p>
				<Link
					href="/coaches"
					className="rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]"
				>
					Browse All Coaches
				</Link>
			</div>
		</div>
	);
}
