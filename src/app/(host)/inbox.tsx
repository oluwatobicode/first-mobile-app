import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GUEST_THREADS } from '@/components/host/data';
import { Avatar } from '@/components/profile/settings-ui';
import { TabScreen } from '@/components/tab-screen';
import { getListing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

export default function HostInboxScreen() {
  const styles = useStyles();
  return (
    <TabScreen title="Inbox">
      {GUEST_THREADS.map((thread, i) => {
        const listing = getListing(thread.listingId);
        return (
          <Animated.View key={thread.id} entering={FadeInDown.delay(i * 50)}>
            <Pressable
              onPress={() => Alert.alert(thread.guest, 'Replying to guests is coming soon to hosting mode.')}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={`${thread.guest}${thread.unread ? ', unread' : ''}: ${thread.preview}`}>
              <Avatar name={thread.guest} size={52} />
              <View style={{ flex: 1 }}>
                <View style={styles.topLine}>
                  <Text style={[styles.name, thread.unread && styles.unread]} numberOfLines={1}>
                    {thread.guest}
                  </Text>
                  <Text style={styles.time}>{thread.time}</Text>
                </View>
                <Text style={[styles.preview, thread.unread && styles.previewUnread]} numberOfLines={1}>
                  {thread.preview}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {thread.status} · {listing?.title}
                </Text>
              </View>
              {thread.unread && <View style={styles.dot} />}
            </Pressable>
          </Animated.View>
        );
      })}
    </TabScreen>
  );
}

const useStyles = createStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
  },
  unread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 13,
    color: c.textSecondary,
  },
  preview: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  previewUnread: {
    color: c.text,
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: c.textSecondary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.primary,
  },
}));
