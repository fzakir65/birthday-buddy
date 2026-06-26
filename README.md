# 🎂 Birthday Buddy

A smart, personal iOS app that never lets you miss a friend's birthday — and tells you
*what to do* about it. Built with **Expo + React Native + TypeScript**, runnable on a real
iPhone from a Windows PC via the **Expo Go** app (no Mac required for development).

This is the **MVP + Calendar & Profiles** prototype: everything runs locally on-device
(no backend), with real local notifications.

---

## ▶️ Run it on your iPhone (from Windows)

1. **Install dependencies** (already done once during setup):
   ```bash
   npm install
   ```
2. **Start the dev server:**
   ```bash
   npm start
   ```
   A QR code appears in the terminal.
3. On your iPhone, install **Expo Go** from the App Store.
4. Open the **Camera** app and point it at the QR code → tap the banner to open in Expo Go.
   (Phone and PC must be on the **same Wi-Fi**. On a locked-down network, run
   `npx expo start --tunnel` instead.)
5. The app loads live. Edit any file and it hot-reloads on the phone.

### Node version note
Expo SDK 56 prefers **Node ≥ 20.19.4**; this machine has 20.15.1, which prints an
"unsupported" warning but works (the bundle was verified end-to-end). To silence it,
install Node 20 LTS (or 22 LTS) from https://nodejs.org and re-run `npm install`.

---

## ✨ What's implemented

| Area | Status |
|---|---|
| Home: today's birthdays (celebratory), this-week / this-month / total stats, **Social health (social battery % + friends who need a nudge)**, upcoming-30-days list | ✅ |
| Friends: search, sort by next-birthday / name / **vibe**, friendship-score chip on every card, free-tier 20-friend banner | ✅ |
| **Friend "vibe" tags**: Day One 💎 · Inner Circle 🔥 · Family DLC 🏠 · Chaos Agent 🌪️ · Soft Spot 🌙 · Work NPC 💼 | ✅ |
| **Friendship Score (0–100)**: rises when you log connections (wish/text/call/hang/gift), decays with neglect; status label + progress bar on the profile | ✅ |
| **Memory Vault**: per-friend favourites, hobbies, dream gift, allergies, dislikes, sizes, inside jokes (shown on profile, editable in Add/Edit) | ✅ |
| Friend Profile: countdown, age, **friendship score + log-a-connection**, **action prompts (Call · Text · Gift · Plan)**, personalised message templates (share sheet), Memory Vault, gift ideas (add/remove), notes, **birthday history log** | ✅ |
| Add / Edit: photo picker, name, month/day/year selector, relationship closeness, gift ideas, notes, custom reminder schedule | ✅ |
| Calendar: monthly grid with **birthday dots**, tap a day to see who's celebrating | ✅ |
| Settings: default reminder schedule, reminder time, quiet hours, notification style, permission status, **send test notification**, premium toggle, reset demo data | ✅ |
| **Local notifications**: multi-stage reminders (30/7/3/1/day-of) scheduled per friend | ✅ |
| On-device persistence (AsyncStorage) | ✅ |

### Mocked / later phases (per the product plan)
- **AI messages & gift ideas** → buttons are wired; connect the Claude API in `FriendProfileScreen`.
- **Contact import, Facebook/Instagram sync, Backup & sync, SMS/Email reminders** → shown as
  "coming soon" in Settings.
- **Premium** is a local demo toggle (no real billing).

---

## 🗂 Project structure

```
App.tsx                     Navigation (bottom tabs + stack), providers
index.ts                    Entry point
src/
├── types.ts                Friend / Settings models
├── lib/
│   ├── theme.ts            iOS design tokens (colours, spacing, shadows)
│   ├── constants.ts        Closeness options, reminder presets, months
│   ├── dates.ts            Birthday math (next birthday, countdown, age, leap years)
│   ├── score.ts            Friendship-score math (interactions + neglect → 0–100, status, social battery)
│   ├── storage.ts          AsyncStorage CRUD
│   ├── notifications.ts    Permissions, scheduling, test notification
│   └── id.ts               Local id generator
├── state/
│   └── FriendsContext.tsx  App state: load/seed/CRUD + auto-reschedule + persist
├── data/seed.ts            Demo friends (dates relative to today)
├── components/             Avatar, FriendCard, ScoreBadge, SectionCard, Pill, Button, EmptyState
├── navigation/types.ts     Typed navigation params
└── screens/                Home, Friends, Calendar, Settings, FriendProfile, AddEditFriend
```

---

## 🔔 How reminders work

Local notifications are scheduled with `expo-notifications` using one-shot `DATE` triggers.
The app cancels and re-schedules every reminder whenever data changes or the app opens, so
the pipeline stays full for the coming year. Try **Settings → Send a test notification** to
see one in ~5 seconds.

> Local notifications work in Expo Go on iOS. *Remote push* (FCM/APNs from a server) is a
> Phase 3 item and needs a development build, not Expo Go.

---

## 📦 Tech

Expo SDK 56 · React Native 0.85 · React 19 · TypeScript · React Navigation 7 ·
AsyncStorage · expo-notifications · expo-image-picker
