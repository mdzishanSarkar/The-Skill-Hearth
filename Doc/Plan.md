A hyperlocal skill-sharing platform that fights two problems at once: loneliness and the loss of everyday practical skills (cooking, gardening, repairs, sewing, digital literacy, etc.). Instead of asking "who are you?" like typical social apps, it starts with "what can you teach/learn?" — connection becomes a byproduct of doing something together, not the explicit goal.

This pivot to web (your actual stack: React/Node/Express/Mongo/TS) makes sense for scope/cost — no app store friction, and Leaflet+OSM avoids Google Maps API billing.
Three user roles: Guest, Registered User, Admin/Moderator

Core modules:
Auth (JWT-based)
Skill management (add skills to teach/learn, browse/filter)
Discovery (map-based, hyperlocal search)
Connection (skill requests → accept/reject → chat)
Interaction (in-app chat via Socket.io, ratings/reviews after sessions)
Trust & Safety (reporting, moderation dashboard, reviews), # Complete Feature List: Hyperlocal Skill-Sharing Platform

## Product Vision Statement

> _"Connection as a byproduct of learning together — not the goal itself."_

---

## Architecture Overview

text

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│         React + TypeScript + Tailwind CSS                │
│    Leaflet/OSM │ Socket.io-client │ React Query          │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / WSS
┌─────────────────────────▼───────────────────────────────┐
│                     API LAYER                            │
│              Node.js + Express + TypeScript              │
│         JWT Auth │ Socket.io │ Multer │ Zod              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   DATA LAYER                             │
│                MongoDB + Mongoose                        │
│         Redis (sessions/cache) │ Cloudinary (media)      │
└─────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions Matrix

|Feature|Guest|Registered User|Admin/Moderator|
|---|---|---|---|
|Browse skill listings|✅ Read-only|✅ Full|✅ Full|
|View map discovery|✅ Blurred radius|✅ Full|✅ Full|
|Create skill profile|❌|✅|✅|
|Send skill requests|❌|✅|✅|
|Chat|❌|✅|✅|
|Leave reviews|❌|✅|✅|
|Report content/users|❌|✅|✅|
|Moderation dashboard|❌|❌|✅|
|Ban/suspend users|❌|❌|✅|
|Manage skill taxonomy|❌|❌|✅|

---

## MVP — Minimum Viable Product

> **Goal:** Prove the core loop works.  
> **Core loop:** `Register → Add Skills → Discover Nearby → Request → Chat → Review`

---

### Module 1: Authentication & User Identity

#### 1.1 Registration & Login

- [ ]  **Email + password registration** with email verification flow
    - Send verification link via Nodemailer
    - Block login until verified
    - Resend verification email (rate-limited: 3/hour)
- [ ]  **JWT authentication**
    - Access token: 15-minute expiry
    - Refresh token: 7-day expiry, stored in httpOnly cookie
    - Token rotation on each refresh
    - Token blacklist on logout (Redis set)
- [ ]  **Login with email/password**
    - Brute force protection: lockout after 5 failed attempts (15-min window)
    - Generic error messages (no user enumeration)
- [ ]  **Logout**
    - Invalidate refresh token
    - Clear httpOnly cookie
- [ ]  **Password reset flow**
    - Request reset → email link (expires in 1 hour)
    - One-time use token (invalidated after use)
    - Confirm new password field

#### 1.2 User Profile — Onboarding

- [ ]  **"What can you teach/learn?" onboarding screen** (not "who are you?")
    - Step 1: Select skills to teach (min: 1, max: 10)
    - Step 2: Select skills to learn (min: 1, max: 10)
    - Step 3: Set neighborhood/location radius preference
    - Step 4: Upload avatar (optional, default generated avatar)
- [ ]  **Profile fields**
    - Display name (not real name — privacy first)
    - Short bio (max 280 chars — skill-focused prompt: "What's your story with these skills?")
    - Avatar upload (Cloudinary, max 2MB, auto-resized to 200x200)
    - Location (city + neighborhood — never exact address)
    - Discovery radius preference (1km / 3km / 5km / 10km)
    - Availability tags (Weekday mornings / Evenings / Weekends)
- [ ]  **Profile edit** (all fields editable post-onboarding)
- [ ]  **Public profile view** (visible to registered users)
    - Skills teaching/learning
    - Reviews received
    - Member since date
    - Session count (gamification-lite)

#### 1.3 Guest Experience

- [ ]  **Browse mode** — skill listings visible without login
- [ ]  **Map view** — visible but user pins blurred/anonymized
- [ ]  **CTA prompts** — "Join to connect with [Name] about [Skill]"
- [ ]  **SEO-friendly public skill pages** (server-side rendered or pre-rendered)

---

### Module 2: Skill Management

#### 2.1 Skill Taxonomy

- [ ]  **Predefined skill categories** (seeded by admin)
    
    text
    
    ```
    Categories (MVP):
    ├── Food & Cooking
    │   ├── Baking
    │   ├── Fermentation & Preserving
    │   ├── Knife Skills
    │   └── Meal Prep
    ├── Home & Garden
    │   ├── Basic Plumbing
    │   ├── Vegetable Gardening
    │   ├── Composting
    │   └── Basic Electrical
    ├── Textile & Craft
    │   ├── Sewing & Mending
    │   ├── Knitting / Crochet
    │   └── Upcycling
    ├── Digital Literacy
    │   ├── Smartphone Basics
    │   ├── Email & Video Calls
    │   └── Online Safety
    └── Languages & Communication
        ├── Conversational Language Practice
        └── Writing & Reading
    ```
    
- [ ]  **Skill cards** with:
    - Skill name + category
    - Self-described proficiency level (Beginner / Intermediate / Advanced — for teachers: experience level)
    - "My story with this skill" text (max 500 chars)
    - Preferred session format (In-person / Online / Either)
    - Preferred session length (30min / 1hr / 2hr+)

#### 2.2 Skill CRUD

- [ ]  **Add skill to "I can teach"** — from taxonomy + free-text description
- [ ]  **Add skill to "I want to learn"** — from taxonomy
- [ ]  **Edit skill listing** (update description, availability, format)
- [ ]  **Delete/hide skill** (soft delete — data retained for review history integrity)
- [ ]  **Toggle skill active/inactive** (pause without deleting)

#### 2.3 Skill Browsing & Filtering
- [ ]  **Skill listing page** (grid/list toggle)
    - Filter by: Category, Format (in-person/online), Availability, Distance
    - Sort by: Newest, Most reviewed, Closest
    - Pagination (20 per page) or infinite scroll
- [ ]  **Skill detail page**
    - Teacher's public profile preview
    - Skill description + format + availability
    - "Request a Session" CTA
    - Reviews specific to this skill
- [ ]  **Search** — full-text search across skill names and descriptions
    - MongoDB text index on skills collection
    - Debounced input (300ms)

---

### Module 3: Discovery (Map-Based, Hyperlocal)

#### 3.1 Map Interface

- [ ]  **Leaflet + OpenStreetMap** base map
- [ ]  **Skill pins/markers** showing teachers nearby
    - Clustered markers (Leaflet.markercluster) at zoom-out
    - Individual pins at zoom-in
    - Pin popup: Avatar (blurred for guests) + Display name + Skill tags + "View Profile" button
- [ ]  **Location handling**
    - Ask browser geolocation permission with explanation ("We use this to show skills near you — your exact location is never stored or shown to others")
    - Fallback: city/neighborhood text input if permission denied
    - Store only: city, neighborhood, lat/lng snapped to ~200m grid (privacy-preserving)
- [ ]  **Radius filter slider** (1km – 20km)
- [ ]  **Filter panel** (overlapping map sidebar)
    - Skill category checkboxes
    - Teaching/Learning toggle
    - Availability filter
- [ ]  **"Near Me" default view** centered on user location
- [ ]  **Search by neighborhood/city** (geocoding via Nominatim/OSM — free)

#### 3.2 Location Privacy

- [ ]  Exact coordinates never exposed in API responses
- [ ]  Distance shown as approximate ("~2km away") — calculated server-side
- [ ]  User pins shown at neighborhood centroid, not exact location
- [ ]  Opt-out of map visibility entirely (list-only mode)

---

### Module 4: Connection (Skill Request Flow)

#### 4.1 Skill Request

- [ ]  **Send skill request** from skill detail page or profile
    - Select: skill being requested
    - Message: introduce yourself + what you hope to learn (max 500 chars)
    - Proposed format: In-person / Online
    - Cannot send request to self
    - Cannot send duplicate pending request (debounced, checked server-side)
- [ ]  **Request states**
    
    text
    
    ```
    PENDING → ACCEPTED → COMPLETED
    PENDING → REJECTED
    PENDING → WITHDRAWN (by requester)
    ACCEPTED → CANCELLED (by either party)
    ```
    
- [ ]  **Request inbox** — teacher sees incoming requests
    - List view: requester name + skill + message preview + timestamp
    - Accept / Reject actions with optional short response message
