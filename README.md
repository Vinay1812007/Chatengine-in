# Chatengine-in

Production-ready **Next.js Pages Router** messaging app inspired by WhatsApp + Telegram with a premium glassmorphism interface.

## Stack
- Next.js Pages Router + React 18
- Firebase Auth (Google), Firestore, Storage
- CSS Modules + global CSS
- Firestore-based real-time listeners
- WebRTC helper using Firestore signaling + public STUN servers

## Features implemented
- Google sign-in / sign-out with persisted session
- Auto-create user document on first login
- User model with uid/displayName/email/photoURL/username/about/lastSeen/online
- Username uniqueness validation on settings page
- 1:1 chat creation
- Basic group creation
- Real-time messages with bubble UI
- Timestamps + sent/delivered/read approximations
- Typing indicator + per-chat draft persistence (cloud synced)
- Reply, forward helper, edit message, delete for me/everyone
- Star messages
- Reactions
- Pin/unpin message
- Chat search
- Saved Messages ready via self-chat pattern (create direct chat with yourself if needed)
- Media upload to Firebase Storage with progress/status feedback
- Block/unblock controls
- WebRTC call UI scaffold (ringing/active/end) using Firestore signaling

## Free-tier-safe limitations (documented approximations)
- No TURN server is used; calls may fail behind strict NAT/firewall.
- Delivery/read state is best effort from Firestore arrays, not carrier-grade receipts.
- Poll create/vote structure is wired in context but minimal UI is included.
- Presence (`online`, `lastSeen`) is best effort and updated on auth/session events.
- Forwarding/pinned/admin actions are functional but intentionally lightweight for Firebase free usage.

## Project structure

```
/lib
  firebase.js
  webrtc.js
  encryption.js
/pages
  _app.js
  index.js
  chat.js
  settings.js
  chat-settings.js
/components
  ChatList.js
  ChatWindow.js
  MessageBubble.js
  Composer.js
  GlassPanel.js
  CallUI.js
/contexts
  AuthContext.js
  ChatContext.js
  ThemeContext.js
/styles
  globals.css
  glass.module.css
  chat.module.css
/firebase
  firestore.rules
  storage.rules
  firebase.json
  .firebaserc
.env.example
package.json
next.config.js
README.md
.gitignore
```

## Setup
1. Create a Firebase project (free Spark plan).
2. Enable Google provider in Authentication.
3. Create Firestore (native mode) and Storage.
4. Copy `.env.example` to `.env.local` and fill credentials.
5. Update `firebase/.firebaserc` project id.
6. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel Free
1. Push this repo to GitHub.
2. Import in Vercel.
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables.
4. Deploy.

## Security design notes
- Firestore rules restrict chat/message access to participants.
- Group membership updates are restricted to admin logic path.
- Storage reads/writes require auth and chat membership for chat media.
- No public file reads.

## Maintenance tips
- Keep Firestore composite indexes lean; only add when prompted.
- Add Cloud Functions only if strict server-side moderation/auditing is required.
- For production-grade call reliability, migrate to TURN when budget permits.
