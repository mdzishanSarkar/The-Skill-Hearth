# The Skill Hearth

> **Connection as a byproduct of learning together, not the goal itself.**

The Skill Hearth is a **hyperlocal skill-sharing platform** that connects neighbors who want to teach and learn practical, everyday skills: cooking, gardening, home repair, sewing, digital literacy, and more. It transforms a neighborhood into a living classroom where people meet, grow, and build lasting relationships through the simple act of teaching and learning together.

---

## Why We Built This

Modern life has given us unprecedented connectivity while quietly deepening our isolation. Social media multiplies our audience but rarely deepens our relationships. Online learning platforms give us access to any skill but strip away the human warmth of learning side by side. And the informal "third places" where genuine community once formed naturally are disappearing from our cities and towns.

The result is a widening gap: platforms exist for talking, and platforms exist for learning, but none use *doing together* as the engine for genuine, low-pressure, local connection. There is no tool that says, "Let's meet up and I'll show you how to bake my grandmother's pie," and makes that interaction feel as natural as it sounds.

The Skill Hearth is built for that gap. Rather than asking users to perform for an audience or navigate the anxiety of explicit networking, it starts with a shared task, a skill to teach or learn, and lets connection emerge as the natural result. A retired carpenter finds purpose mentoring a young couple building their first bookshelf. In return, they help him navigate the digital world. The platform is the porch light; the warmth comes from the people.

Our pilot goal is to design, develop, and deploy a fully functional web application for a single city, validate that shared practical activity reliably leads to genuine local relationships, and use that evidence to build further.

---

## Key Features

### Discovery and Matching

- **Skill map** - Interactive map (Leaflet + OpenStreetMap) with clustered skill pins, geolocation-aware, defaulting to the user's location (Dhaka by default).
- **Browse skills** - Searchable, filterable catalog of nearby teach and learn skills.
- **My Radar** - Personalized skill alerts based on interests and location.
- **Skill demand heatmap** - Visual representation of which skills are most in demand across the neighborhood.
- **Swap-ready matches** - Automatic pairing of learners and teachers with complementary skills.
- **Saved searches** - Persist and revisit discovery queries.
- **Ask the Hearth** - Natural-language skill search powered by server-side geocoding and text matching.

### Learning and Growth

- **Connections and sessions** - Request, schedule, complete, and review skill sessions.
- **Courses** - Structured multi-session courses with enrollment and progress tracking.
- **Group sessions** - Neighborhood group learning with scheduling, capacity, and join/leave flows.
- **Challenges** - Goal-based skill challenges with badges, participants, and leaderboards.
- **Mentorships** - Long-term mentor/mentee relationships with goals, check-ins, and completion tracking.
- **Skill journal** - Mood-tracked reflections tied to sessions, with a logging streak.
- **Gamification** - XP, levels, badges, streaks, and global/local leaderboards.
- **Impact and reviews** - Impact dashboard (sessions taught, learners helped, neighborhoods reached) and a rating/review system.

### Community and Social

- **Community board** - Neighborhood-scoped posts with up/down voting and moderation via reporting.
- **Learner board** - Learners post requests; teachers offer to help.
- **Feed** - Activity feed with emoji reactions, pagination, and visibility controls.
- **Friends** - Friend requests, close friends, and friendship tiers.
- **Messenger** - Real-time private chat with typing indicators, read receipts, message editing, unsend, and delete conversation flows (single-page messenger at `/messages`).
- **Showcase** - Community members share skill projects with media and likes.
- **Skill bundles** - Curated multi-skill learning paths with community voting.
- **Skill suggestions** - Community-submitted skill taxonomy proposals with voting and admin review.

### Platform and Administration

- **Authentication and account security** - Email verification, JWT access/refresh tokens, password reset, OAuth, and optional TOTP two-factor authentication.
- **Notifications** - In-app notification center with unread badges and real-time pushes.
- **Calendar integrations** - Connect external calendars, sync sessions, and manage block-out dates.
- **Billing** - Stripe-powered tipping and skill promotion.
- **Bots and integrations** - Installable bots with slash-command support.
- **Content moderation** - Automated text moderation, report queues, and admin resolution workflows.
- **Admin panel** - User management, moderation stats, and report resolution.
- **Public API** - Opt-in API keys, webhook delivery, and public platform stats.
- **PWA** - Installable client with offline-capable service worker support.

---

## Architecture

