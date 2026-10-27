## Run with Docker Compose

Install Docker with the Compose plugin, then create the local environment file:

```bash
cp .env.example .env
```

Fill in the Supabase, Edge Functions, site URL, Google Maps, and Firebase values
in `.env`. `SUPABASE_SERVICE_ROLE_KEY` is supplied only to the running
container; it is not passed to the Docker build. Keep `.env` private and do not
commit it.

Build and start the production app:

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000). To view logs or stop the
app, run:

```bash
docker compose logs -f web
docker compose down
```

The `NEXT_PUBLIC_*` values are compiled into browser assets during the image
build. Rebuild the image with `docker compose up --build -d` after changing
those values.

### Coolify

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
build-time variables in Coolify; Next.js needs them to generate the static blog
pages and browser bundle. Configure the other `NEXT_PUBLIC_*` variables as
build-time variables as well so their values are included in browser assets.
Set the remaining variables as runtime variables. In particular,
`SUPABASE_SERVICE_ROLE_KEY` is runtime-only and must not be a build-time
variable. Trigger a new deployment after changing build-time values.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# zemen-web
