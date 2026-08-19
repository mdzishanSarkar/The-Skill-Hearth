# The Skill Hearth

> "Connection as a byproduct of learning together — not the goal itself."

The Skill Hearth is a **hyperlocal skill-sharing platform** that connects neighbors who want to teach and learn practical, everyday skills — cooking, gardening, home repairs, sewing, digital literacy, and more. It transforms a neighborhood into a living classroom where people meet, grow, and build long-term relationships through teaching and learning.

This repository is a monorepo containing the **React single-page application** (client) and the **Node.js/Express API** (server), orchestrated together for local development.

---

## Key Features

### Discovery & Matching
- **Skill map** — interactive map (Leaflet/OpenStreetMap) with clustered skill pins, geolocation-aware, defaulting to the user's location (Dhaka by default).
- **Browse skills** — searchable, filterable catalog of nearby teach/learn skills.
- **My Radar** — personalized skill alerts based on interests and location.
- **Skill demand** — visual demand heatmap across the neighborhood.
- **Swap-ready matches** — automatic pairing of learners and teachers with complementary skills.
- **Saved searches** — persist and revisit discovery queries.
- **Ask the Hearth** — natural-language skill search powered by server-side geocoding and text matching.

### Learning & Growth
- **Connections & sessions** — request, schedule, complete, and review skill sessions.
- **Courses** — structured multi-session courses with enrollment and progress tracking.
- **Group sessions** — neighborhood group learning with scheduling, capacity, and join/leave flows.
- **Challenges** — goal-based skill challenges with badges, participants, and leaderboards.
- **Mentorships** — long-term mentor/mentee relationships with goals, check-ins, and completion.
- **Skill journal** — mood-tracked reflections tied to sessions, with a logging streak.
- **Gamification** — XP, levels, badges, streaks, and global/local leaderboards.
- **Impact & reviews** — impact dashboard (sessions taught, learners helped, neighborhoods reached) and a rating/review system.

### Community & Social
- **Community board** — neighborhood-scoped posts with up/down voting and moderation (reporting).
- **Learner board** — learners post requests; teachers offer to help.
- **Feed** — activity feed with emoji reactions, pagination, and visibility controls.
- **Friends** — friend requests, close friends, and friendship tiers.
- **Messenger** — real-time private chat with typing/read receipts, message editing, **unsend**, and **delete conversation** flows (single-page messenger at `/messages`).
- **Showcase** — community members share skill projects with media and likes.
- **Skill bundles** — curated multi-skill learning paths with community voting.
- **Skill suggestions** — community-submitted skill taxonomy proposals with voting and admin review.

### Platform & Administration
- **Authentication & account security** — email verification, JWT access/refresh tokens, password reset, OAuth, and optional TOTP two-factor authentication.
- **Notifications** — in-app notification center with unread badges and real-time pushes.
- **Calendar integrations** — connect external calendars, sync sessions, and manage block-out dates.
- **Billing** — Stripe-powered tipping and skill promotion.
- **Bots & integrations** — installable bots with slash-command support.
- **Content moderation** — automated text moderation, report queues, and admin resolution workflows.
- **Admin panel** — user management, moderation stats, and report resolution.
- **Public API** — opt-in API keys, webhook delivery, and public platform stats.
- **PWA** — installable client with offline-capable service worker support.

---

## Architecture

```
The-Skill-Hearth/
├── client/                React SPA (Vite + TypeScript)
│   └── src/
│       ├── app/           Application shell & routing
│       ├── components/    UI components (auth, chat, community, forms, layout, map, ...)
│       ├── context/       React context providers
│       ├── hooks/         Shared React hooks (auth, geolocation, sockets, notifications)
│       ├── pages/         Route-level pages (public, private & admin)
│       ├── services/      Typed API clients
│       ├── stores/        Zustand stores (messenger, chat settings)
│       ├── types/         Shared domain types
│       └── utils/         Helpers (media, toast, journal, etc.)
│
├── server/                Express API (TypeScript)
│   └── src/
│       ├── config/        Infra wiring (DB, Redis, Stripe, Cloudinary, Socket.io)
│       ├── controllers/   HTTP request handlers
│       ├── middleware/    Auth, validation, uploads, error handling
│       ├── models/        Mongoose schemas
│       ├── routes/        Feature route groups
│       ├── services/      Business logic
│       ├── sockets/       Socket.io event handlers
│       ├── jobs/          Bull queue workers
│       ├── utils/         Shared helpers
│       └── scripts/       Seed & maintenance scripts
│
├── shared/                Future monorepo shared types
├── docker-compose.yml     Local MongoDB + Redis
└── .env.example           Reference environment configuration
```

