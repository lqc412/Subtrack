# SubTrack Frontend

The SubTrack frontend is a Vite-powered React single-page application that provides the user interface for managing subscriptions, payment history, and budgeting workflows. It communicates exclusively with the SubTrack backend API and reuses shared authentication cookies when running behind the same domain.

## Prerequisites

- Node.js 20.x (LTS) or newer
- npm 10.x or newer
- Access to a running instance of the SubTrack backend (local `npm run dev` or Docker Compose)
- (Docker path) Docker Engine 24+ and Docker Compose v2.20+

## Environment variables

The app reads configuration from Vite-compatible `.env` files located at the project root. Copy `.env.example` to `.env.local` (ignored by git) or modify the provided mode-specific files (such as `.env.development`). Common keys include:

| Key | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the backend REST API. Use the gateway exposed by Docker Compose (`http://localhost:8080/api`) or the locally running backend (`http://localhost:3000/api`). | `/api` |
| `VITE_API_DEBUG` | Enables verbose logging of API requests in the browser console when set to `true`. | `false` |
| `VITE_APP_ENV` | Arbitrary label that surfaces in browser logs to help differentiate environments. | `development` |

> **Tip:** Vite only exposes variables prefixed with `VITE_`. Ensure any additional config values follow this naming convention or they will be ignored at build time.

## Installing dependencies

```bash
npm install
```

## Development workflows

### 1. Standalone frontend with local backend

This flow is ideal when you want to run the frontend with a backend started from the `SubTrack-backend` workspace.

1. Start the backend API from a separate terminal following the backend README (typically `npm install && npm run start:dev`).
2. From `SubTrack-frontend`, copy `.env.development` to `.env.local` if you need custom values. Set `VITE_API_URL` to the backend URL (default `http://localhost:3000/api`).
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the URL printed in the terminal (usually `http://localhost:5173`) and ensure the API requests succeed by confirming network calls hit `VITE_API_URL`.

### 2. Full stack with Docker Compose

Use the repo’s Docker Compose definition to boot both services together.

1. Copy the provided sample env files if needed (`cp SubTrack-frontend/.env.development SubTrack-frontend/.env.local`). Ensure `VITE_API_URL=http://localhost:8080/api` to reach the backend gateway exposed by Compose.
2. From the repository root, start the stack:
   ```bash
   docker compose up --build
   ```
3. After the containers build, visit `http://localhost:5173` (or the port defined in `docker-compose.yml`). The frontend container proxies requests to the backend container via the shared network defined in Compose.
4. To stop the stack, press `Ctrl+C` or run `docker compose down` in another terminal.

## Available npm scripts

- `npm run dev` – Starts the Vite development server with hot module replacement.
- `npm run build` – Generates a production build in `dist/`.
- `npm run preview` – Serves the production build locally for smoke testing.
- `npm run lint` – Runs ESLint against the source code.

## Frontend–backend integration

- API calls use Axios and the `VITE_API_URL` base path. When the frontend and backend are served from the same origin (via reverse proxy or Compose), `VITE_API_URL` can remain `/api` so the browser reuses authentication cookies.
- Authentication, billing, and subscription data are all retrieved from the backend. Make sure the backend seeds required demo data or connects to the expected database before testing flows such as invoice retrieval.
- Websocket or server-sent event features (if enabled) also rely on the backend host specified by `VITE_API_URL`.

## Troubleshooting

| Issue | Possible cause | Resolution |
| --- | --- | --- |
| CORS errors in the browser console | `VITE_API_URL` points to a different origin without proper CORS headers. | Update the backend CORS configuration to allow the frontend origin, or run both services behind the same host/port (set `VITE_API_URL=/api`). |
| Requests 404 or hit the wrong service | `VITE_API_URL` not aligned with the running backend port or Compose gateway. | Verify the backend port (3000 for local dev, 8080 when using Compose gateway) and update the env file. Restart `npm run dev` after changing environment variables. |
| Build fails because env variables are undefined | Missing `.env.local` or not using `VITE_` prefix. | Ensure your env file exists, uses `VITE_` prefixes, and restart the dev server so Vite picks up new variables. |
| Docker Compose frontend cannot reach backend | Containers on different networks or backend service not healthy. | Run `docker compose ps` to confirm services are healthy. Ensure the Compose network includes both services and `VITE_API_URL` uses the gateway defined in `docker-compose.yml`. |

For additional backend-specific troubleshooting, consult the [`SubTrack-backend` README](../SubTrack-backend/README.md).