```
The-Skill-Hearth/
├── client/                React SPA (Vite + TypeScript)
│   └── src/
│       ├── app/           Application shell and routing
│       ├── components/    UI components (auth, chat, community, forms, layout, map, ...)
│       ├── context/       React context providers
│       ├── hooks/         Shared React hooks (auth, geolocation, sockets, notifications)
│       ├── pages/         Route-level pages (public, private, and admin)
│       ├── services/      Typed API clients
│       ├── stores/        Zustand stores (messenger, chat settings)
│       ├── types/         Shared domain types
│       └── utils/         Helpers (media, toast, journal, etc.)
│
├── server/                Express API (TypeScript)
│   └── src/
│       ├── config/        Infrastructure wiring (DB, Redis, Stripe, Cloudinary, Socket.io)
│       ├── controllers/   HTTP request handlers
│       ├── middleware/    Auth, validation, uploads, error handling
│       ├── models/        Mongoose schemas
│       ├── routes/        Feature route groups
│       ├── services/      Business logic
│       ├── sockets/       Socket.io event handlers
│       ├── jobs/          Bull queue workers
│       ├── utils/         Shared helpers
│       └── scripts/       Seed and maintenance scripts
│
├── shared/                Future monorepo shared types
├── docker-compose.yml     Local MongoDB + Redis
└── .env.example           Reference environment configuration
```

### Request Flow

The client is a single-page application backed by a typed service layer. The server exposes a REST API (`/api/*`) for CRUD operations and a Socket.io layer for real-time features (messenger, notifications, presence). The Socket and REST layers share the same service layer, ensuring business rules are enforced consistently regardless of transport.

---

## Tech Stack

### Client

| Layer          | Technology                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Framework      | React 19 + TypeScript (strict)                                          |
| Build          | Vite, `@tailwindcss/vite` (Tailwind CSS 4)                              |
| Routing        | React Router 7                                                          |
| State          | Zustand (client/feature stores), TanStack Query                         |
| Real-time      | socket.io-client                                                        |
| Maps           | Leaflet + `react-leaflet` + marker clustering                           |
| UI / Utilities | react-icons, clsx, date-fns, framer-motion, react-window, DOMPurify     |
| Data Fetching  | Axios                                                                   |
| PWA            | vite-plugin-pwa                                                         |

### Server

| Layer        | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| Runtime      | Node.js + TypeScript                                                     |
| HTTP         | Express 5 (helmet, cors, cookie-parser, express-rate-limit)              |
| Database     | MongoDB + Mongoose 9                                                     |
| Cache/Queue  | Redis (sessions, token blacklist, login lockout, Bull queues)            |
| Real-time    | Socket.io                                                                |
| Auth         | JWT (access/refresh), bcryptjs, OTP (otplib + qrcode)                   |
| Validation   | Zod                                                                      |
| Uploads      | Multer (local disk or Cloudinary)                                        |
| Email        | Nodemailer (SMTP)                                                        |
| Payments     | Stripe (tipping, skill promotion)                                        |
| Jobs         | Bull (notifications, inbox services)                                     |

### Infrastructure

| Component | Purpose                                               |
| --------- | ----------------------------------------------------- |
| MongoDB   | Primary data store (via Docker)                       |
| Redis     | Caching, token blacklist, Bull queues (via Docker)    |
| Docker    | Local development infrastructure (`docker compose up`)|

---

## Getting Started

### Prerequisites

