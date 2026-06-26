# Birthday Buddy — Claude Code guide

@AGENTS.md

> ⚠️ **Expo SDK 56.** APIs shift between Expo versions. Before writing code against any
> Expo/React Native API, check the **versioned** docs at
> https://docs.expo.dev/versions/v56.0.0/ — do not rely on memory of older SDKs.

## What this is

A **smart friend birthday reminder app**, built as a runnable prototype.
**Target platform: iOS** (developed on Windows, run on a real iPhone via **Expo Go** —
no Mac needed). Stack: **Expo SDK 56 · React Native 0.85 · React 19 · TypeScript ·
React Navigation 7**. Everything is **local/on-device** — there is **no backend**.

Scope built so far: **MVP + Calendar & Profiles** (see README.md "What's implemented").

## Commands

```bash
npm start                       # start Metro; scan QR with iPhone Camera -> Expo Go
npx expo start --tunnel         # use if phone/PC aren't on the same reachable Wi-Fi
npx tsc --noEmit                # typecheck (run this after changes — it's the main gate)
npx expo export --platform ios  # full iOS bundle; best way to verify it compiles end-to-end
npx expo install <pkg>          # ALWAYS use this (not npm install) for Expo/RN deps -> SDK-correct versions
```

There are no unit tests. **Verification = `npx tsc --noEmit` passes + `expo export` bundles.**

## Architecture

- **State lives in one place:** `src/state/FriendsContext.tsx` (React Context). It loads
  from storage, seeds demo data on first run, exposes CRUD, and **auto-persists +
  re-schedules notifications** whenever friends/settings change. Use `useFriends()` in screens;
  don't read/write AsyncStorage directly from components.
- **Navigation:** `App.tsx` — a native-stack root (`Tabs`, `FriendProfile`,
  `AddEditFriend` as a modal) wrapping a bottom-tab navigator (Home, Friends, Calendar,
  Settings). Typed param lists in `src/navigation/types.ts`.
- **Pure logic is isolated** in `src/lib/`:
  - `dates.ts` — all birthday math (next birthday, countdown, age, leap-year/Feb-29 handling). Reuse these; don't re-derive date math in screens.
  - `notifications.ts` — permissions, scheduling, test notification.
  - `storage.ts` — AsyncStorage CRUD (keys: `bb.friends.v1`, `bb.settings.v1`, `bb.seeded.v1`).
  - `theme.ts` / `constants.ts` — design tokens & app config.
- **Screens** in `src/screens/`, **reusable UI** in `src/components/`.

## Conventions

- TypeScript **strict** is on. Keep it clean — typecheck must pass.
- **Style with the design tokens** from `src/lib/theme.ts` (`colors`, `spacing`, `radius`,
  `shadow`, `fontSize`) — don't hardcode hex colours or magic numbers in screens.
- iOS-flavoured UI: `react-native-safe-area-context` for insets, `Ionicons` from
  `@expo/vector-icons` for icons (use the `-outline` variant for inactive states).
- New data fields: add to `src/types.ts`, give defaults in `storage.ts`/`constants.ts`
  (settings are merged with `DEFAULT_SETTINGS` on load so old saved data stays valid).

## SDK-56 gotchas already handled (keep these patterns)

- **Notifications** use `trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date }`.
  On Android, `channelId` goes in the **trigger**, not `content`.
- `setNotificationHandler` uses `shouldShowBanner` / `shouldShowList` (not the old `shouldShowAlert`).
- **Image picker:** `mediaTypes: ['images']` (the `MediaTypeOptions` enum is deprecated).
- `Alert.prompt(...)` is **iOS-only** — it's called as `Alert.prompt?.(...)`; fine here since target is iOS.
- **Local** notifications work in Expo Go; **remote push** (FCM/APNs) needs a dev build — that's a later phase.

## Environment notes

- Node here is **20.15.1**; SDK 56 prefers **≥20.19.4**. It builds & runs, just prints an
  "unsupported" warning. Bumping to Node 20/22 LTS silences it.
- Mocked / future phases: **AI messages & gift ideas** (wire up the Claude API in
  `FriendProfileScreen.tsx` — `onGift` and message templates), contact import, social sync,
  SMS/email reminders, real billing. Premium is a local demo toggle in Settings.
