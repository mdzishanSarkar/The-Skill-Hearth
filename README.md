# 🔥 The Skill Hearth

> **"Connection as a byproduct of learning together, not the goal itself."**

**The Skill Hearth** is a hyperlocal skill-sharing platform designed to transform neighborhoods into living classrooms. It connects neighbors who want to teach and learn practical, everyday skills: cooking, gardening, home repair, sewing, digital literacy, and more.

By focusing on **shared practical activity**, we bridge the gap of modern isolation, allowing genuine community relationships to emerge naturally through the simple act of teaching and learning together.

[**Explore the Pilot**](https://the-skill-hearth.vercel.app) 

---

## 💡 The Philosophy

Modern life has given us unprecedented connectivity while quietly deepening our isolation. Social media multiplies our audience but rarely deepens our relationships. Online learning platforms give us access to skills but strip away the human warmth of learning side-by-side.

**The Skill Hearth is built for the gap in between:**
*   **Purpose over Performance:** A retired carpenter finds purpose mentoring a young couple; in return, they help him navigate the digital world.
*   **Low-Anxiety Socializing:** Rather than navigating the anxiety of explicit "networking," users focus on a shared task, letting connection emerge as a natural result.
*   **Local Resilience:** The platform serves as the porch light; the warmth comes from the people within the neighborhood.

---

## ✨ Key Features

### 📍 Hyperlocal Discovery
*   **Interactive Skill Map:** A geolocation-aware map (Leaflet + OpenStreetMap) with clustered pins, helping you find experts right around the corner.
*   **Skill Demand Heatmap:** A visual data layer showing what your neighborhood is eager to learn.
*   **Swap-Ready Matches:** Automatic pairing of learners and teachers with complementary skill sets.
*   **Ask the Hearth:** Natural-language skill search powered by server-side geocoding.

### 🎓 Learning & Growth
*   **Structured Mentorships:** Long-term mentor/mentee relationships with goals, check-ins, and progress tracking.
*   **Skill Journal:** A mood-tracked reflection space to log your learning journey and maintain logging streaks.
*   **Group Sessions:** Neighborhood workshops with scheduling, capacity management, and join/leave flows.
*   **Gamified Impact:** Earn XP, levels, and badges based on your community contributions and learning milestones.

### 💬 Community & Social
*   **Real-Time Messenger:** A robust chat system with typing indicators, read receipts, and media support via Socket.io.
*   **Community Showcase:** A visual feed for members to share projects—from a fixed bookshelf to a successful harvest.
*   **The Learner Board:** A localized "help wanted" space where neighbors post skill requests for others to fulfill.

---

## 🛠️ Tech Stack

### Client (Frontend)
| Layer          | Technology                                    |
| :------------- | :-------------------------------------------- |
| **Framework**  | React 19 + TypeScript (Strict)                |
| **Build Tool** | Vite + `@tailwindcss/vite` (Tailwind 4)       |
| **State**      | Zustand & TanStack Query                      |
| **Real-time**  | Socket.io-client                              |
| **Maps**       | Leaflet + OpenStreetMap                       |

### Server (Backend)
| Layer          | Technology                               |
| :------------- | :--------------------------------------- |
| **Runtime**    | Node.js + Express 5                      |
| **Database**   | MongoDB + Mongoose 9                     |
| **Cache/Queue**| Redis + Bull MQ                          |
| **Security**   | JWT (Rotation), bcryptjs, TOTP (2FA)     |
| **Payments**   | Stripe (Tipping & Promotions)            |

---

## 📂 Architecture

```text
The-Skill-Hearth/
├── client/                # React SPA (Vite + TypeScript)
│   ├── src/app/           # Application shell and routing
│   ├── src/components/    # UI components (Map, Chat, Forms, Layout)
│   ├── src/context/       # React context providers
│   ├── src/stores/        # Zustand stores for state management
│   └── src/services/      # Typed API clients
├── server/                # Express API (TypeScript)
│   ├── src/controllers/   # HTTP request handlers
│   ├── src/models/        # Mongoose schemas & logic
│   ├── src/services/      # Core business logic
│   ├── src/sockets/       # Socket.io event handlers
│   └── src/jobs/          # Bull queue workers (Notifications/Inbox)
└── docker-compose.yml     # Local MongoDB + Redis infrastructure
```

## 🚀 Getting Started

1. Prerequisites
   - Node.js 20+ and npm
   - Docker (for MongoDB and Redis)

2. Installation

   ```Bash
   # Clone the repository
   git clone https://github.com/your-username/the-skill-hearth.git
   cd the-skill-hearth

   # Install dependencies
   npm install && npm install --prefix client && npm install --prefix server
   ```

3. Environment Setup

   Copy the example environment files and fill in your credentials:

   ```Bash
   cp .env.example server/.env
   cp .env.example client/.env
   ```

   Note: The application falls back to local in-memory stores and disk storage if Cloudinary/Stripe keys are missing.

4. Run Development Environment

   ```Bash
   # Start MongoDB & Redis
   docker compose up -d

   # Start both Client and Server
   npm run dev
   ```

## 🌐 Deployment

| Service   | Platform | URL                                    |
| --------- | -------- | -------------------------------------- |
| Frontend  | Vercel   | https://the-skill-hearth.vercel.app    |
| Backend   | Render   | https://the-skill-hearth.onrender.com  |

Important Note for Deployment: Render restricts outbound SMTP (Port 587). This project is pre-configured to use Resend via HTTPS for all transactional emails (verification, password resets) to ensure high deliverability.

## 🛡️ Security & Governance

- Identity Verification: A manual admin-review pipeline for National ID/Passport verification to ensure community trust.
- Moderation: Automated text moderation and a reporting queue for user-generated content.
- Privacy: Geolocation data is obfuscated on public maps to protect user residence privacy.
- 2FA: Optional TOTP (Google Authenticator) support for account security.

## 📝 License

Private Project. All rights reserved.

For licensing inquiries or to pilot The Skill Hearth in your city, please contact the repository owner.

Built with ❤️ to foster community through the joy of learning.