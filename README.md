## Libraries Used

The stack used in this project is 
- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## How to start developing this app

- Clone the repo
- Install OrbStack (macOS) or Docker (Windows/Linux) to host the database container
- Set the DB connection details in the `.env` file (see `.env.example` for the format). The `start_database.sh` script can generate a random password and update the URL for you
- Run the `start_database.sh` script to start the database
- Get a Clerk application key and put it in the `.env` file (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`)
- Run `npm run db:generate`
- Run `npm run db:migrate`
- Run `npm run dev` to start the application
- View the app and log in via Gmail to create a local user profile entry in the database
- In a separate terminal, run `npx prisma studio`
- Open your user entry in Prisma Studio and set your user type to `ADMIN` so that you see the right things

## Development with Docker

For local development using Docker (including app + PostgreSQL containers, migrations, and Prisma Studio), see:

- [Docker Usage Guide](./docs/docker-usage.md)

Follow the T3 deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