- [ ]  **Request outbox** — requester sees sent requests and status
- [ ]  **Notifications** (in-app bell icon, MVP: no email)
    - New request received
    - Request accepted
    - Request rejected
    - New chat message

#### 4.2 Post-Acceptance Flow

- [ ]  **Chat unlocked** only after request accepted
- [ ]  **Session scheduling prompt** in chat (simple text — no calendar integration in MVP)
- [ ]  **Mark session as completed** button (either party can trigger)
    - Triggers review prompt for both parties
- [ ]  **Cancel connection** (either party) — returns to pre-accepted state, chat locked

---

### Module 5: In-App Chat (Socket.io)

#### 5.1 Real-Time Messaging

- [ ]  **Socket.io** server-side with rooms per connection pair
    - Room ID: `chat_${connectionId}` (deterministic, not guessable)
    - Authentication middleware on Socket.io handshake (JWT verification)
    - Only participants of a connection can join its room
- [ ]  **Message features**
    - Text messages (max 1000 chars)
    - Real-time delivery indicator (sent/delivered)
    - Read receipts (seen timestamp)
    - Typing indicator ("Sarah is typing...")
- [ ]  **Message persistence** — stored in MongoDB
    - Fetch chat history on room join (last 50 messages, paginated)
- [ ]  **Offline handling**
    - Messages stored and delivered on reconnect
    - Unread message count in inbox badge

#### 5.2 Chat UI

- [ ]  **Chat list** — all active conversations, sorted by last message
- [ ]  **Chat window** — standard messaging UI
    - Bubble layout (own messages right, other left)
    - Timestamp on each message
    - Date separators
    - Auto-scroll to bottom on new message
    - Scroll-up to load older messages
- [ ]  **Report message** button per message (flags for moderation)

#### 5.3 Chat Data Model

```TypeScript
// Message Schema
interface Message {
  _id: ObjectId;
  connectionId: ObjectId;     // reference to Connection
  senderId: ObjectId;         // reference to User
  content: string;            // encrypted at rest (Phase 2)
  type: 'text';               // Phase 2: 'image' | 'system'
  readAt?: Date;
  reportedAt?: Date;
  createdAt: Date;
}
```

---

### Module 6: Ratings & Reviews

#### 6.1 Post-Session Review

- [ ]  **Review prompt** triggered when session marked complete
    - Both parties prompted independently
    - 7-day window to leave review (after that, prompt dismissed)
- [ ]  **Review fields**
    - Star rating: 1–5 (integer only)
    - Written review: max 500 chars
    - Skill-specific tags (e.g., "Patient teacher", "Well-prepared", "Great listener", "Practical tips")
    - Would you recommend this person? Yes / No
- [ ]  **Review display**
    - On public profile: star average + count + last 5 reviews
    - On skill card: relevant reviews for that skill
- [ ]  **Review constraints**
    - One review per completed session per direction (teacher reviews learner, learner reviews teacher)
    - Cannot review without completed session (integrity gate)
    - Cannot edit after 24 hours
    - Reviews visible to all registered users

#### 6.2 Rating Aggregation
- [ ]  Average rating calculated and stored on User document (denormalized for query performance)
- [ ]  Recalculated on new review submission (background job or synchronous in MVP)
- [ ]  "Not enough reviews yet" display threshold (< 3 reviews)

---

### Module 7: Trust & Safety (MVP Baseline)

#### 7.1 Reporting

- [ ]  **Report user** (from profile page)
    - Reason categories: Harassment / Inappropriate content / Spam / Fake profile / No-show / Other
    - Optional description (max 300 chars)
- [ ]  **Report message** (from chat)
    - Same reason categories
    - Captures message ID + context (5 messages before/after)
- [ ]  **Report skill listing** (from skill detail page)
    - Reason: Misleading / Inappropriate / Spam

#### 7.2 Admin/Moderator Dashboard (MVP)

- [ ]  **Reports queue**
    - List of open reports sorted by severity/date
    - View reported content in context
    - Assign to self (basic workflow)
- [ ]  **Actions on users**
    - Warn user (sends system notification)
    - Suspend account (temporary, set duration)
    - Ban account (permanent)
- [ ]  **Actions on content**
    - Remove skill listing
    - Remove review
    - Delete message(s)
- [ ]  **Basic stats panel**
    - Total users / skills / sessions / reports this week
- [ ]  **User lookup** by email or display name

---

### MVP Data Models (TypeScript/Mongoose)


```TypeScript
// ─── USER ───────────────────────────────────────────────
interface IUser {
  _id: ObjectId;
  email: string;                    // unique, indexed
  passwordHash: string;
  displayName: string;              // unique
  bio: string;                      // max 280 chars
  avatar: string;                   // Cloudinary URL
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  
  // Location — privacy-preserving
  location: {
    city: string;
    neighborhood: string;
    coordinates: [number, number];  // [lng, lat] — snapped to grid
    radiusPreference: number;       // km
  };
  
  availability: AvailabilitySlot[];
  
  // Aggregated stats (denormalized)
  stats: {
    sessionsCompleted: number;
    averageRating: number;
    reviewCount: number;
  };
  
  isEmailVerified: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SKILL ──────────────────────────────────────────────
interface ISkill {
  _id: ObjectId;
  userId: ObjectId;                 // ref: User
  type: 'teach' | 'learn';
  category: string;                 // from taxonomy
  name: string;                     // from taxonomy or custom
  description: string;              // max 500 chars
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
  format: 'in-person' | 'online' | 'either';
  sessionLength: '30min' | '1hr' | '2hr+';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── CONNECTION ─────────────────────────────────────────
interface IConnection {
  _id: ObjectId;
  requesterId: ObjectId;            // ref: User (learner)
  teacherId: ObjectId;              // ref: User (teacher)
  skillId: ObjectId;                // ref: Skill
  status: 'pending' | 'accepted' | 'rejected' 
        | 'completed' | 'withdrawn' | 'cancelled';
  message: string;                  // initial request message
  responseMessage?: string;         // accept/reject note
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── MESSAGE ────────────────────────────────────────────
interface IMessage {
  _id: ObjectId;
  connectionId: ObjectId;           // ref: Connection
  senderId: ObjectId;               // ref: User
  content: string;
  readAt?: Date;
  isReported: boolean;
  createdAt: Date;
}

// ─── REVIEW ─────────────────────────────────────────────
interface IReview {
  _id: ObjectId;
  connectionId: ObjectId;           // ref: Connection (unique per direction)
  reviewerId: ObjectId;             // ref: User
  revieweeId: ObjectId;             // ref: User
  skillId: ObjectId;                // ref: Skill
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: string[];
  wouldRecommend: boolean;
  createdAt: Date;
}

// ─── REPORT ─────────────────────────────────────────────
interface IReport {
  _id: ObjectId;
  reporterId: ObjectId;             // ref: User
  targetType: 'user' | 'skill' | 'message' | 'review';
  targetId: ObjectId;
  reason: 'harassment' | 'inappropriate' | 'spam' 
        | 'fake' | 'no-show' | 'misleading' | 'other';
  description?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  assignedTo?: ObjectId;            // ref: User (moderator)
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── NOTIFICATION ───────────────────────────────────────
interface INotification {
  _id: ObjectId;
  userId: ObjectId;                 // recipient
  type: 'request_received' | 'request_accepted' 
      | 'request_rejected' | 'new_message' 
      | 'review_prompt' | 'system_warning';
  referenceId?: ObjectId;           // connection/message/etc
  message: string;
  isRead: boolean;
  createdAt: Date;
}
```

---

### MVP API Endpoints

text

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/verify-email/:token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

USERS
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id           (public profile)
POST   /api/users/:id/report

SKILLS
GET    /api/skills              (browse + filter + search)
POST   /api/skills
GET    /api/skills/:id
PUT    /api/skills/:id
DELETE /api/skills/:id
GET    /api/skills/categories   (taxonomy)

DISCOVERY
GET    /api/discovery/map       (returns pins within bbox/radius)
GET    /api/discovery/nearby    (list view, paginated)

CONNECTIONS
POST   /api/connections                     (send request)
GET    /api/connections/inbox              (received)
GET    /api/connections/outbox             (sent)
PUT    /api/connections/:id/accept
PUT    /api/connections/:id/reject
PUT    /api/connections/:id/withdraw
PUT    /api/connections/:id/complete
PUT    /api/connections/:id/cancel

MESSAGES
GET    /api/messages/:connectionId         (history, paginated)
POST   /api/messages/:connectionId/report  (report a message)
[Real-time via Socket.io events]

REVIEWS
POST   /api/reviews
GET    /api/reviews/user/:userId
GET    /api/reviews/skill/:skillId

NOTIFICATIONS
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

