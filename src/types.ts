// Core data model for Birthday Buddy

export type Closeness =
  | 'best'
  | 'close'
  | 'family'
  | 'friend'
  | 'colleague'
  | 'acquaintance';

export interface PastBirthdayNote {
  /** Calendar year the note refers to, e.g. 2024 */
  year: number;
  /** Free text, e.g. "Gave flowers and took her to dinner" */
  note: string;
}

/** Ways you can connect with a friend — each nudges the friendship score up. */
export type InteractionType = 'wish' | 'message' | 'call' | 'hangout' | 'gift' | 'checkin';

export interface Interaction {
  id: string;
  type: InteractionType;
  /** ISO timestamp of when it happened (defaults to now when logged) */
  date: string;
  note?: string;
}

/**
 * "Memory Vault" — the little things worth remembering about someone.
 * Every field is optional free text; only filled-in ones are shown.
 */
export interface MemoryVault {
  favoriteFood?: string;
  favoriteColor?: string;
  hobbies?: string;
  dreamGift?: string;
  allergies?: string;
  dislikes?: string;
  sizes?: string;
  insideJokes?: string;
}

export interface Friend {
  id: string;
  name: string;
  /** 1-12 */
  birthMonth: number;
  /** 1-31 */
  birthDay: number;
  /** Optional birth year — enables age display. null/undefined = unknown */
  birthYear?: number | null;
  /** Local file URI from the image picker, or null for an initials avatar */
  photoUri?: string | null;
  closeness: Closeness;
  /** Gift ideas, one per entry */
  giftIdeas: string[];
  /** Preferences, allergies, anything to remember */
  notes: string;
  /** History log, e.g. what you did in past years */
  pastNotes: PastBirthdayNote[];
  /** Logged connections (calls, texts, hangouts…) that drive the friendship score */
  interactions: Interaction[];
  /** The little things worth remembering — favourites, allergies, dream gift… */
  vault?: MemoryVault;
  /**
   * Days-before-birthday at which to remind, e.g. [30, 7, 3, 1, 0].
   * Empty array means "use the app default schedule".
   */
  reminderDays: number[];
  /** ISO timestamp */
  createdAt: string;
}

/**
 * A logged "moment" — the Memories feature. Photos are gradient placeholders
 * (via `gradIndex` into the GRADS palette) until a real `photoUri` is picked.
 */
export interface Memory {
  id: string;
  /** Full date. `m` is 1-based (1-12). */
  y: number;
  m: number;
  d: number;
  /** Index into the GRADS gradient palette (used when no photoUri). */
  gradIndex: number;
  /** Local file URI from the image picker; overrides the gradient when set. */
  photoUri?: string | null;
  emoji: string;
  tagline: string;
  note?: string;
  friendIds: string[];
  /** "Core memory" — highlighted with a ✨ badge. */
  core: boolean;
  /** Emoji reaction counts, keys among ❤️ 🔥 😭 💀. */
  reactions: Record<string, number>;
}

/** A recurring custom date added from "Discover special days". */
export interface SpecialDay {
  id: string;
  /** 1-based month. */
  m: number;
  d: number;
  emoji: string;
  label: string;
}

/** A suggested moment ("Add to your calendar?") derived from friend activity. */
export interface DateSuggestion {
  id: string;
  friendId: string;
  /** e.g. "Hang", "Call", "Gym sesh" */
  kind: string;
  emoji: string;
  y: number;
  m: number;
  d: number;
}

/** A "Discover special days" row (Friendversary, Half-birthday, etc.). */
export interface DiscoverItem {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  m: number;
  d: number;
  added: boolean;
  dismissed: boolean;
}

export type NotificationStyle = 'push' | 'sms' | 'email';

export interface Settings {
  /** Default reminder schedule applied to friends with no custom schedule */
  defaultReminderDays: number[];
  /** Hour of day (0-23) to deliver reminders */
  notificationHour: number;
  /** Quiet hours — informational in the prototype */
  quietHoursStart: number;
  quietHoursEnd: number;
  /** Only "push" is wired up in the prototype; others are premium placeholders */
  notificationStyle: NotificationStyle;
  /** Premium unlock flag (local only, for demoing gated features) */
  premium: boolean;
}
