# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

# How to start developing this app

- clone the repo
- install orbstack if on macos, docker if on windows to host the db container
- set the db connection details in .env file, see the .env.example file to see how you want to do it. The start_database.sh script should ask you if you want it to set a random password for you. Pw and connection details should all be in that db url
- run the start_database.sh script to start the db.
- get a clerk application key and put it in the .env file as well, you'll need NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
- 'npm run db:generate'
- 'npm run db:migrate'
- run 'npm run dev' to start the application
- view the app, and log in via gmail to create a local user profile entry in the db.
- in a separate terminal run 'npx prisma studio'
- open your user entry in prisma studio and set your user type to 'ADMIN' so that you see the right things
