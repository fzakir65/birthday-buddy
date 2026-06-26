import { Friend, Interaction, InteractionType } from '../types';
import { makeId } from '../lib/id';

/** Month/day a given number of days from today (so the demo always looks alive). */
function offset(daysFromNow: number): { month: number; day: number } {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

/** An interaction `daysAgo` in the past (drives the friendship score). */
function touch(type: InteractionType, daysAgo: number): Interaction {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: makeId(), type, date: d.toISOString() };
}

export function defaultFriends(): Friend[] {
  const now = new Date().toISOString();

  const make = (
    daysFromNow: number,
    data: Omit<Friend, 'id' | 'birthMonth' | 'birthDay' | 'createdAt'>
  ): Friend => {
    const { month, day } = offset(daysFromNow);
    return { id: makeId(), birthMonth: month, birthDay: day, createdAt: now, ...data };
  };

  return [
    make(0, {
      name: 'Aisha Khan',
      birthYear: 1996,
      photoUri: null,
      closeness: 'best',
      giftIdeas: ['Pottery class voucher', 'The new Murakami novel', 'Oat-milk latte set'],
      notes: 'Allergic to nuts. Loves matcha and indie bookshops.',
      pastNotes: [
        { year: 2024, note: 'Surprised her with flowers and brunch.' },
        { year: 2023, note: 'Gave a hand-written card + Spotify playlist.' },
      ],
      interactions: [touch('message', 1), touch('hangout', 4), touch('call', 11), touch('gift', 40)],
      vault: {
        favoriteFood: 'Matcha & ramen',
        favoriteColor: 'Sage green',
        hobbies: 'Indie bookshops, ceramics',
        dreamGift: 'A pottery wheel',
        allergies: 'Nuts',
        dislikes: 'Lilies',
      },
      reminderDays: [],
    }),
    make(1, {
      name: 'Daniel Osei',
      birthYear: 1994,
      photoUri: null,
      closeness: 'close',
      giftIdeas: ['Vinyl record (jazz)', 'Cooking masterclass'],
      notes: 'Trying to cut down on sugar. Big into jazz.',
      pastNotes: [{ year: 2024, note: 'Took him to a gig.' }],
      interactions: [touch('message', 9), touch('call', 26)],
      vault: {
        hobbies: 'Jazz, cooking',
        dreamGift: 'Blue Note vinyl box set',
        dislikes: 'Sugary stuff',
      },
      reminderDays: [7, 1, 0],
    }),
    make(6, {
      name: 'Mum',
      birthYear: 1967,
      photoUri: null,
      closeness: 'family',
      giftIdeas: ['Garden tools', 'Weekend spa trip', 'Photo book of the family'],
      notes: 'Prefers experiences over things.',
      pastNotes: [{ year: 2024, note: 'Family dinner + spa voucher.' }],
      interactions: [touch('call', 5), touch('hangout', 28)],
      vault: {
        hobbies: 'Gardening',
        dreamGift: 'A spa weekend',
        dislikes: 'Clutter',
      },
      reminderDays: [],
    }),
    make(13, {
      name: 'Leo Martinez',
      birthYear: 1992,
      photoUri: null,
      closeness: 'friend',
      giftIdeas: ['Climbing gym day pass'],
      notes: 'Climber. Vegetarian.',
      pastNotes: [],
      interactions: [touch('message', 34)],
      vault: { hobbies: 'Climbing', favoriteFood: 'Vegetarian' },
      reminderDays: [],
    }),
    make(27, {
      name: 'Priya Nair',
      birthYear: 1998,
      photoUri: null,
      closeness: 'friend',
      giftIdeas: ['Skincare set', 'Concert tickets'],
      notes: 'Loves K-pop and skincare.',
      pastNotes: [],
      interactions: [touch('checkin', 6), touch('message', 18)],
      vault: {
        favoriteFood: 'Korean BBQ',
        favoriteColor: 'Lilac',
        hobbies: 'K-pop, skincare',
        dreamGift: 'Laneige skincare set',
      },
      reminderDays: [],
    }),
    make(58, {
      name: 'James (work)',
      birthYear: 1990,
      photoUri: null,
      closeness: 'colleague',
      giftIdeas: ['Nice coffee beans', 'Team lunch'],
      notes: 'Coffee snob — flat white.',
      pastNotes: [],
      interactions: [touch('message', 70)],
      vault: { favoriteFood: 'Flat white', dreamGift: 'Specialty coffee subscription' },
      reminderDays: [7, 0],
    }),
    make(124, {
      name: 'Grandad',
      birthYear: 1948,
      photoUri: null,
      closeness: 'family',
      giftIdeas: ['Crossword book', 'Warm slippers'],
      notes: 'Call him — he loves a phone catch-up.',
      pastNotes: [{ year: 2024, note: 'Drove up to visit for the weekend.' }],
      interactions: [touch('call', 80)],
      vault: { hobbies: 'Crosswords', dislikes: 'Fuss' },
      reminderDays: [],
    }),
    make(210, {
      name: 'Sophie Bennett',
      birthYear: 1995,
      photoUri: null,
      closeness: 'acquaintance',
      giftIdeas: [],
      notes: 'Met at the running club.',
      pastNotes: [],
      interactions: [],
      reminderDays: [3, 0],
    }),
  ];
}