### Request flow

The client is a single-page app backed by a typed service layer. The server exposes a REST API (`/api/*`) for CRUD and a Socket.io layer for real-time features (messenger, notifications, presence). Socket and REST share the same service layer, so business rules are enforced consistently regardless of transport.

---

## Tech Stack

### Client

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Framework        | React 19 + TypeScript (strict)                                    |
| Build            | Vite, `@tailwindcss/vite` (Tailwind CSS 4)                        |
| Routing          | React Router 7                                                    |
| State            | Zustand (client/feature stores), TanStack Query                   |
| Real-time        | socket.io-client                                                  |
| Maps             | Leaflet + `react-leaflet` + marker clustering                     |
| UI / utilities   | react-icons, clsx, date-fns, framer-motion, react-window, DOMPurify |
| Data fetching    | Axios                                                            |
| PWA              | vite-plugin-pwa                                                  |

### Server

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| Runtime      | Node.js + TypeScript                                                |
| HTTP         | Express 5 (helmet, cors, cookie-parser, express-rate-limit)          |
| Database     | MongoDB + Mongoose 9                                                 |
| Cache/Queue  | Redis (sessions, token blacklist, login lockout, Bull queues)        |
| Real-time    | Socket.io                                                           |
| Auth         | JWT (access/refresh), bcryptjs, OTP (otplib + qrcode)               |
| Validation   | Zod                                                                |
| Uploads      | Multer (local disk or Cloudinary)                                   |
| Email        | Nodemailer (SMTP)                                                   |
| Payments     | Stripe (tipping, skill promotion)                                   |
| Jobs         | Bull (notifications, inbox services)                                |

### Infrastructure

| Component | Purpose                                        |
| --------- | ---------------------------------------------- |
| MongoDB   | Primary data store (via Docker)                |
| Redis     | Caching, token blacklist, Bull queues (via Docker) |
| Docker    | Local dev infrastructure (`docker compose up`) |

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker (for MongoDB and Redis)
- Git

### 1. Clone

```bash
git clone <repository-url> The-Skill-Hearth
cd The-Skill-Hearth
```

### 2. Configure environment

```bash
cp .env.example server/.env   # fill in real values
cp .env.example client/.env   # only VITE_API_URL is required for the client
```

