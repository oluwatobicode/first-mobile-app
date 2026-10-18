import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { relativeTime } from '@/components/chat/time';
import { EmptyState, TabScreen } from '@/components/tab-screen';
import { getListing, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { useMessages, type Message } from '@/hooks/use-messages';
import { createStyles } from '@/hooks/use-theme';

type Conversation = { trip: Trip; listing: Listing; last: Message | undefined; unread: boolean };

export default function MessagesScreen() {
  const { trips } = useBooking();
  const { messages, typing } = useMessages();

  const conversations = trips
    .map((trip) => {
      const listing = getListing(trip.listingId);
      const thread = messages[trip.id] ?? [];
      return {
        trip,
        listing,
        last: thread.at(-1),
        unread: thread.some((m) => m.from === 'host' && !m.read),
      };
    })
    .filter((c): c is Conversation => Boolean(c.listing))
    .sort((a, b) => (b.last?.sentAt ?? b.trip.createdAt) - (a.last?.sentAt ?? a.trip.createdAt));

  if (conversations.length === 0) {
    return (
      <TabScreen title="Messages">
        <EmptyState
          emoji="💬"
          heading="You don’t have any messages"
          body="When you contact a host or send a reservation request, you’ll see your messages here."
          action={{ label: 'Start searching', onPress: () => router.push('/search') }}
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Messages">
      <View>
        {conversations.map((c, index) => (
          <Animated.View key={c.trip.id} entering={FadeInDown.delay(index * 50)}>
            <ConversationRow conversation={c} typing={Boolean(typing[c.trip.id])} />
          </Animated.View>
        ))}
      </View>
    </TabScreen>
  );
}

function ConversationRow({ conversation, typing }: { conversation: Conversation; typing: boolean }) {
  const styles = useStyles();
  const { trip, listing, last, unread } = conversation;
  const preview = typing
    ? `${listing.host.name.split(' ')[0]} is typing…`
    : last
      ? `${last.from === 'guest' ? 'You: ' : ''}${last.text}`
      : 'Say hello to your host';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[tripId]', params: { tripId: trip.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${listing.host.name}${unread ? ', unread' : ''}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{listing.host.name.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={[styles.host, unread && styles.bold]} numberOfLines={1}>
            {listing.host.name}
          </Text>
          <Text style={[styles.time, unread && styles.timeUnread]}>{relativeTime(last?.sentAt ?? trip.createdAt)}</Text>
        </View>
        <Text style={styles.listing} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.previewLine}>
          <Text style={[styles.preview, unread && styles.previewUnread, typing && styles.previewTyping]} numberOfLines={2}>
            {preview}
          </Text>
          {unread && <View style={styles.dot} />}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.onInverse,
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  host: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
  },
  bold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 13,
    color: c.textSecondary,
  },
  timeUnread: {
    color: c.text,
    fontWeight: '600',
  },
  listing: {
    fontSize: 13,
    color: c.textSecondary,
  },
  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
  previewUnread: {
    color: c.text,
    fontWeight: '600',
  },
  previewTyping: {
    fontStyle: 'italic',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.primary,
  },
}));
