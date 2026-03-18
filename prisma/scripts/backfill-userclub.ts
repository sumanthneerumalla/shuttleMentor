/**
 * Backfill script: populate UserClub rows from existing User.clubShortName + User.userType.
 *
 * Run once after applying migration 20260318001013_add_user_club_membership:
 *   npx tsx prisma/scripts/backfill-userclub.ts
 *
 * Idempotent — uses upsert so it's safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const users = await db.user.findMany({
		select: {
			userId: true,
			clubShortName: true,
			userType: true,
		},
	});

	console.log(`Found ${users.length} users to backfill.`);

	let created = 0;
	let skipped = 0;

	for (const user of users) {
		// Upsert: if a UserClub row already exists for this pair, leave it alone
		const result = await db.userClub.upsert({
			where: {
				userId_clubShortName: {
					userId: user.userId,
					clubShortName: user.clubShortName,
				},
			},
			create: {
				userId: user.userId,
				clubShortName: user.clubShortName,
				role: user.userType,
			},
			update: {}, // no-op if already exists
		});

		if (result) created++;
		else skipped++;
	}

	console.log(`Done. Upserted ${created} UserClub rows (${skipped} already existed).`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => void db.$disconnect());
