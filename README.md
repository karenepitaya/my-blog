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

## Building for production

- Frontend: `pnpm build` then `pnpm start`.
- Backend: `npm run build` then `npm start` (serves compiled files from `dist/`).

## Notes

- CORS is preconfigured to allow local development (`localhost:3000`/`5173`) and the production domains defined in `server/src/app.ts`.
- Authentication uses JWT (see `server/src/middleware/auth.ts`), and article slugs are unique for SEO-friendly URLs.
