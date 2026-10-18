import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { getListing, placeOf, type Listing } from '@/data/listings';
import { useAuth } from '@/hooks/use-auth';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { usePersistedState } from '@/hooks/use-persisted-state';

export type Message = {
  id: string;
  tripId: string;
  from: 'host' | 'guest';
  text: string;
  sentAt: number;
  read: boolean;
  /** Automatic host messages, so each is only ever sent once per trip. */
  kind?: 'welcome' | 'welcome-pending' | 'confirmed';
};

type MessagesContextValue = {
  /** Every conversation, keyed by trip id, oldest message first. */
  messages: Record<string, Message[]>;
  /** True while the host of that trip is "typing…". */
  typing: Record<string, boolean>;
  send: (tripId: string, text: string) => void;
  /** Call while a chat is on screen: marks its host messages read and keeps new ones read. */
  openChat: (tripId: string) => void;
  closeChat: (tripId: string) => void;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

const WELCOME_DELAY = 2000;
const CONFIRMED_DELAY = 1500;

let counter = 0;
const newId = () => `msg-${Date.now()}-${counter++}`;

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { trips } = useBooking();
  const { user } = useAuth();
  const firstName = user?.firstName;
  const [messages, setMessages, hydrated] = usePersistedState<Record<string, Message[]>>('messages', {});
  const [typing, setTyping] = useState<Record<string, boolean>>({});

  // Only touched from event handlers and timer callbacks, never during render.
  const activeChat = useRef<string | null>(null);
  const replyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const unanswered = useRef<Record<string, string[]>>({});

  const addHostMessage = (tripId: string, text: string, kind?: Message['kind']) =>
    setMessages((current) => withHostMessage(current, tripId, text, activeChat.current === tripId, kind));

  // Hosts greet every new trip, and send check-in details once a pending request is accepted.
  useEffect(() => {
    if (!hydrated) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const trip of trips) {
      const listing = getListing(trip.listingId);
      if (!listing) continue;
      const thread = messages[trip.id] ?? [];
      if (thread.length === 0) {
        const kind = trip.status === 'pending' ? 'welcome-pending' : 'welcome';
        const delay = Math.max(0, trip.createdAt + WELCOME_DELAY - Date.now());
        const text = welcomeText(listing, trip, firstName);
        timers.push(setTimeout(() => setMessages((c) => withHostMessage(c, trip.id, text, activeChat.current === trip.id, kind)), delay));
      } else if (
        trip.status === 'confirmed' &&
        thread.some((m) => m.kind === 'welcome-pending') &&
        !thread.some((m) => m.kind === 'confirmed')
      ) {
        const text = confirmedText(listing);
        timers.push(
          setTimeout(
            () => setMessages((c) => withHostMessage(c, trip.id, text, activeChat.current === trip.id, 'confirmed')),
            CONFIRMED_DELAY
          )
        );
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [hydrated, trips, messages, firstName, setMessages]);

  // Cancel any pending replies if the provider goes away.
  useEffect(() => {
    const pending = replyTimers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const send = (tripId: string, raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const trip = trips.find((t) => t.id === tripId);
    const listing = trip ? getListing(trip.listingId) : undefined;

    setMessages((current) => {
      // Sending a message means the guest has seen everything above it.
      const thread = (current[tripId] ?? []).map((m) => (m.read ? m : { ...m, read: true }));
      const message: Message = { id: newId(), tripId, from: 'guest', text, sentAt: Date.now(), read: true };
      return { ...current, [tripId]: [...thread, message] };
    });

    if (!listing) return;

    // Several quick messages get one combined answer, like a real person would send.
    unanswered.current[tripId] = [...(unanswered.current[tripId] ?? []), text];
    clearTimeout(replyTimers.current[tripId]);
    setTyping((current) => ({ ...current, [tripId]: true }));
    replyTimers.current[tripId] = setTimeout(
      () => {
        const asked = unanswered.current[tripId] ?? [];
        delete unanswered.current[tripId];
        delete replyTimers.current[tripId];
        setTyping((current) => ({ ...current, [tripId]: false }));
        addHostMessage(tripId, replyTo(asked, listing, firstName));
      },
      1500 + Math.random() * 1500
    );
  };

  const markRead = (tripId: string) =>
    setMessages((current) => {
      const thread = current[tripId];
      if (!thread?.some((m) => !m.read)) return current;
      return { ...current, [tripId]: thread.map((m) => (m.read ? m : { ...m, read: true })) };
    });

  const value: MessagesContextValue = {
    messages,
    typing,
    send,
    openChat: (tripId) => {
      activeChat.current = tripId;
      markRead(tripId);
    },
    closeChat: (tripId) => {
      if (activeChat.current === tripId) activeChat.current = null;
    },
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) throw new Error('useMessages must be used inside MessagesProvider');
  return context;
}

/** Unread host messages across every conversation, for the Messages tab badge. */
export function useUnreadCount() {
  const { messages } = useMessages();
  let count = 0;
  for (const thread of Object.values(messages)) {
    for (const m of thread) if (m.from === 'host' && !m.read) count++;
  }
  return count;
}

/** Appends a host message; automatic ones (with a `kind`) are skipped if already sent. */
function withHostMessage(
  current: Record<string, Message[]>,
  tripId: string,
  text: string,
  read: boolean,
  kind?: Message['kind']
) {
  const thread = current[tripId] ?? [];
  if (kind && thread.some((m) => m.kind === kind)) return current;
  const message: Message = { id: newId(), tripId, from: 'host', text, sentAt: Date.now(), read, kind };
  return { ...current, [tripId]: [...thread, message] };
}

// Canned host messages ----------------------------------------------------------------------

function welcomeText(listing: Listing, trip: Trip, firstName?: string) {
  const { city } = placeOf(listing);
  const hi = firstName ? `Hi ${firstName}!` : 'Hi there!';
  const intro = `${hi} I’m ${listing.host.name}, so glad you’re coming to ${city} 🎉`;
  return trip.status === 'pending'
    ? `${intro} I’ve got your request and I’ll confirm it in just a moment. Ask me anything in the meantime!`
    : `${intro} You’re all booked. If you have any questions before you arrive, just message me here.`;
}

function confirmedText(listing: Listing) {
  const where = listing.category === 'homes' ? 'Check-in is from 2pm.' : 'I’ll meet you at the start point 10 minutes early.';
  return `Confirmed! Here’s your gate code: 4821 🔑 ${where} Can’t wait to host you.`;
}

const FOOD: Record<string, string> = {
  Lagos: 'For food, try Yellow Chilli on Victoria Island for jollof and asun, or Nok by Alara if you want something fancy 🍲',
  Abuja: 'For food, Wakkis in Wuse 2 does amazing Indian, and Jabi Lake Mall has lots of options by the water 🍛',
  Accra: 'For food, go to Buka in Osu for waakye and kelewele, or Bistro 22 for a nice dinner 🍽️',
};

const TOPICS: { match: RegExp; answer: (listing: Listing, firstName?: string) => string }[] = [
  {
    match: /wi-?fi|internet|password/i,
    answer: (l) =>
      l.amenities.includes('wifi')
        ? `The wifi is “${l.host.name.split(' ')[0]}-Guest” and the password is stay2026 📶`
        : 'There’s no wifi here, sorry! But 4G coverage is really strong.',
  },
  {
    match: /check.?in|check.?out|time|arrive|arrival|early|late/i,
    answer: (l) =>
      l.category === 'homes'
        ? 'Check-in is from 2pm and check-out is by 11am. Early check-in is usually fine, just let me know ⏰'
        : 'We start right on time, so please arrive about 10 minutes early ⏰',
  },
  {
    match: /park|car|drive|uber|bolt|taxi/i,
    answer: (l) =>
      l.amenities.includes('parking')
        ? 'There’s free parking right inside the compound 🚗'
        : 'There’s no private parking, but street parking nearby is safe, and Bolt or Uber can drop you at the gate 🚗',
  },
  {
    match: /food|eat|restaurant|hungry|dinner|lunch|breakfast|spot/i,
    answer: (l) => FOOD[placeOf(l).city] ?? 'There are some great local spots a short walk away, I’ll send you my favourites 🍽️',
  },
  {
    match: /price|discount|cheaper|deal|reduce|negotiat/i,
    answer: () => 'Haha, nice try 😄 The price is already as low as I can go, but I promise it’s worth it!',
  },
  {
    match: /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i,
    answer: (_l, firstName) => `Hey${firstName ? ` ${firstName}` : ''}! 👋 How can I help?`,
  },
  {
    match: /thank|thanks|thx/i,
    answer: () => 'You’re very welcome! 😊',
  },
];

function replyTo(texts: string[], listing: Listing, firstName?: string) {
  const all = texts.join(' ');
  const answers = TOPICS.filter((t) => t.match.test(all)).map((t) => t.answer(listing, firstName));
  // A greeting on its own is fine, but skip it when there's a real question to answer.
  const useful = answers.length > 1 ? answers.filter((a) => !a.startsWith('Hey')) : answers;
  if (useful.length) return useful.join('\n\n');
  return 'Great question! Let me check and get back to you shortly. Anything else I can help with in the meantime? 🙂';
}
