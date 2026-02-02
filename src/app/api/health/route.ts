import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker and monitoring systems
 * Returns basic health information about the application
 */
export async function GET() {
	try {
		// Basic health information
		const healthData = {
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV,
			version: process.env.npm_package_version || "unknown",
		};

		return NextResponse.json(healthData, { status: 200 });
	} catch (error) {
		console.error("Health check failed:", error);
		return NextResponse.json(
			{ status: "error", message: "Health check failed" },
			{ status: 500 },
		);
	}
}