ADMIN
GET    /api/admin/reports
GET    /api/admin/reports/:id
PUT    /api/admin/reports/:id/assign
PUT    /api/admin/reports/:id/resolve
PUT    /api/admin/users/:id/warn
PUT    /api/admin/users/:id/suspend
PUT    /api/admin/users/:id/ban
DELETE /api/admin/skills/:id
DELETE /api/admin/reviews/:id
GET    /api/admin/stats
```

---

## Phase 2 Features

> **Goal:** Improve retention, trust, safety, and discovery quality.  
> **Trigger:** Launch metrics show core loop working — users completing sessions and returning.

---

### Module 8: Enhanced Authentication & Identity

- [ ]  **OAuth login** — Google + Apple (Passport.js strategies)
    - Link multiple auth methods to one account
- [ ]  **Two-factor authentication**  (TOTP via authenticator app)
    - Optional but rewarded (trust badge on profile)
- [ ]  **Profile completeness score**  — gamified prompt to complete profile
- [ ]  **Account deletion** with GDPR data export

---

### Module 9: Advanced Skill Features

- [ ]  **User-submitted skill suggestions** — propose new skills/categories
    - Admin approval workflow
    - Voting on suggested skills (community-driven taxonomy growth)
- [ ]  **Skill bundles / learning paths**
    - e.g., "Home Repair Basics" bundles: basic plumbing + electrical + carpentry
    - Admin-curated or community-suggested
- [ ]  **Skill endorsements** — other users can endorse your teaching skills (LinkedIn-style, limited to people you've connected with)
- [ ]  **"Teach & Learn" pairing** — system suggests mutual swaps
    - User A teaches Baking, wants to learn Spanish
    - User B teaches Spanish, wants to learn Baking
    - System surfaces "Skill Swap" suggestion for both
- [ ]  **Skill media attachments**
    - Add photos to skill listing (e.g., garden photos, baked goods)
    - Max 5 images per skill, Cloudinary upload
- [ ]  **Availability calendar** (structured)
    - Weekly recurring slots (e.g., "Every Tuesday 6–8pm")
    - Block-out dates
    - Visible on profile for scheduling reference

---

### Module 10: Enhanced Discovery

- [ ]  **Neighborhood/community pages**
    - Auto-generated page per city/neighborhood with active skills
    - SEO value: "Skills to learn in [Neighborhood]"
- [ ]  **"Looking for teacher" board** — learners can post requests publicly
    - Teachers browse and offer to help
    - Reverse discovery (not just teacher-to-learner)
- [ ]  **Smart matching suggestions**
    - "People near you who teach what you want to learn"
    - Served as weekly digest or in-app recommendation panel
    - Algorithm: location radius + skill match + availability overlap + rating
- [ ]  **Saved searches / alerts**
    - Save a filter combination
    - Get notified when a new matching skill is posted
- [ ]  **Advanced map features**
    - Filter map by availability (show only weekend teachers)
    - Heatmap mode showing skill density by neighborhood
    - "View in list" / "View on map" seamless toggle with shared state

---

### Module 11: Enhanced Communication

- [ ]  **Image sharing in chat**
    - Share photos during session coordination (e.g., "here's what my garden looks like")
    - Cloudinary upload, moderation scan on upload
- [ ]  **System messages in chat**
    - "Session marked complete — leave a review!"
    - "Your session request was accepted"
- [ ]  **Message reactions** (emoji, limited set: 👍 ❤️ 😄 🙏)
- [ ]  **Email notifications** (opt-in)
    - New request received
    - Request accepted
    - New chat message (digest: max 1 email/day)
    - "You have a pending review"
- [ ]  **Push notifications** (PWA web push)
    - New message, request updates
- [ ]  **Chat message search** within a conversation

---

### Module 12: Session Management

- [ ]  **Session scheduling integration**
    - In-chat calendar picker for proposing meeting times
    - Both parties confirm time
    - iCal/Google Calendar export (.ics file)
- [ ]  **Session types formalization**
    - Single session
    - Recurring series (e.g., weekly for 4 weeks)
- [ ]  **Session notes** (private, per-user)
    - Note-taking field per connection for personal session prep
- [ ]  **No-show handling**
    - Either party can mark "session didn't happen"
    - Prompt to reschedule or cancel
    - Repeated no-show patterns flagged for moderation

---

### Module 13: Community & Groups

- [ ]  **Community boards** (per neighborhood)
    - Text posts: "Looking for a bread-baking buddy in Shoreditch"
    - No external links in MVP community (spam prevention)
    - Upvote/downvote posts
- [ ]  **Group skill sessions**
    - One teacher, up to 5 learners
    - Teacher opens a "group session slot"
    - Learners request to join (up to capacity)
    - Group chat for all participants
- [ ]  **Events/workshops**
    - Community skill events (free only in Phase 2)
    - Admin-promoted events surfaced on discovery map

---

### Module 14: Trust & Safety — Enhanced

- [ ]  **AI-assisted content moderation** (OpenAI Moderation API — free tier)
    - Auto-flag messages containing hate speech, personal info sharing, etc.
    - Auto-flag skill descriptions with policy violations
    - Human review of flagged content (not auto-remove)
- [ ]  **Two-sided accountability for no-shows**
    - Track and surface patterns in moderation dashboard
- [ ]  **Verified Skills badges** (admin can verify specific skill claims for professionals)
- [ ]  **Shadow ban capability** — user sees their own content, others don't
- [ ]  **Block user** — mutual: blocked user cannot view profile or send requests
- [ ]  **Automated suspicious activity detection**
    - Account age < 24hr + 10+ requests sent = flag for review
    - Multiple reports within 48hr = auto-suspend pending review

---

### Phase 2 Additional Data Models

```TypeScript
// ─── SKILL SWAP ─────────────────────────────────────────
interface ISkillSwap {
  _id: ObjectId;
  userAId: ObjectId;
  userBId: ObjectId;
  userATeachesSkillId: ObjectId;
  userBTeachesSkillId: ObjectId;
  status: 'suggested' | 'accepted' | 'declined';
  createdAt: Date;
}

// ─── GROUP SESSION ───────────────────────────────────────
interface IGroupSession {
  _id: ObjectId;
  teacherId: ObjectId;
  skillId: ObjectId;
  title: string;
  description: string;
  maxParticipants: number;          // max 5 MVP
  participants: ObjectId[];
  scheduledAt?: Date;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  chatRoomId: string;               // Socket.io room
  createdAt: Date;
}

