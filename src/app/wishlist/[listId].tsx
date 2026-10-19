import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuDotsIcon } from '@solar-icons/react-native/linear/menu-dots';
import { PenIcon } from '@solar-icons/react-native/linear/pen';
import { TrashBinTrashIcon } from '@solar-icons/react-native/linear/trash-bin-trash';

import { HeartButton } from '@/components/heart-button';
import { StarBoldIcon } from '@/components/icons';
import { Button, ScreenHeader } from '@/components/ui';
import { savedCount } from '@/components/wishlist/helpers';
import { WishlistNameFields } from '@/components/wishlist/name-form';
import { cardPriceLabel, getListing, type Listing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist } from '@/hooks/use-wishlist';

const RECENT = 'recent';

export default function WishlistScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { lists, recentlyViewed, renameList, deleteList } = useWishlist();
  const [menu, setMenu] = useState<'closed' | 'actions' | 'rename'>('closed');

  const isRecent = listId === RECENT;
  const list = isRecent ? undefined : lists.find((l) => l.id === listId);
  const name = isRecent ? 'Recently viewed' : (list?.name ?? 'Wishlist');
  const ids = isRecent ? recentlyViewed : (list?.ids ?? []);
  const listings = ids.map(getListing).filter((listing) => listing !== undefined);

  const confirmDelete = () => {
    if (!list) return;
    setMenu('closed');
    Alert.alert('Delete this wishlist?', `“${list.name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteList(list.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        bordered={false}
        trailing={
          list && (
            <Pressable
              onPress={() => setMenu('actions')}
              hitSlop={12}
              style={({ pressed }) => [styles.menuButton, pressed && { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Wishlist options">
              <MenuDotsIcon size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          )
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{name}</Text>
        {listings.length > 0 && (
          <Text style={styles.count}>{isRecent ? `${listings.length} viewed` : savedCount(listings.length)}</Text>
        )}

        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyHeading}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>
              {isRecent ? 'Stays you look at will show up here.' : 'Tap the heart on any stay to save it to this wishlist.'}
            </Text>
            <Button label="Start exploring" tone="dark" onPress={() => router.navigate('/')} style={styles.emptyButton} />
          </View>
        ) : (
          <View style={styles.cards}>
            {listings.map((listing) => (
              <Animated.View key={listing.id} entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
                <SavedCard listing={listing} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {list && (
        <ListMenu
          mode={menu}
          name={list.name}
          onClose={() => setMenu('closed')}
          onRename={() => setMenu('rename')}
          onDelete={confirmDelete}
          onSubmitName={(next) => {
            renameList(list.id, next);
            setMenu('closed');
          }}
        />
      )}
    </View>
  );
}

function SavedCard({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const photoWidth = Math.min(width, 700) - 48;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      style={({ pressed }) => pressed && styles.pressed}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${cardPriceLabel(listing)}`}>
      <View style={[styles.photoWrap, { height: photoWidth * 0.82 }]}>
        <Image source={listing.images[0]} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <View style={styles.heart}>
          <HeartButton listingId={listing.id} size={28} />
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.rating}>
          <StarBoldIcon size={13} color={colors.text} />
          <Text style={styles.ratingText}>
            {listing.rating.toFixed(2).replace(/0$/, '')} ({listing.reviews})
          </Text>
        </View>
      </View>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {listing.details}
      </Text>
      <Text style={styles.cardPrice}>{cardPriceLabel(listing)}</Text>
    </Pressable>
  );
}

type MenuProps = {
  mode: 'closed' | 'actions' | 'rename';
  name: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onSubmitName: (name: string) => void;
};

/** Bottom action sheet for the "⋯" button: Rename (inline form) and Delete. */
function ListMenu({ mode, name, onClose, onRename, onDelete, onSubmitName }: MenuProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={mode !== 'closed'} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.grabber} />
          {mode === 'rename' ? (
            <>
              <Text style={styles.panelTitle}>Rename wishlist</Text>
              <WishlistNameFields defaultName={name} submitLabel="Save" onCancel={onClose} onSubmit={onSubmitName} />
            </>
          ) : (
            <>
              <Text style={styles.panelTitle} numberOfLines={1}>
                {name}
              </Text>
              <MenuRow label="Rename" icon={<PenIcon size={22} color={colors.text} />} onPress={onRename} />
              <MenuRow
                label="Delete wishlist"
                destructive
                icon={<TrashBinTrashIcon size={22} color={colors.error} />}
                onPress={onDelete}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MenuRow({ label, icon, destructive, onPress }: { label: string; icon: ReactNode; destructive?: boolean; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.surface }]}
      accessibilityRole="button">
      {icon}
      <Text style={[styles.menuLabel, destructive && { color: colors.error }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
  },
  count: {
    marginTop: 4,
    fontSize: 15,
    color: c.textSecondary,
  },
  empty: {
    marginTop: 28,
    gap: 8,
    alignItems: 'flex-start',
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  emptyButton: {
    marginTop: 16,
  },
  cards: {
    marginTop: 24,
    gap: 32,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  photoWrap: {
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  heart: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  cardRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    color: c.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 15,
    color: c.textSecondary,
  },
  cardPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    backgroundColor: c.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 4,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.border,
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 56,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: c.text,
  },
}));