- Node.js 20 or higher, and npm
- Docker (for MongoDB and Redis)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url> The-Skill-Hearth
cd The-Skill-Hearth
```

### 2. Configure Environment Variables

```bash
cp .env.example server/.env   # fill in real values
cp .env.example client/.env   # only VITE_API_URL is required for the client
```

See the [Environment Variables](#environment-variables) section below for a full reference.

### 3. Start Local Infrastructure

```bash
docker compose up -d          # MongoDB on :27017, Redis on :6379
```

### 4. Install Dependencies

```bash
npm install                    # root (concurrently)
npm install --prefix client
npm install --prefix server
```

### 5. Start the Development Servers

```bash
npm run dev                    # runs the API (:5000) and the SPA (:5173) concurrently
```

| Service | URL                    |
| ------- | ---------------------- |
| Client  | http://localhost:5173  |
| Server  | http://localhost:5000  |

### 6. Seed Demo Data (Optional)

```bash
npm run seed:all --prefix server          # general demo data
npm run seed:map-skills --prefix server   # map skill pins
```

---

## Scripts

| Command                                       | Description                                    |
| --------------------------------------------- | ---------------------------------------------- |
| `npm run dev`                                 | Run client and server concurrently             |
| `npm run dev --prefix client`                 | Client only (Vite on :5173)                    |
| `npm run dev --prefix server`                 | Server only (tsx watch on :5000)               |
| `npm run build --prefix client`               | Typecheck (`tsc -b`) and Vite production build |
| `npm run build --prefix server`               | TypeScript build to `server/dist`              |
| `npm run start --prefix server`               | Serve the built server (`node dist/server.js`) |
| `npm run lint --prefix client`                | Lint the client (oxlint)                       |
| `npm run seed:all --prefix server`            | Seed general demo data                         |
| `npm run seed:map-skills --prefix server`     | Seed map skill pins                            |

---

## Environment Variables

Reference: `.env.example`

| Variable                  | Used by | Purpose                                                    |
| ------------------------- | ------- | ---------------------------------------------------------- |
| `PORT`                    | Server  | API listen port (default `5000`)                           |
| `NODE_ENV`                | Server  | Runtime environment                                        |
| `CLIENT_URL`              | Server  | Allowed CORS origins (comma-separated)                     |
| `SITE_URL`                | Server  | Canonical site URL (used in email links, etc.)             |
| `MONGODB_URI`             | Server  | MongoDB connection string                                  |
| `JWT_SECRET`              | Server  | Signing secret for access and refresh tokens               |
| `ADMIN_SIGNUP_CODE`       | Server  | Required code to register an admin account                 |
| `REDIS_URL`               | Server  | Redis connection (token blacklist, queues, caching)        |
| `SMTP_HOST` / `SMTP_PORT` | Server  | SMTP host and port for transactional email                 |
| `SMTP_USER` / `SMTP_PASS` | Server  | SMTP credentials (Gmail App Password recommended)          |
| `EMAIL_FROM`              | Server  | From-address for outbound email                            |
| `CLOUDINARY_*`            | Server  | Cloudinary credentials (avatar and media uploads)          |
| `STRIPE_SECRET_KEY`       | Server  | Stripe secret key (tipping and promotions)                 |
| `VITE_API_URL`            | Client  | Base URL of the API (`http://localhost:5000/api`)          |

> When `REDIS_URL`, Cloudinary, or Stripe credentials are not configured, the server falls back to local equivalents: MongoDB/in-memory stores, local disk uploads, and disabled billing. The application remains fully functional in development without these services.

---

## Feature Modules

The server is organized into feature-scoped routes, each with a corresponding controller, service, and (where applicable) Mongoose model:

| Domain        | Routes / Modules                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Accounts      | `auth`, `oauth`, `users`, `twoFactor`                                                                 |
| Discovery     | `skills`, `search`, `discovery`, `discoveryEnhanced`, `skillRadar`, `skillDemand`, `savedSearches`    |
| Learning      | `sessions`, `connections`, `courses`, `groupSessions`, `challenges`, `mentorships`, `journal`         |
| Social        | `friends`, `feed`, `community`, `reviews`, `endorsements`, `showcase`, `bundles`, `suggestions`       |
| Messaging     | `messages`, `messenger`, `dms`, `conversations`, `messageEnhanced`                                    |
| Notifications | `notifications`, `inbox` (Bull-backed queue)                                                          |
| Commerce      | `billing` (Stripe), `swaps`, `swapReadyMatches`                                                       |
| Integrations  | `calendars`, `blockOutDates`, `bots`, `webhooks`, `apiPublic`                                         |
| Governance    | `reports`, `contentModeration`, `moderation`, `admin`                                                 |

---

## Real-Time and Background Processing

**Socket.io** powers the messenger and presence features. The chat socket layer emits events for message creation, editing, unsending, typing indicators, read receipts, and conversation deletion, all synchronized with the REST API.

**Bull queues** handle asynchronous work such as notification delivery and inbox processing.

**Redis** backs token blacklisting, login lockout, cached API responses, and queue storage.

---

## Security

- Password hashing with bcrypt; JWT access/refresh token rotation with Redis-backed blacklisting.
- Optional TOTP two-factor authentication via otplib with QR provisioning.
- Rate limiting on sensitive endpoints using `express-rate-limit`.
- Input validation with Zod; client-side sanitization with DOMPurify.
- `helmet` security headers, CORS allow-list, and cookie-based token handling.
- Admin endpoints guarded by role-based middleware; content moderation pipelines for all user-generated content.
- Uploaded media is validated and routed through local disk or Cloudinary based on environment configuration.

---

## License

Private project. All rights reserved. Contact the repository owner for licensing and contribution guidelines.