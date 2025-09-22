# SubTrack Frontend Onboarding Guide

This guide helps you spin up the SubTrack web client for local development or Docker-based testing.
It assumes you have the SubTrack monorepo cloned with both the frontend and backend projects available
side by side.

## Prerequisites

- Node.js 18+ and npm 9+ for local development
- Docker and Docker Compose for the container workflow (optional)
- Access to the SubTrack backend and database credentials

## Project Structure

```
SubTrack-frontend/
  ├─ src/              # React application code
  ├─ public/           # Static assets served by Vite
  ├─ package.json      # npm scripts and dependencies
  ├─ vite.config.js    # Vite configuration
  └─ README.md         # This guide
```

## Environment Variables

Create a `.env.local` file in `SubTrack-frontend/` before starting the dev server. The following
variables are read at build time:

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL for all API requests. Use `http://localhost:3000/api` when running against the local backend or Docker Compose stack. |

Restart the dev server whenever you change build-time environment variables.

## Installing Dependencies

Install the frontend dependencies once after cloning:

```bash
cd SubTrack-frontend
npm install
```

## Local Development (npm)

1. **Start the backend API** in another terminal:
   ```bash
   cd SubTrack-backend
   npm install
   node src/index.js
   ```
   The server listens on `http://localhost:3000` by default.

2. **Start the frontend dev server**:
   ```bash
   cd SubTrack-frontend
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser. The dev server proxies API calls directly to
   the backend specified by `VITE_API_URL`.

## Docker Compose Quick Start

1. Copy the environment template, fill in secrets, and export them locally:
   ```bash
   cp .env.example .env
   # edit .env to include database credentials, JWT secret, and OAuth client IDs
   ```

2. Launch all services:
   ```bash
   docker compose up --build
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api

   The frontend container reads `VITE_API_URL` from the build context; if you run the dev server
   outside Docker, ensure your `.env.local` also points to `http://localhost:3000/api`.

3. Stop the stack with `docker compose down`.

## Useful npm Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite in development mode with hot reload. |
| `npm run build` | Build the production bundle into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint checks on the project. |

## Troubleshooting

- **CORS or network errors**: Confirm `VITE_API_URL` matches the backend host (`http://localhost:3000/api`) and that the backend's `FRONTEND_URL` allows `http://localhost:5173`.
- **Environment updates not applied**: Stop Vite (`Ctrl+C`) and restart after editing `.env.local`.
- **Backend fails to start**: Verify required database and OAuth environment variables exist in `SubTrack-backend/.env` or your shell.

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/learn)
- Backend setup instructions reside in `SubTrack-backend/README.md` (if available).
