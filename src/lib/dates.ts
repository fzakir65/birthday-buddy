import { Friend } from '../types';
import { MONTHS, MONTHS_SHORT } from './constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Strip the time component so day comparisons are stable. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Build a Date for a birthday in a given year, folding Feb 29 -> Feb 28 in non-leap years. */
function birthdayInYear(year: number, month: number, day: number): Date {
  let d = day;
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    d = 28;
  }
  return new Date(year, month - 1, d);
}

/** The next occurrence of this birthday on/after `from` (today counts). */
export function nextBirthday(friend: Friend, from: Date = new Date()): Date {
  const today = startOfDay(from);
  let candidate = birthdayInYear(today.getFullYear(), friend.birthMonth, friend.birthDay);
  if (candidate < today) {
    candidate = birthdayInYear(today.getFullYear() + 1, friend.birthMonth, friend.birthDay);
  }
  return candidate;
}

/** Whole days from today until the next birthday. 0 == today. */
export function daysUntilBirthday(friend: Friend, from: Date = new Date()): number {
  const next = nextBirthday(friend, from);
  const today = startOfDay(from);
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

export function isBirthdayToday(friend: Friend, from: Date = new Date()): boolean {
  return daysUntilBirthday(friend, from) === 0;
}

/** Age the friend currently is (or null if no birth year). */
export function currentAge(friend: Friend, from: Date = new Date()): number | null {
  if (!friend.birthYear) return null;
  const today = startOfDay(from);
  let age = today.getFullYear() - friend.birthYear;
  const hadBirthday =
    today.getMonth() + 1 > friend.birthMonth ||
    (today.getMonth() + 1 === friend.birthMonth && today.getDate() >= friend.birthDay);
  if (!hadBirthday) age -= 1;
  return age;
}

/** Age they will turn on their next birthday (or null). */
export function turningAge(friend: Friend, from: Date = new Date()): number | null {
  if (!friend.birthYear) return null;
  const next = nextBirthday(friend, from);
  return next.getFullYear() - friend.birthYear;
}

/** "in 3 days", "Today!", "Tomorrow", "in 2 months" */
export function countdownLabel(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  if (months <= 1) return 'in 1 month';
  return `in ${months} months`;
}

/** "June 18" */
export function formatMonthDay(month: number, day: number): string {
  return `${MONTHS[month - 1]} ${day}`;
}

/** "Jun 18" */
export function formatMonthDayShort(month: number, day: number): string {
  return `${MONTHS_SHORT[month - 1]} ${day}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Friends sorted by soonest upcoming birthday. */
export function sortByUpcoming(friends: Friend[], from: Date = new Date()): Friend[] {
  return [...friends].sort(
    (a, b) => daysUntilBirthday(a, from) - daysUntilBirthday(b, from)
  );
}

/** Friends whose next birthday is within `windowDays` (inclusive). */
export function upcomingWithin(
  friends: Friend[],
  windowDays: number,
  from: Date = new Date()
): Friend[] {
  return sortByUpcoming(
    friends.filter((f) => daysUntilBirthday(f, from) <= windowDays),
    from
  );
}
