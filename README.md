# The Skill Hearth

> "Connection as a byproduct of learning together — not the goal itself."

A hyperlocal skill-sharing platform connecting neighbors who want to teach and learn practical skills (cooking, gardening, repairs, sewing, digital literacy, and more).

## Tech Stack

- **Client**: React 19 + TypeScript + Tailwind CSS 4 (Vite), Leaflet/OSM, Socket.io-client, React Query
- **Server**: Node.js + Express 5 + TypeScript, MongoDB/Mongoose, Socket.io, JWT, Multer, Zod
- **Infra**: Redis (sessions/cache/queues), Cloudinary (media)

## Getting Started

```bash
cp .env.example server/.env   # then fill in values
cp .env.example client/.env   # only VITE_API_URL needed for the client
docker compose up -d          # Mongo + Redis
npm install                   # root (concurrently)
npm install --prefix client
npm install --prefix server
npm run dev                   # runs client (5173) + server (5000)
```

## Structure

```
client/    React SPA (pages, components, hooks, services, context, types, utils)
server/    Express API (routes, controllers, services, models, middleware, config, sockets, jobs)
shared/    Future monorepo shared types
```

## Scripts

- `npm run dev` — run client + server together
- `npm run dev --prefix client` — client only (Vite on :5173)
- `npm run dev --prefix server` — server only (tsx watch on :5000)
- `npm run build --prefix client` — typecheck + Vite build
- `npm run build --prefix server` — tsc build to `server/dist`