See [Environment Variables](#environment-variables) below for a full reference.

### 3. Start local infrastructure

```bash
docker compose up -d          # MongoDB on :27017, Redis on :6379
```

### 4. Install dependencies

```bash
npm install                    # root (concurrently)
npm install --prefix client
npm install --prefix server
```

### 5. Run the development servers

```bash
npm run dev                    # runs the API (:5000) and the SPA (:5173) together
```

- Client: http://localhost:5173
- Server: http://localhost:5000

### 6. Seed demo data (optional)

```bash
npm run seed:all --prefix server        # general demo data
npm run seed:map-skills --prefix server # map skill pins
```

---

## Scripts

| Command                                       | Description                                   |
| --------------------------------------------- | --------------------------------------------- |
| `npm run dev`                                 | Run client and server concurrently            |
| `npm run dev --prefix client`                 | Client only (Vite on :5173)                   |
| `npm run dev --prefix server`                 | Server only (tsx watch on :5000)              |
| `npm run build --prefix client`               | Typecheck (`tsc -b`) + Vite production build  |
| `npm run build --prefix server`               | TypeScript build to `server/dist`             |
| `npm run start --prefix server`               | Serve the built server (`node dist/server.js`)|
| `npm run lint --prefix client`                | Lint the client (oxlint)                      |
| `npm run seed:all --prefix server`            | Seed general demo data                        |
| `npm run seed:map-skills --prefix server`     | Seed map skill pins                           |

---

## Environment Variables

Reference: `.env.example`

| Variable                 | Used by | Purpose                                             |
| ------------------------ | ------- | --------------------------------------------------- |
| `PORT`                   | Server  | API listen port (default `5000`)                    |
| `NODE_ENV`               | Server  | Runtime environment                                 |
| `CLIENT_URL`             | Server  | Allowed CORS origins (comma-separated)              |
| `SITE_URL`               | Server  | Canonical site URL (links in emails, etc.)          |
| `MONGODB_URI`            | Server  | MongoDB connection string                           |
| `JWT_SECRET`             | Server  | Signing secret for access/refresh tokens            |
| `ADMIN_SIGNUP_CODE`      | Server  | Required code to register an admin account          |
| `REDIS_URL`              | Server  | Redis connection (token blacklist, queues, caching) |
| `SMTP_HOST` / `SMTP_PORT`| Server  | SMTP host/port for transactional email              |
| `SMTP_USER` / `SMTP_PASS`| Server  | SMTP credentials (Gmail App Password recommended)   |
| `EMAIL_FROM`             | Server  | From-address for outbound email                     |
| `CLOUDINARY_*`           | Server  | Cloudinary credentials (avatar/media uploads)       |
| `STRIPE_SECRET_KEY`      | Server  | Stripe secret key (tipping, promotions)             |
| `VITE_API_URL`           | Client  | Base URL of the API (`http://localhost:5000/api`)   |

> When `REDIS_URL`, Cloudinary, or Stripe credentials are not configured, the server falls back to
> local equivalents (MongoDB/in-memory stores, local disk uploads, and disabled billing) so the
> application remains fully usable in development.

---

## Feature Modules

The server is organized into feature routes, each with a corresponding controller, service, and (where applicable) Mongoose model:

| Domain         | Routes / Modules                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Accounts       | `auth`, `oauth`, `users`, `twoFactor`                                                                |
| Discovery      | `skills`, `search`, `discovery`, `discoveryEnhanced`, `skillRadar`, `skillDemand`, `savedSearches`   |
| Learning       | `sessions`, `connections`, `courses`, `groupSessions`, `challenges`, `mentorships`, `journal`        |
| Social         | `friends`, `feed`, `community`, `reviews`, `endorsements`, `showcase`, `bundles`, `suggestions`      |
| Messaging      | `messages`, `messenger`, `dms`, `conversations`, `messageEnhanced`                                   |
| Notifications  | `notifications`, `inbox` (Bull-backed queue)                                                         |
| Commerce       | `billing` (Stripe), `swaps`, `swapReadyMatches`                                                       |
| Integrations   | `calendars`, `blockOutDates`, `bots`, `webhooks`, `apiPublic`                                        |
| Governance     | `reports`, `contentModeration`, `moderation`, `admin`                                                 |

---

## Real-Time & Background Processing

- **Socket.io** powers the messenger and presence features. The chat socket layer emits events such as message creation, editing, **unsending**, typing indicators, read receipts, and **conversation deletion**, synchronized with the REST API.
- **Bull queues** handle asynchronous work such as notification delivery and inbox processing.
- **Redis** backs token blacklisting, login lockout, cached API responses, and queue storage.

---

## Security

- Password hashing with bcrypt; JWT access/refresh token rotation with blacklisting.
- Optional TOTP two-factor authentication (otplib + QR provisioning).
- Rate limiting on sensitive endpoints (`express-rate-limit`).
- Input validation with Zod; sanitization with DOMPurify on both client and server.
- `helmet` security headers, CORS allow-list, and cookie-based token handling.
- Admin endpoints guarded by role-based middleware; content moderation pipelines for user-generated content.
- Uploaded media is validated and routed through local disk or Cloudinary with the storage configured via environment.

---

## License

Private project. See repository owner for licensing and contribution guidelines.