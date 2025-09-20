# SubTrack Frontend

This package contains the React application served by Vite for the SubTrack project.

## Prerequisites

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
```

## Environment configuration

Vite reads environment variables from `.env` files at the project root. The repo provides a default development configuration in [`.env.development`](./.env.development) that points the frontend to the local API gateway:

```
VITE_API_URL=http://localhost:3000/api
VITE_API_DEBUG=false
```

To customize the values, create a `.env.local` (or another [Vite environment file](https://vitejs.dev/guide/env-and-mode.html#env-files)) with overrides. The available variables are:

- `VITE_API_URL`: Base URL for API requests. Defaults to `/api` when unset so the frontend can proxy requests through the same origin.
- `VITE_API_DEBUG`: Set to `true` to log axios request/response information in the browser console. Defaults to `false`.

## Development

```bash
npm run dev
```

The command uses the values from `.env.development` by default, so requests are sent to `http://localhost:3000/api`.

## Linting

```bash
npm run lint
```

## Production build

```bash
npm run build
```
