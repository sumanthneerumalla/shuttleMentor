import { createPostgresJSExecutor } from "@prisma/studio-core/data/postgresjs";
import { serializeError } from "@prisma/studio-core/data/bff";
import postgres from "postgres";
import { getAdminUser } from "~/server/utils/utils";

export const dynamic = "force-dynamic";

function getErrorStatus(error: "Unauthorized" | "NotOnboarded" | "Forbidden"): number {
	return error === "Forbidden" ? 403 : 401;
}

export async function GET() {
	const result = await getAdminUser();

	if (!result.success) {
		return Response.json({ error: result.error }, { status: getErrorStatus(result.error) });
	}

	return Response.json({ message: "Studio API endpoint is running" });
}

export async function POST(request: Request) {
	const result = await getAdminUser();

	if (!result.success) {
		return Response.json({ error: result.error }, { status: getErrorStatus(result.error) });
	}

	try {
		const body = await request.json();
		const query = body.query;

		if (!query) {
			return Response.json([serializeError(new Error("Query is required"))], {
				status: 400,
			});
		}

		const url = process.env.DATABASE_URL;

		if (!url) {
			return Response.json(
				[serializeError(new Error("DATABASE_URL environment variable is missing"))],
				{ status: 500 }
			);
		}

		const sql = postgres(url);
		const executor = createPostgresJSExecutor(sql);
		const [queryError, results] = await executor.execute(query);
		await sql.end();

		if (queryError) {
			return Response.json([serializeError(queryError)]);
		}

		return Response.json([null, results]);
	} catch (err) {
		return Response.json([serializeError(err)], { status: 400 });
	}
}
