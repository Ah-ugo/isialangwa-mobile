# Isialangwa Directory — Mobile App (Offline-First)

An offline-first mobile application built with **React Native**, **Expo (SDK 51)**, and **SQLite (expo-sqlite)** with bidirectional delta synchronization for field agents registering constituents in Isialangwa.

---

## 📱 Features

- **Offline-First Storage**: Full offline read and write capabilities using local SQLite (`expo-sqlite`).
- **Two-Way Delta Sync**:
  - **Pull (Delta)**: Queries `/api/mobile/sync?since=<lastSyncAt>` to retrieve only newly updated or created records.
  - **Push (Queue)**: Pending local records are queued in SQLite (`pending_uploads`) and synced automatically when online.
- **Auto-Sync**: Automatically detects network status and syncs in background when foregrounded.
- **Secure Authentication**: Uses JWT Bearer token authentication stored securely via `expo-secure-store`.
- **Directory Search & Filters**: Instant full-text search across names, phone numbers, and voter cards with Ward and Polling Unit drill-down.
- **Field Registration**: Capture constituent details, phone numbers (with Nigerian normalization and duplicate validation), voter cards (VIN), photos, and consent.
- **Quick Contact**: Direct phone dialer and WhatsApp chat links from member profiles.

---

## 🏗️ Architecture

```
mobile/
├── App.js                   # Application root, SQLite init & context providers
├── app.json                 # Expo configuration
├── babel.config.js          # Babel config
├── package.json             # Dependencies and scripts
└── src/
    ├── api/
    │   ├── client.js        # Axios instance configured for Bearer auth
    │   ├── auth.js          # Auth API (login, logout, token management)
    │   └── sync.js          # Sync API (pull sync & push person records)
    ├── components/
    │   ├── PersonCard.js    # Directory card component with sync badge
    │   └── SyncBanner.js    # Real-time online/offline & sync status banner
    ├── context/
    │   ├── AuthContext.js   # Authentication context & state
    │   └── SyncContext.js   # Synchronization engine & network state
    ├── db/
    │   └── database.js      # SQLite schema, queries, queue management
    ├── navigation/
    │   └── AppNavigator.js  # Bottom tab and native stack navigation
    ├── screens/
    │   ├── HomeScreen.js    # Dashboard with stats, quick actions & sync
    │   ├── LoginScreen.js   # Field agent sign-in
    │   ├── PeopleScreen.js  # Directory search with Ward & PU filters
    │   ├── PersonFormScreen.js # Offline registration form
    │   ├── PersonDetailScreen.js # Profile view with contact actions
    │   └── SettingsScreen.js # Agent profile, sync status & app settings
    └── utils/
        └── storage.js       # SecureStore token and user helpers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- [Expo Go](https://expo.dev/go) app installed on your physical device (iOS or Android), or an iOS Simulator / Android Emulator.

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# Start Expo development server
npx expo start

# For Android Emulator
npx expo start --android

# For iOS Simulator
npx expo start --ios
```

Scan the QR code displayed in your terminal with the **Expo Go** app on Android or the **Camera** app on iOS.

---

## ⚙️ Backend Connection

The app connects to the Isialangwa Directory API at:
- `https://apcbe.vercel.app/api/mobile`

Authentication endpoints:
- `POST /api/mobile/auth/login` — Sign in and receive JWT token
- `GET /api/mobile/sync` — Fetch wards, polling units, and updated people
- `POST /api/mobile/people` — Push newly registered constituents
