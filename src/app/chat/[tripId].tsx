import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpIcon } from '@solar-icons/react-native/linear/arrow-up';

import { clockTime } from '@/components/chat/time';
import { TypingBubble } from '@/components/chat/typing-bubble';
import { FormView } from '@/components/form-view';
import { ScreenHeader } from '@/components/ui';
import { getListing, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { useMessages, type Message } from '@/hooks/use-messages';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { formatRange } from '@/lib/dates';

const QUICK_REPLIES = ['What’s the wifi?', 'Check-in time?', 'Any food spots nearby?'];

/** Messages closer together than this (from the same person) share one timestamp. */
const GROUP_GAP = 5 * 60_000;

export default function ChatScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip ? getListing(trip.listingId) : undefined;
  if (!trip || !listing) return null;
  return <Chat trip={trip} listing={listing} />;
}

function Chat({ trip, listing }: { trip: Trip; listing: Listing }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { messages, typing, send, openChat, closeChat } = useMessages();
  const [draft, setDraft] = useState('');
  // Only messages that arrive while the chat is open animate in.
  const [openedAt] = useState(() => Date.now());

  const thread = messages[trip.id] ?? [];
  // Inverted list: newest first, so it sticks to the bottom.
  const data = [...thread].reverse();
  const hostTyping = Boolean(typing[trip.id]);
  const canSend = draft.trim().length > 0;

  // While this chat is on screen, its host messages count as read.
  useFocusEffect(
    useCallback(() => {
      openChat(trip.id);
      return () => closeChat(trip.id);
    }, [trip.id, openChat, closeChat])
  );

  const submit = (text: string) => {
    if (!text.trim()) return;
    send(trip.id, text);
    setDraft('');
  };

  return (
    <FormView>
      <ScreenHeader title={listing.host.name} bordered={false} />
      <View style={styles.subheader}>
        <Text style={styles.subtitle} numberOfLines={1}>
          {listing.title} · {formatRange(trip.checkIn, trip.checkOut)}
        </Text>
      </View>

      <FlatList
        inverted
        data={data}
        keyExtractor={(m) => m.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={hostTyping ? <TypingBubble name={listing.host.name} /> : null}
        ListEmptyComponent={
          hostTyping ? null : (
            <Text style={styles.empty}>Say hello to {listing.host.name.split(' ')[0]} 👋</Text>
          )
        }
        renderItem={({ item, index }) => <Bubble message={item} newer={data[index - 1]} animate={item.sentAt > openedAt} />}
      />

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}>
          {QUICK_REPLIES.map((reply) => (
            <Pressable
              key={reply}
              onPress={() => submit(reply)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
              <Text style={styles.chipText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={colors.placeholder}
            multiline
            style={styles.input}
            accessibilityLabel="Message"
          />
          <Pressable
            onPress={() => submit(draft)}
            disabled={!canSend}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            style={({ pressed }) => [
              styles.send,
              !canSend && styles.sendDisabled,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}>
            <ArrowUpIcon size={20} color={canSend ? colors.white : colors.onDisabled} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </FormView>
  );
}

function Bubble({ message, newer, animate }: { message: Message; newer?: Message; animate: boolean }) {
  const styles = useStyles();
  const mine = message.from === 'guest';
  // Show the time under the last bubble of each run from the same sender.
  const showTime = !newer || newer.from !== message.from || newer.sentAt - message.sentAt > GROUP_GAP;

  return (
    <Animated.View
      entering={animate ? FadeInUp.duration(220) : undefined}
      style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap, showTime && styles.groupEnd]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine ? styles.mineText : styles.theirsText]}>{message.text}</Text>
      </View>
      {showTime && <Text style={styles.time}>{clockTime(message.sentAt)}</Text>}
    </Animated.View>
  );
}

const useStyles = createStyles((c) => ({
  subheader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    marginTop: -10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    backgroundColor: c.background,
  },
  subtitle: {
    fontSize: 13,
    color: c.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  empty: {
    // Inverted list flips its children, so flip this back.
    transform: [{ scaleY: -1 }],
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 15,
    marginTop: 24,
  },
  bubbleWrap: {
    maxWidth: '80%',
    marginTop: 3,
  },
  mineWrap: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirsWrap: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  groupEnd: {
    marginBottom: 10,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mine: {
    backgroundColor: c.inverse,
    borderBottomRightRadius: 6,
  },
  theirs: {
    backgroundColor: c.surface,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  mineText: {
    color: c.onInverse,
  },
  theirsText: {
    color: c.text,
  },
  time: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
    marginHorizontal: 6,
  },
  composer: {
    backgroundColor: c.background,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
    paddingTop: 10,
    gap: 10,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'center',
    backgroundColor: c.background,
  },
  chipPressed: {
    backgroundColor: c.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: c.inputBorder,
    fontSize: 16,
    lineHeight: 20,
    color: c.text,
    backgroundColor: c.background,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.gradientSolid,
    experimental_backgroundImage: c.gradient,
  },
  sendDisabled: {
    backgroundColor: c.disabled,
    experimental_backgroundImage: 'none',
  },
}));