// ─── SAVED SEARCH ────────────────────────────────────────
interface ISavedSearch {
  _id: ObjectId;
  userId: ObjectId;
  filters: {
    category?: string;
    format?: string;
    radius?: number;
    availability?: string[];
  };
  alertEnabled: boolean;
  lastAlertSentAt?: Date;
  createdAt: Date;
}
```

---

## Phase 3 Features

> **Goal:**  Scale, ecosystem expansion.  
> **Trigger:**  Demonstrated retention, geographic spread, community health metrics.

---

### Module 16: Scale & Performance

- [ ]  **Redis caching layer**
    - Cache skill listings (5-minute TTL)
    - Cache discovery map results (2-minute TTL, invalidated on new skill post)
    - Session/rate limit tracking
- [ ]  **CDN for static assets** (Cloudflare)
- [ ]  **Background job queue** (Bull + Redis)
    - Email digests
    - Saved search alerts
    - Skill swap detection algorithm run
    - Review aggregation recalculation
    - Cleanup of expired tokens
- [ ]  **Horizontal scaling readiness**
    - Stateless Express servers (JWT + Redis for session state)
    - Socket.io adapter for multi-server (Redis adapter)
- [ ]  **Database optimization**
    - Geospatial index (2dsphere) on user location
    - Compound indexes on frequently filtered fields
    - Read replicas for analytics queries
- [ ]  **Rate limiting per tier**
    - Guest: 30 requests/15min
    - User: 200 requests/15min

---

### Module 17: Mobile & Offline

- [ ]  **Progressive Web App (PWA)**
    - Service worker for offline browsing of cached skills
    - App manifest for "Add to Home Screen"
    - Web push notifications (Phase 2 foundation used here fully)
- [ ]  **Responsive mobile-first redesign** — full audit pass
- [ ]  **React Native app** (if metrics justify native)
    - Share API codebase (extract shared types/validation to monorepo)
    - Expo-managed workflow initially

---

### Module 18: Advanced Community Features

- [ ]  **Skill "courses"** — structured multi-session curriculum
    - Teacher defines 3–6 session arc with learning objectives
    - Learner enrolls, progress tracked
    - Certificate of completion (PDF, shareable link)
- [ ]  **Community challenges**
    - Admin-posted: "Teach a digital literacy skill this month"
    - Gamified: badges, leaderboard per neighborhood
- [ ]  **Mentorship tracks**
    - Long-term pairing (3+ months)
    - Structured check-ins, goal setting within platform
- [ ]  **Public skill showcase**
    - Users can share "what I made/learned" posts (text + photo)
    - Community feed per neighborhood
    - Celebrates outcomes — reinforces the mission

---

### Module 19: Data, Analytics & Insights

- [ ]  **User-facing skill impact dashboard**
    - "You've shared [X] hours of skills, connected with [N] people, in [neighborhoods]"
    - Personal metrics for motivation and retention
- [ ]  **Admin analytics dashboard**
    - DAU/MAU, skill category trends, geographic growth heat map
    - Funnel analysis: register → skill add → request → session complete
    - Cohort retention analysis
    - Safety metrics: reports per week, resolution time
- [ ]  **A/B testing framework**
    - Feature flag system (LaunchDarkly or simple Redis-backed flags)
    - Experiment tracking for onboarding flow variants
- [ ]  **Data export & GDPR compliance**
    - Full user data export (JSON) on request
    - Right to deletion (cascade delete with audit log)
    - Data processing agreement for B2B orgs
- [ ]  **Skill market insights** (anonymized public data)
    - "Most wanted skills in [City]" — public page
    - "Skill gaps" data — cities with high demand, low supply
    - Hook for press/community org partnerships

---

### Module 20: Integrations & API

- [ ]  **Webhook system** — for community org integrations
    - Event triggers: session completed, new member joined
- [ ]  **Public API** (read-only, skill listings + stats)
    - Rate-limited API keys for partners
    - Could power library kiosk integrations, etc.
- [ ]  **Calendar integrations**
    - Google Calendar two-way sync
    - Outlook Calendar sync
- [ ]  **Slack/Discord bot**
    - "Find a skill teacher near [location]" slash command
    - For community orgs using Slack/Discord

---
---





---
---
# Complete REST API Endpoint Reference

## Base URL & Conventions

text

```
Base URL:        https://api.skillshare-local.com/api/v1
Content-Type:    application/json
Auth Header:     Authorization: Bearer <access_token>
Rate Limiting:   X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers on all responses
Pagination:      ?page=1&limit=20 (default), response includes meta.pagination
Timestamps:      ISO 8601 — 2025-01-15T10:30:00.000Z
Error Format:    { success: false, error: { code: string, message: string, details?: any } }
Success Format:  { success: true, data: {...}, meta?: {...} }
```

---

## Standard Response Envelopes

TypeScript

```
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",       // Machine-readable
    "message": "Email is required",   // Human-readable
    "details": [                      // Optional: field-level errors (Zod)
      { "field": "email", "message": "Required" }
    ]
  }
}
```

---

## Module 1 — Authentication

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|1.1|`POST`|`/auth/register`|❌ Guest|`{ email: string, password: string, displayName: string }`|`201` `{ message: "Verification email sent", userId: string }`|`409 EMAIL_EXISTS` `409 DISPLAY_NAME_EXISTS` `422 VALIDATION_ERROR`|
|1.2|`POST`|`/auth/login`|❌ Guest|`{ email: string, password: string }`|`200` `{ accessToken: string, user: UserPublicDTO }` + httpOnly cookie `refreshToken`|`401 INVALID_CREDENTIALS` `401 EMAIL_NOT_VERIFIED` `403 ACCOUNT_SUSPENDED` `403 ACCOUNT_BANNED` `429 ACCOUNT_LOCKED`|
|1.3|`POST`|`/auth/logout`|✅ User|`{}` (empty)|`200` `{ message: "Logged out successfully" }`|`401 UNAUTHORIZED`|
|1.4|`POST`|`/auth/refresh`|❌ Cookie|`{}` (reads httpOnly cookie)|`200` `{ accessToken: string }` + rotated httpOnly cookie|`401 REFRESH_TOKEN_INVALID` `401 REFRESH_TOKEN_EXPIRED`|
|1.5|`POST`|`/auth/verify-email/:token`|❌ Guest|`{}` (token in URL)|`200` `{ message: "Email verified", accessToken: string }` + httpOnly cookie|`400 TOKEN_INVALID` `400 TOKEN_EXPIRED` `400 TOKEN_ALREADY_USED`|
|1.6|`POST`|`/auth/resend-verification`|❌ Guest|`{ email: string }`|`200` `{ message: "Verification email sent if account exists" }`|`429 RATE_LIMIT_EXCEEDED` (3/hour)|
|1.7|`POST`|`/auth/forgot-password`|❌ Guest|`{ email: string }`|`200` `{ message: "Reset link sent if account exists" }` (always 200 — no enumeration)|`429 RATE_LIMIT_EXCEEDED`|
|1.8|`POST`|`/auth/reset-password/:token`|❌ Guest|`{ password: string, confirmPassword: string }`|`200` `{ message: "Password reset successful" }`|`400 TOKEN_INVALID` `400 TOKEN_EXPIRED` `400 TOKEN_ALREADY_USED` `422 PASSWORDS_DONT_MATCH`|
|1.9|`GET`|`/auth/me`|✅ User|—|`200` `{ user: UserPrivateDTO }`|`401 UNAUTHORIZED`|

---

## Module 2 — Users & Profiles

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|2.1|`GET`|`/users/me`|✅ User|—|`200` `{ user: UserPrivateDTO }`|`401 UNAUTHORIZED`|
|2.2|`PUT`|`/users/me`|✅ User|`{ displayName?: string, bio?: string, availability?: string[], showOnMap?: boolean, radiusPreference?: number }`|`200` `{ user: UserPrivateDTO }`|`409 DISPLAY_NAME_EXISTS` `422 VALIDATION_ERROR`|
|2.3|`PUT`|`/users/me/location`|✅ User|`{ city: string, neighborhood: string, coordinates: [number, number], radiusPreference: number }`|`200` `{ location: LocationDTO }`|`422 INVALID_COORDINATES`|
|2.4|`PUT`|`/users/me/avatar`|✅ User|`multipart/form-data` `{ avatar: File }` (max 2MB, jpg/png/webp)|`200` `{ avatarUrl: string }`|`400 FILE_TOO_LARGE` `400 INVALID_FILE_TYPE`|
|2.5|`DELETE`|`/users/me/avatar`|✅ User|—|`200` `{ message: "Avatar removed" }`|`401 UNAUTHORIZED`|
|2.6|`GET`|`/users/:id`|✅ User|—|`200` `{ user: UserPublicDTO, skills: SkillSummaryDTO[], recentReviews: ReviewDTO[] }`|`404 USER_NOT_FOUND` `403 USER_BLOCKED`|
|2.7|`POST`|`/users/:id/report`|✅ User|`{ reason: ReportReason, description?: string }`|`201` `{ message: "Report submitted", reportId: string }`|`404 USER_NOT_FOUND` `409 REPORT_ALREADY_EXISTS` `400 CANNOT_REPORT_SELF`|
|2.8|`POST`|`/users/:id/block`|✅ User|`{}`|`200` `{ message: "User blocked" }`|`404 USER_NOT_FOUND` `400 CANNOT_BLOCK_SELF` `409 ALREADY_BLOCKED`|
|2.9|`DELETE`|`/users/:id/block`|✅ User|—|`200` `{ message: "User unblocked" }`|`404 USER_NOT_FOUND` `404 BLOCK_NOT_FOUND`|
|2.10|`GET`|`/users/me/blocked`|✅ User|—|`200` `{ users: UserSummaryDTO[] }`|`401 UNAUTHORIZED`|
|2.11|`DELETE`|`/users/me`|✅ User|`{ password: string, confirmPhrase: "DELETE MY ACCOUNT" }`|`200` `{ message: "Account scheduled for deletion" }`|`400 WRONG_PASSWORD` `400 CONFIRM_PHRASE_MISMATCH`|
|2.12|`GET`|`/users/me/export`|✅ User|—|`200` JSON blob of all user data (GDPR export)|`429 RATE_LIMIT_EXCEEDED` (1/day)|

---

## DTOs Reference

TypeScript

```
// UserPublicDTO — safe for public consumption
interface UserPublicDTO {
  id: string;
  displayName: string;
  bio: string;
  avatar: string;
  location: {
    city: string;
    neighborhood: string;
    // coordinates NEVER exposed
  };
  availability: string[];
  stats: {
    sessionsCompleted: number;
    averageRating: number;
    reviewCount: number;
  };
  isIdVerified: boolean;
  isPro: boolean;
  memberSince: string; // ISO date
  lastActive: string;  // "2 days ago" — approximate only
}

