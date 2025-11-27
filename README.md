# My Blog

A monorepo for a personal blog platform with a Next.js 16 frontend and an Express + MongoDB API backend. The frontend provides the site shell, while the backend powers authoring, authentication, and content delivery.

## Project structure

- `frontend/` — Next.js 16 app (App Router) with Tailwind CSS 4 for styling.
- `server/` — Express 5 API written in TypeScript with MongoDB via Mongoose. Handles authentication, articles, categories, and comments.

## Prerequisites

- Node.js 20+
- A running MongoDB instance
- Package manager: `pnpm` (frontend lockfile) or `npm` (server uses package-lock)

## Backend setup (`server/`)

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file in `server/`:
   ```bash
   MONGO_USERNAME=<username>
   MONGO_PASSWORD=<password>
   MONGO_DBNAME=<database>
   MONGO_HOST=127.0.0.1
   MONGO_PORT=27017
   JWT_SECRET=<jwt-secret>
   JWT_EXPIRES=7d
   PORT=3001
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The API will listen on `http://localhost:3001` with routes such as:
   - `POST /api/users/register` to create the admin account (single-user blog)
   - `POST /api/users/login` to obtain a JWT
   - `GET /api/articles` for listing articles
   - `POST /api/articles` for creating articles (requires `Authorization: Bearer <token>`)

## Frontend setup (`frontend/`)

1. Install dependencies:
   ```bash
   cd frontend
   pnpm install
   ```
2. Run the app in development mode:
   ```bash
   pnpm dev
   ```
   The site will be available at `http://localhost:3000`.

3. Configure the API base URL (optional):
   - By default the frontend calls `http://localhost:3001/api`.
   - To point to another backend instance, create a `.env.local` in `frontend/` and set:
     ```bash
     NEXT_PUBLIC_API_BASE_URL=http://your-host:3001/api
     ```

## Building for production

- Frontend: `pnpm build` then `pnpm start`.
- Backend: `npm run build` then `npm start` (serves compiled files from `dist/`).

## How to test the stack

1. **Run linting for the frontend**
   ```bash
   cd frontend
   pnpm lint
   ```

2. **Start the backend API** (from another terminal)
   ```bash
   cd server
   npm run dev
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   pnpm dev
   ```

4. **Manual QA flows**
   - Visit `http://localhost:3000` and confirm the homepage renders categories and the latest articles.
   - Use the search box to query articles; results should update server-side with no stale cache.
   - Click a category pill to filter articles; use “清除” to reset filters.
   - Open an article card to verify the detail page shows the banner, metadata, markdown-rendered body, and TOC links.
   - Toggle between different backend bases by adjusting `NEXT_PUBLIC_API_BASE_URL` if needed.

## Notes

- CORS is preconfigured to allow local development (`localhost:3000`/`5173`) and the production domains defined in `server/src/app.ts`.
- Authentication uses JWT (see `server/src/middleware/auth.ts`), and article slugs are unique for SEO-friendly URLs.