// UserPrivateDTO — only for the authenticated user themselves
interface UserPrivateDTO extends UserPublicDTO {
  email: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  showOnMap: boolean;
  radiusPreference: number;
  blockedUsers: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Module 3 — Skill Categories (Taxonomy)

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|3.1|`GET`|`/categories`|❌ Guest|—|`200` `{ categories: CategoryDTO[] }` (full tree)|—|
|3.2|`GET`|`/categories/:slug`|❌ Guest|—|`200` `{ category: CategoryDTO }` with nested skill items|`404 CATEGORY_NOT_FOUND`|
|3.3|`POST`|`/categories`|✅ Admin|`{ name: string, slug: string, icon: string, description: string, displayOrder: number }`|`201` `{ category: CategoryDTO }`|`409 CATEGORY_EXISTS` `422 VALIDATION_ERROR`|
|3.4|`PUT`|`/categories/:id`|✅ Admin|`{ name?: string, icon?: string, description?: string, displayOrder?: number, isActive?: boolean }`|`200` `{ category: CategoryDTO }`|`404 CATEGORY_NOT_FOUND`|
|3.5|`POST`|`/categories/:id/skills`|✅ Admin|`{ name: string, slug: string, description?: string }`|`201` `{ skill: SkillItemDTO }`|`409 SKILL_ITEM_EXISTS`|
|3.6|`PUT`|`/categories/:id/skills/:skillItemId`|✅ Admin|`{ name?: string, description?: string, isActive?: boolean }`|`200` `{ skill: SkillItemDTO }`|`404 SKILL_ITEM_NOT_FOUND`|
|3.7|`DELETE`|`/categories/:id/skills/:skillItemId`|✅ Admin|—|`200` `{ message: "Skill item deactivated" }` (soft)|`404 SKILL_ITEM_NOT_FOUND`|

---

## Module 4 — Skills (User Skill Listings)

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|4.1|`GET`|`/skills`|❌ Guest|Query: `?type=teach&category=food-cooking&format=in-person&availability=weekends&sort=rating&page=1&limit=20&q=baking`|`200` `{ skills: SkillCardDTO[], meta: PaginationMeta }`|`422 INVALID_FILTER`|
|4.2|`GET`|`/skills/:id`|❌ Guest|—|`200` `{ skill: SkillDetailDTO, teacher: UserPublicDTO, reviews: ReviewDTO[] }`|`404 SKILL_NOT_FOUND`|
|4.3|`POST`|`/skills`|✅ User|`{ type: SkillType, categoryId: string, skillName: string, description: string, proficiencyLevel: string, format: string, sessionLength: string }`|`201` `{ skill: SkillDetailDTO }`|`400 MAX_SKILLS_REACHED` (10 per type) `422 VALIDATION_ERROR` `404 CATEGORY_NOT_FOUND`|
|4.4|`PUT`|`/skills/:id`|✅ User (owner)|`{ description?: string, proficiencyLevel?: string, format?: string, sessionLength?: string, isActive?: boolean }`|`200` `{ skill: SkillDetailDTO }`|`403 NOT_OWNER` `404 SKILL_NOT_FOUND`|
|4.5|`DELETE`|`/skills/:id`|✅ User (owner)|—|`200` `{ message: "Skill removed" }` (soft delete)|`403 NOT_OWNER` `404 SKILL_NOT_FOUND`|
|4.6|`PATCH`|`/skills/:id/toggle`|✅ User (owner)|`{ isActive: boolean }`|`200` `{ skill: { id: string, isActive: boolean } }`|`403 NOT_OWNER` `404 SKILL_NOT_FOUND`|
|4.7|`POST`|`/skills/:id/media`|✅ User (owner)|`multipart/form-data` `{ image: File }` (max 2MB, max 5 images)|`201` `{ media: SkillMediaDTO }`|`400 MAX_IMAGES_REACHED` `400 FILE_TOO_LARGE` `403 NOT_OWNER`|
|4.8|`DELETE`|`/skills/:id/media/:mediaId`|✅ User (owner)|—|`200` `{ message: "Image removed" }`|`403 NOT_OWNER` `404 MEDIA_NOT_FOUND`|
|4.9|`GET`|`/skills/user/:userId`|✅ User|Query: `?type=teach`|`200` `{ skills: SkillCardDTO[] }`|`404 USER_NOT_FOUND`|
|4.10|`GET`|`/skills/me`|✅ User|Query: `?type=teach&includeInactive=true`|`200` `{ skills: SkillDetailDTO[] }`|`401 UNAUTHORIZED`|
|4.11|`POST`|`/skills/:id/report`|✅ User|`{ reason: ReportReason, description?: string }`|`201` `{ message: "Report submitted" }`|`404 SKILL_NOT_FOUND` `409 REPORT_ALREADY_EXISTS`|

---

## DTOs Reference (Skills)

TypeScript

```
interface SkillCardDTO {
  id: string;
  type: 'teach' | 'learn';
  categoryName: string;
  skillName: string;
  description: string;           // Truncated to 150 chars on list view
  proficiencyLevel: string;
  format: string;
  sessionLength: string;
  isActive: boolean;
  stats: {
    averageRating: number;
    reviewCount: number;
    completedSessionCount: number;
  };
  teacher: {                     // Only for type='teach'
    id: string;
    displayName: string;
    avatar: string;
    location: { city: string; neighborhood: string };
    availability: string[];
    isIdVerified: boolean;
    isPro: boolean;
  };
  createdAt: string;
}

interface SkillDetailDTO extends SkillCardDTO {
  description: string;           // Full 500 chars
  media: SkillMediaDTO[];
  updatedAt: string;
}
```

---

## Module 5 — Discovery (Map & Nearby)

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|5.1|`GET`|`/discovery/map`|❌ Guest (blurred)|Query: `?bbox=lng1,lat1,lng2,lat2&category=food-cooking&type=teach&availability=weekends`|`200` `{ pins: MapPinDTO[] }` (coordinates snapped to grid)|`422 INVALID_BBOX` `422 BBOX_TOO_LARGE`|
|5.2|`GET`|`/discovery/nearby`|✅ User|Query: `?lat=51.5&lng=-0.1&radius=5&category=&type=teach&format=in-person&availability=&sort=distance&page=1&limit=20`|`200` `{ skills: NearbySkillDTO[], meta: PaginationMeta }`|`422 INVALID_COORDINATES` `422 RADIUS_TOO_LARGE`|
|5.3|`GET`|`/discovery/neighborhood/:city/:neighborhood`|❌ Guest|Query: `?type=teach&page=1`|`200` `{ skills: SkillCardDTO[], neighborhood: string, meta: PaginationMeta }`|`404 NEIGHBORHOOD_NOT_FOUND`|
|5.4|`GET`|`/discovery/geocode`|✅ User|Query: `?q=Shoreditch+London`|`200` `{ results: GeocodeResultDTO[] }` (proxied Nominatim — hides API impl.)|`422 QUERY_TOO_SHORT` `503 GEOCODE_UNAVAILABLE`|
|5.5|`GET`|`/discovery/skill-gaps`|❌ Guest|Query: `?city=London`|`200` `{ gaps: SkillGapDTO[] }` (anonymous aggregate — Phase 3)|—|

---

## DTOs Reference (Discovery)

TypeScript

```
interface MapPinDTO {
  skillId: string;
  // Coordinates snapped to ~200m grid — never exact
  // Guests get neighborhood centroid only
  coordinates: [number, number];
  categoryName: string;
  skillName: string;
  teacherSummary: {
    id: string;
    displayName: string;
    avatar: string | null;  // null for guests (blurred)
    isIdVerified: boolean;
  };
}

interface NearbySkillDTO extends SkillCardDTO {
  distanceKm: number;     // Approximate: "~2.3km" — calculated server-side
                          // Actual coordinates never exposed
}
```

---

## Module 6 — Connections (Request Flow)

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|6.1|`POST`|`/connections`|✅ User|`{ teacherId: string, skillId: string, message: string, proposedFormat: string }`|`201` `{ connection: ConnectionDTO }`|`400 CANNOT_REQUEST_SELF` `409 DUPLICATE_PENDING_REQUEST` `404 SKILL_NOT_FOUND` `404 USER_NOT_FOUND` `403 USER_BLOCKED` `422 VALIDATION_ERROR`|
|6.2|`GET`|`/connections/inbox`|✅ User|Query: `?status=pending&page=1&limit=20`|`200` `{ connections: ConnectionInboxDTO[], meta: PaginationMeta }`|`401 UNAUTHORIZED`|
|6.3|`GET`|`/connections/outbox`|✅ User|Query: `?status=pending&page=1&limit=20`|`200` `{ connections: ConnectionOutboxDTO[], meta: PaginationMeta }`|`401 UNAUTHORIZED`|
|6.4|`GET`|`/connections/:id`|✅ User (participant)|—|`200` `{ connection: ConnectionDetailDTO }`|`404 CONNECTION_NOT_FOUND` `403 NOT_PARTICIPANT`|
|6.5|`PUT`|`/connections/:id/accept`|✅ User (teacher)|`{ responseMessage?: string }`|`200` `{ connection: ConnectionDTO, chatRoomId: string }`|`403 NOT_TEACHER` `400 INVALID_STATUS_TRANSITION` `404 CONNECTION_NOT_FOUND`|
|6.6|`PUT`|`/connections/:id/reject`|✅ User (teacher)|`{ responseMessage?: string }`|`200` `{ connection: ConnectionDTO }`|`403 NOT_TEACHER` `400 INVALID_STATUS_TRANSITION`|
|6.7|`PUT`|`/connections/:id/withdraw`|✅ User (requester)|—|`200` `{ connection: ConnectionDTO }`|`403 NOT_REQUESTER` `400 INVALID_STATUS_TRANSITION`|
|6.8|`PUT`|`/connections/:id/complete`|✅ User (participant)|—|`200` `{ connection: ConnectionDTO, reviewPrompt: boolean }`|`403 NOT_PARTICIPANT` `400 INVALID_STATUS_TRANSITION`|
|6.9|`PUT`|`/connections/:id/cancel`|✅ User (participant)|`{ reason?: string }`|`200` `{ connection: ConnectionDTO }`|`403 NOT_PARTICIPANT` `400 INVALID_STATUS_TRANSITION`|
|6.10|`GET`|`/connections/stats`|✅ User|—|`200` `{ pending: number, accepted: number, completed: number }`|`401 UNAUTHORIZED`|

---

## DTOs Reference (Connections)

TypeScript

```
interface ConnectionDTO {
  id: string;
  status: ConnectionStatus;
  requester: UserSummaryDTO;
  teacher: UserSummaryDTO;
  skill: SkillSummaryDTO;
  message: string;
  proposedFormat: string;
  responseMessage?: string;
  chatRoomId?: string;          // Only present when status = 'accepted'
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionInboxDTO extends ConnectionDTO {
  isNew: boolean;               // Unread since last inbox check
}
```

---

## Module 7 — Messaging

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|7.1|`GET`|`/messages/:connectionId`|✅ User (participant)|Query: `?page=1&limit=50&before=<messageId>` (cursor-based)|`200` `{ messages: MessageDTO[], meta: { hasMore: boolean, oldestId: string } }`|`403 NOT_PARTICIPANT` `403 CONNECTION_NOT_ACCEPTED` `404 CONNECTION_NOT_FOUND`|
|7.2|`POST`|`/messages/:connectionId`|✅ User (participant)|`{ content: string }` (REST fallback — primary via Socket.io)|`201` `{ message: MessageDTO }`|`403 NOT_PARTICIPANT` `403 CONNECTION_NOT_ACCEPTED` `422 CONTENT_TOO_LONG`|
|7.3|`POST`|`/messages/:connectionId/media`|✅ User (participant)|`multipart/form-data` `{ image: File }`|`201` `{ message: MessageDTO }`|`400 FILE_TOO_LARGE` `403 NOT_PARTICIPANT`|
|7.4|`DELETE`|`/messages/:messageId`|✅ User (sender)|—|`200` `{ message: "Message deleted" }` (soft delete)|`403 NOT_SENDER` `404 MESSAGE_NOT_FOUND`|
|7.5|`POST`|`/messages/:messageId/report`|✅ User (participant)|`{ reason: ReportReason, description?: string }`|`201` `{ message: "Message reported" }`|`404 MESSAGE_NOT_FOUND` `403 NOT_PARTICIPANT` `409 ALREADY_REPORTED`|
|7.6|`PUT`|`/messages/:messageId/react`|✅ User (participant)|`{ emoji: "👍" \| "❤️" \| "😄" \| "🙏" }`|`200` `{ reactions: ReactionDTO[] }`|`404 MESSAGE_NOT_FOUND` `403 NOT_PARTICIPANT`|
|7.7|`GET`|`/messages/conversations`|✅ User|Query: `?page=1&limit=20`|`200` `{ conversations: ConversationDTO[] }` (all active chats, sorted by last message)|`401 UNAUTHORIZED`|
|7.8|`PUT`|`/messages/:connectionId/read`|✅ User (participant)|`{ lastReadMessageId: string }`|`200` `{ readAt: string }`|`403 NOT_PARTICIPANT`|

---

## Socket.io Events Reference

TypeScript

```
// CLIENT → SERVER (emit)
socket.emit('join_room',        { connectionId: string })
socket.emit('leave_room',       { connectionId: string })
socket.emit('send_message',     { connectionId: string, content: string })
socket.emit('typing_start',     { connectionId: string })
socket.emit('typing_stop',      { connectionId: string })
socket.emit('mark_read',        { connectionId: string, messageId: string })

// SERVER → CLIENT (on)
socket.on('message_received',   (data: MessageDTO) => void)
socket.on('message_delivered',  (data: { messageId: string, deliveredAt: string }) => void)
socket.on('message_read',       (data: { messageId: string, readAt: string }) => void)
socket.on('user_typing',        (data: { userId: string, displayName: string }) => void)
socket.on('user_stopped_typing',(data: { userId: string }) => void)
socket.on('connection_updated', (data: { connectionId: string, status: string }) => void)
socket.on('notification',       (data: NotificationDTO) => void)
socket.on('error',              (data: { code: string, message: string }) => void)
```

---

## Module 8 — Reviews

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|8.1|`POST`|`/reviews`|✅ User|`{ connectionId: string, rating: 1\|2\|3\|4\|5, content?: string, tags?: ReviewTag[], wouldRecommend: boolean }`|`201` `{ review: ReviewDTO }`|`404 CONNECTION_NOT_FOUND` `400 CONNECTION_NOT_COMPLETED` `403 NOT_PARTICIPANT` `409 REVIEW_ALREADY_EXISTS` `400 REVIEW_WINDOW_EXPIRED` (7-day window)|
|8.2|`GET`|`/reviews/user/:userId`|✅ User|Query: `?page=1&limit=10&asTeacher=true`|`200` `{ reviews: ReviewDTO[], aggregate: RatingAggregateDTO, meta: PaginationMeta }`|`404 USER_NOT_FOUND`|
|8.3|`GET`|`/reviews/skill/:skillId`|❌ Guest|Query: `?page=1&limit=10`|`200` `{ reviews: ReviewDTO[], aggregate: RatingAggregateDTO, meta: PaginationMeta }`|`404 SKILL_NOT_FOUND`|
|8.4|`GET`|`/reviews/:id`|✅ User|—|`200` `{ review: ReviewDTO }`|`404 REVIEW_NOT_FOUND`|
|8.5|`PUT`|`/reviews/:id`|✅ User (author)|`{ content?: string, tags?: ReviewTag[], wouldRecommend?: boolean }`|`200` `{ review: ReviewDTO }`|`403 NOT_AUTHOR` `400 EDIT_WINDOW_EXPIRED` (24-hour window) `400 RATING_IMMUTABLE`|
|8.6|`POST`|`/reviews/:id/report`|✅ User|`{ reason: ReportReason, description?: string }`|`201` `{ message: "Review reported" }`|`404 REVIEW_NOT_FOUND` `409 ALREADY_REPORTED`|

---

## DTOs Reference (Reviews)

TypeScript

```
interface ReviewDTO {
  id: string;
  reviewer: UserSummaryDTO;
  reviewee: UserSummaryDTO;
  skill: SkillSummaryDTO;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: string[];
  wouldRecommend: boolean;
  createdAt: string;
}

interface RatingAggregateDTO {
  averageRating: number;
  reviewCount: number;
  distribution: {        // Count per star
    1: number; 2: number; 3: number; 4: number; 5: number;
  };
  recommendationRate: number;  // % who said wouldRecommend: true
  topTags: string[];           // Most frequent tags
}
```

---

## Module 9 — Notifications

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|9.1|`GET`|`/notifications`|✅ User|Query: `?isRead=false&page=1&limit=20`|`200` `{ notifications: NotificationDTO[], unreadCount: number, meta: PaginationMeta }`|`401 UNAUTHORIZED`|
|9.2|`PUT`|`/notifications/:id/read`|✅ User|`{}`|`200` `{ notification: NotificationDTO }`|`404 NOTIFICATION_NOT_FOUND` `403 NOT_RECIPIENT`|
|9.3|`PUT`|`/notifications/read-all`|✅ User|`{}`|`200` `{ updatedCount: number }`|`401 UNAUTHORIZED`|
|9.4|`DELETE`|`/notifications/:id`|✅ User|—|`200` `{ message: "Notification dismissed" }`|`404 NOTIFICATION_NOT_FOUND` `403 NOT_RECIPIENT`|
|9.5|`GET`|`/notifications/unread-count`|✅ User|—|`200` `{ count: number }`|`401 UNAUTHORIZED`|

---

## Module 10 — Reports (User-Facing)

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|10.1|`POST`|`/reports`|✅ User|`{ targetType: ReportTargetType, targetId: string, reason: ReportReason, description?: string }`|`201` `{ message: "Report submitted", reportId: string }`|`404 TARGET_NOT_FOUND` `409 OPEN_REPORT_EXISTS` `400 CANNOT_REPORT_OWN_CONTENT` `422 VALIDATION_ERROR`|
|10.2|`GET`|`/reports/me`|✅ User|Query: `?page=1&limit=10`|`200` `{ reports: ReportSummaryDTO[], meta: PaginationMeta }` (own submitted reports + status)|`401 UNAUTHORIZED`|

---

## Module 11 — Phase 2: Skill Swaps

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|11.1|`GET`|`/swaps`|✅ User|Query: `?status=suggested`|`200` `{ swaps: SkillSwapDTO[] }`|`401 UNAUTHORIZED`|
|11.2|`GET`|`/swaps/suggestions`|✅ User|—|`200` `{ suggestions: SwapSuggestionDTO[] }` (algorithm-generated matches)|`401 UNAUTHORIZED`|
|11.3|`PUT`|`/swaps/:id/accept`|✅ User (participant)|`{}`|`200` `{ swap: SkillSwapDTO, connections: ConnectionDTO[] }`|`404 SWAP_NOT_FOUND` `403 NOT_PARTICIPANT` `400 SWAP_EXPIRED`|
|11.4|`PUT`|`/swaps/:id/decline`|✅ User (participant)|`{ reason?: string }`|`200` `{ swap: SkillSwapDTO }`|`404 SWAP_NOT_FOUND` `403 NOT_PARTICIPANT`|

---

## Module 12 — Phase 2: Group Sessions

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|12.1|`GET`|`/group-sessions`|✅ User|Query: `?city=London&category=food-cooking&status=open&page=1`|`200` `{ sessions: GroupSessionDTO[], meta: PaginationMeta }`|`401 UNAUTHORIZED`|
|12.2|`GET`|`/group-sessions/:id`|✅ User|—|`200` `{ session: GroupSessionDetailDTO }`|`404 SESSION_NOT_FOUND`|
|12.3|`POST`|`/group-sessions`|✅ User|`{ skillId: string, title: string, description: string, maxParticipants: number, format: string, scheduledAt?: string, location?: string }`|`201` `{ session: GroupSessionDetailDTO }`|`422 VALIDATION_ERROR` `404 SKILL_NOT_FOUND` `403 SKILL_NOT_YOURS`|
|12.4|`POST`|`/group-sessions/:id/join`|✅ User|`{ message?: string }`|`200` `{ session: GroupSessionDetailDTO, chatRoomId: string }`|`404 SESSION_NOT_FOUND` `400 SESSION_FULL` `409 ALREADY_JOINED` `400 CANNOT_JOIN_OWN_SESSION`|
|12.5|`DELETE`|`/group-sessions/:id/leave`|✅ User (participant)|—|`200` `{ message: "Left session" }`|`404 SESSION_NOT_FOUND` `403 NOT_PARTICIPANT`|
|12.6|`PUT`|`/group-sessions/:id`|✅ User (teacher/owner)|`{ title?: string, description?: string, scheduledAt?: string, location?: string }`|`200` `{ session: GroupSessionDetailDTO }`|`403 NOT_OWNER` `400 SESSION_ALREADY_COMPLETED`|
|12.7|`PUT`|`/group-sessions/:id/complete`|✅ User (teacher/owner)|`{}`|`200` `{ session: GroupSessionDetailDTO }`|`403 NOT_OWNER` `400 INVALID_STATUS_TRANSITION`|
|12.8|`DELETE`|`/group-sessions/:id`|✅ User (teacher/owner)|`{ reason?: string }`|`200` `{ message: "Session cancelled" }`|`403 NOT_OWNER` `400 SESSION_ALREADY_COMPLETED`|

---

## Module 13 — Phase 2: Saved Searches

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|13.1|`GET`|`/saved-searches`|✅ User|—|`200` `{ savedSearches: SavedSearchDTO[] }`|`401 UNAUTHORIZED`|
|13.2|`POST`|`/saved-searches`|✅ User|`{ name: string, filters: FilterDTO, alertEnabled: boolean }`|`201` `{ savedSearch: SavedSearchDTO }`|`400 MAX_SAVED_SEARCHES_REACHED` (5 per user) `422 VALIDATION_ERROR`|
|13.3|`PUT`|`/saved-searches/:id`|✅ User (owner)|`{ name?: string, filters?: FilterDTO, alertEnabled?: boolean }`|`200` `{ savedSearch: SavedSearchDTO }`|`403 NOT_OWNER` `404 NOT_FOUND`|
|13.4|`DELETE`|`/saved-searches/:id`|✅ User (owner)|—|`200` `{ message: "Saved search deleted" }`|`403 NOT_OWNER` `404 NOT_FOUND`|
|13.5|`GET`|`/saved-searches/:id/results`|✅ User (owner)|Query: `?page=1`|`200` `{ skills: SkillCardDTO[], newCount: number, meta: PaginationMeta }`|`403 NOT_OWNER`|

---

## Module 14 — Phase 2: Community Posts

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|14.1|`GET`|`/community/:city`|✅ User|Query: `?neighborhood=shoreditch&sort=new\|top&page=1`|`200` `{ posts: CommunityPostDTO[], meta: PaginationMeta }`|`404 CITY_NOT_FOUND`|
|14.2|`POST`|`/community`|✅ User|`{ content: string, city: string, neighborhood?: string }`|`201` `{ post: CommunityPostDTO }`|`422 CONTENT_TOO_LONG` `422 NO_LINKS_ALLOWED` `429 RATE_LIMIT` (5 posts/day)|
|14.3|`GET`|`/community/posts/:id`|✅ User|—|`200` `{ post: CommunityPostDTO }`|`404 POST_NOT_FOUND`|
|14.4|`DELETE`|`/community/posts/:id`|✅ User (author)|—|`200` `{ message: "Post deleted" }`|`403 NOT_AUTHOR`|
|14.5|`PUT`|`/community/posts/:id/vote`|✅ User|`{ vote: "up" \| "down" \| "remove" }`|`200` `{ voteScore: number, userVote: "up" \| "down" \| null }`|`404 POST_NOT_FOUND` `400 CANNOT_VOTE_OWN_POST`|
|14.6|`POST`|`/community/posts/:id/report`|✅ User|`{ reason: ReportReason, description?: string }`|`201` `{ message: "Post reported" }`|`404 POST_NOT_FOUND`|

---

## Module 15 — Phase 2: Endorsements

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|15.1|`POST`|`/endorsements`|✅ User|`{ endorseeId: string, skillId: string, connectionId: string }`|`201` `{ endorsement: EndorsementDTO }`|`400 CANNOT_ENDORSE_SELF` `400 NO_COMPLETED_CONNECTION` `409 ALREADY_ENDORSED` `404 SKILL_NOT_FOUND`|
|15.2|`GET`|`/endorsements/user/:userId`|✅ User|Query: `?skillId=`|`200` `{ endorsements: EndorsementDTO[], totalCount: number }`|`404 USER_NOT_FOUND`|
|15.3|`DELETE`|`/endorsements/:id`|✅ User (endorser)|—|`200` `{ message: "Endorsement removed" }`|`403 NOT_ENDORSER` `404 ENDORSEMENT_NOT_FOUND`|

---

## Module 16 — Admin Dashboard

|#|Method|Route|Auth Required|Request Body|Success Response|Error Codes|
|---|---|---|---|---|---|---|
|16.1|`GET`|`/admin/stats`|✅ Admin/Mod|Query: `?period=week\|month\|all`|`200` `{ stats: AdminStatsDTO }`|`403 FORBIDDEN`|
|16.2|`GET`|`/admin/reports`|✅ Admin/Mod|Query: `?status=open&targetType=user&assignedTo=me&sort=severity&page=1`|`200` `{ reports: AdminReportDTO[], meta: PaginationMeta }`|`403 FORBIDDEN`|
|16.3|`GET`|`/admin/reports/:id`|✅ Admin/Mod|—|`200` `{ report: AdminReportDetailDTO }` (includes full context)|`403 FORBIDDEN` `404 REPORT_NOT_FOUND`|
|16.4|`PUT`|`/admin/reports/:id/assign`|✅ Admin/Mod|`{ assignTo: "me" \| userId }`|`200` `{ report: AdminReportDTO }`|`403 FORBIDDEN` `404 REPORT_NOT_FOUND`|
|16.5|`PUT`|`/admin/reports/:id/resolve`|✅ Admin/Mod|`{ resolution: string, action: "warn"\|"suspend"\|"ban"\|"remove_content"\|"no_action" }`|`200` `{ report: AdminReportDTO }`|`403 FORBIDDEN` `404 REPORT_NOT_FOUND`|
|16.6|`PUT`|`/admin/reports/:id/dismiss`|✅ Admin/Mod|`{ reason: string }`|`200` `{ report: AdminReportDTO }`|`403 FORBIDDEN` `404 REPORT_NOT_FOUND`|
|16.7|`GET`|`/admin/users`|✅ Admin/Mod|Query: `?q=email_or_name&status=active&role=user&page=1`|`200` `{ users: AdminUserDTO[], meta: PaginationMeta }`|`403 FORBIDDEN`|
|16.8|`GET`|`/admin/users/:id`|✅ Admin/Mod|—|`200` `{ user: AdminUserDetailDTO }` (all fields inc. sensitive)|`403 FORBIDDEN` `404 USER_NOT_FOUND`|
|16.9|`PUT`|`/admin/users/:id/warn`|✅ Admin/Mod|`{ reason: string, notifyUser: boolean }`|`200` `{ user: AdminUserDTO, auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 USER_NOT_FOUND`|
|16.10|`PUT`|`/admin/users/:id/suspend`|✅ Admin/Mod|`{ reason: string, durationHours: number }`|`200` `{ user: AdminUserDTO, auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 USER_NOT_FOUND` `400 CANNOT_SUSPEND_ADMIN`|
|16.11|`PUT`|`/admin/users/:id/ban`|✅ Admin|`{ reason: string }`|`200` `{ user: AdminUserDTO, auditLog: AuditLogDTO }`|`403 FORBIDDEN` (Mod cannot ban) `404 USER_NOT_FOUND` `400 CANNOT_BAN_ADMIN`|
|16.12|`PUT`|`/admin/users/:id/reinstate`|✅ Admin|`{ reason: string }`|`200` `{ user: AdminUserDTO, auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 USER_NOT_FOUND` `400 USER_NOT_SUSPENDED_OR_BANNED`|
|16.13|`PUT`|`/admin/users/:id/shadow-ban`|✅ Admin|`{ reason: string }`|`200` `{ user: AdminUserDTO }`|`403 FORBIDDEN`|
|16.14|`DELETE`|`/admin/skills/:id`|✅ Admin/Mod|`{ reason: string }`|`200` `{ message: "Skill removed", auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 SKILL_NOT_FOUND`|
|16.15|`DELETE`|`/admin/reviews/:id`|✅ Admin/Mod|`{ reason: string }`|`200` `{ message: "Review removed", auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 REVIEW_NOT_FOUND`|
|16.16|`DELETE`|`/admin/messages/:id`|✅ Admin/Mod|`{ reason: string }`|`200` `{ message: "Message deleted", auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 MESSAGE_NOT_FOUND`|
|16.17|`DELETE`|`/admin/posts/:id`|✅ Admin/Mod|`{ reason: string }`|`200` `{ message: "Post removed", auditLog: AuditLogDTO }`|`403 FORBIDDEN` `404 POST_NOT_FOUND`|
|16.18|`GET`|`/admin/audit-logs`|✅ Admin|Query: `?performedBy=&action=&targetType=&page=1`|`200` `{ logs: AuditLogDTO[], meta: PaginationMeta }`|`403 FORBIDDEN`|
|16.19|`GET`|`/admin/audit-logs/:id`|✅ Admin|—|`200` `{ log: AuditLogDetailDTO }` (includes before/after snapshots)|`403 FORBIDDEN` `404 LOG_NOT_FOUND`|

---

## Admin DTO Reference

TypeScript

```
interface AdminStatsDTO {
  period: string;
  users: {
    total: number;
    newThisPeriod: number;
    activeThisPeriod: number;
    suspended: number;
    banned: number;
  };
  skills: {
    total: number;
    newThisPeriod: number;
    byCategory: { category: string; count: number }[];
  };
  connections: {
    total: number;
    pending: number;
    completed: number;
    completedThisPeriod: number;
  };
  reports: {
    open: number;
    resolvedThisPeriod: number;
    averageResolutionHours: number;
  };
  messages: {
    totalThisPeriod: number;
    reported: number;
  };
}
```
 
---

## Complete Error Code Reference

TypeScript

```
// ─── Auth Errors ──────────────────────────────────────────────────
EMAIL_EXISTS                  // 409 — Registration duplicate
DISPLAY_NAME_EXISTS           // 409 — Registration duplicate
INVALID_CREDENTIALS           // 401 — Wrong email/password (generic)
EMAIL_NOT_VERIFIED            // 401 — Must verify before login
ACCOUNT_SUSPENDED             // 403 — Temp suspended
ACCOUNT_BANNED                // 403 — Permanent ban
ACCOUNT_LOCKED                // 429 — Brute force lockout
UNAUTHORIZED                  // 401 — No valid JWT
FORBIDDEN                     // 403 — Valid JWT, wrong role
TOKEN_INVALID                 // 400 — Malformed/expired/used token
TOKEN_EXPIRED                 // 400 — Specifically expired
TOKEN_ALREADY_USED            // 400 — One-time token reuse attempt
REFRESH_TOKEN_INVALID         // 401
REFRESH_TOKEN_EXPIRED         // 401
PASSWORDS_DONT_MATCH          // 422

// ─── Validation ───────────────────────────────────────────────────
VALIDATION_ERROR              // 422 — Zod schema failure
INVALID_COORDINATES           // 422 — Geo validation
INVALID_BBOX                  // 422 — Map bbox malformed
BBOX_TOO_LARGE                // 422 — Prevents abuse
RADIUS_TOO_LARGE              // 422 — Max radius exceeded
CONTENT_TOO_LONG              // 422 — Max chars exceeded
NO_LINKS_ALLOWED              // 422 — Community post policy
INVALID_FILE_TYPE             // 400 — Not jpg/png/webp
FILE_TOO_LARGE                // 400 — Exceeds 2MB

// ─── Not Found ────────────────────────────────────────────────────
USER_NOT_FOUND                // 404
SKILL_NOT_FOUND               // 404
CONNECTION_NOT_FOUND          // 404
MESSAGE_NOT_FOUND             // 404
REVIEW_NOT_FOUND              // 404
REPORT_NOT_FOUND              // 404
CATEGORY_NOT_FOUND            // 404
NEIGHBORHOOD_NOT_FOUND        // 404
SESSION_NOT_FOUND             // 404 — Group session
SWAP_NOT_FOUND                // 404
POST_NOT_FOUND                // 404
ENDORSEMENT_NOT_FOUND         // 404
MEDIA_NOT_FOUND               // 404
SKILL_ITEM_NOT_FOUND          // 404
BLOCK_NOT_FOUND               // 404

// ─── Conflict ─────────────────────────────────────────────────────
DUPLICATE_PENDING_REQUEST     // 409
REVIEW_ALREADY_EXISTS         // 409
ALREADY_REPORTED              // 409
OPEN_REPORT_EXISTS            // 409
ALREADY_JOINED                // 409 — Group session
ALREADY_BLOCKED               // 409
ALREADY_ENDORSED              // 409
CATEGORY_EXISTS               // 409
SKILL_ITEM_EXISTS             // 409
REPORT_ALREADY_EXISTS         // 409

// ─── Business Logic ───────────────────────────────────────────────
CANNOT_REQUEST_SELF           // 400
CANNOT_REPORT_SELF            // 400
CANNOT_BLOCK_SELF             // 400
CANNOT_VOTE_OWN_POST          // 400
CANNOT_ENDORSE_SELF           // 400
CANNOT_JOIN_OWN_SESSION       // 400
CANNOT_REPORT_OWN_CONTENT     // 400
CANNOT_SUSPEND_ADMIN          // 400
CANNOT_BAN_ADMIN              // 400
USER_BLOCKED                  // 403 — Target blocked you or vice versa
NOT_OWNER                     // 403 — Not the resource owner
NOT_PARTICIPANT               // 403 — Not in this connection/session
NOT_TEACHER                   // 403 — Action restricted to teacher role
NOT_REQUESTER                 // 403 — Action restricted to requester
NOT_AUTHOR                    // 403 — Not review/post author
NOT_SENDER                    // 403 — Not message sender
NOT_ENDORSER                  // 403 — Not endorsement giver
NOT_RECIPIENT                 // 403 — Notification not for you
SKILL_NOT_YOURS               // 403 — Creating session with others skill
INVALID_STATUS_TRANSITION     // 400 — FSM violation
CONNECTION_NOT_ACCEPTED       // 403 — Chat requires accepted connection
SESSION_FULL                  // 400 — Group session at capacity
SWAP_EXPIRED                  // 400
REVIEW_WINDOW_EXPIRED         // 400 — 7-day post-session window closed
EDIT_WINDOW_EXPIRED           // 400 — 24-hour review edit window closed
RATING_IMMUTABLE              // 400 — Cannot change star rating after submit
NO_COMPLETED_CONNECTION       // 400 — Endorsement requires completed session
USER_NOT_SUSPENDED_OR_BANNED  // 400 — Nothing to reinstate
CONFIRM_PHRASE_MISMATCH       // 400 — Account deletion safety check
WRONG_PASSWORD                // 400 — Account deletion verification
MAX_SKILLS_REACHED            // 400 — 10 skills per type limit
MAX_IMAGES_REACHED            // 400 — 5 images per skill
MAX_SAVED_SEARCHES_REACHED    // 400 — 5 per user

// ─── Rate Limiting ────────────────────────────────────────────────
RATE_LIMIT_EXCEEDED           // 429 — Generic rate limit
GEOCODE_UNAVAILABLE           // 503 — Nominatim upstream down
```

---

## Auth Middleware Matrix

text

```
ROUTE PATTERN              GUEST   USER    MOD     ADMIN
──────────────────────────────────────────────────────────
GET  /skills               ✅      ✅      ✅      ✅
GET  /skills/:id           ✅      ✅      ✅      ✅
POST /skills               ❌      ✅      ✅      ✅
PUT  /skills/:id           ❌      Owner   ✅      ✅
GET  /discovery/map        ✅blur  ✅      ✅      ✅
GET  /discovery/nearby     ❌      ✅      ✅      ✅
POST /connections          ❌      ✅      ✅      ✅
GET  /connections/inbox    ❌      Self    ✅      ✅
GET  /messages/:connId     ❌      Part.   ✅      ✅
POST /reviews              ❌      Part.   ✅      ✅
GET  /reviews/skill/:id    ✅      ✅      ✅      ✅
GET  /admin/*              ❌      ❌      Partial ✅
PUT  /admin/users/:id/ban  ❌      ❌      ❌      ✅

Legend:
  ✅       = Full access
  ❌       = 401/403 returned
  blur     = Response data partially redacted
  Owner    = Only the resource owner
  Part.    = Only connection participants
  Self     = Only own data
  Partial  = Some admin routes, not all
```

----
