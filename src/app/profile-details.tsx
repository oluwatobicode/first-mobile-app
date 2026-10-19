import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaseIcon } from '@solar-icons/react-native/linear/case';
import { ChatRoundLineIcon } from '@solar-icons/react-native/linear/chat-round-line';
import { FormView } from '@/components/form-view';
import { TextField } from '@/components/form/text-field';
import { CheckCircleBoldIcon, HomeIcon, StarBoldIcon } from '@/components/icons';
import { aboutSchema, type AboutForm } from '@/components/profile/schemas';
import { Avatar } from '@/components/profile/settings-ui';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { getListing } from '@/data/listings';
import { useAuth, type User } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useReviews } from '@/hooks/use-reviews';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPTY_ABOUT: AboutForm = { work: '', livesIn: '', languages: 'English', bio: '' };

/** Accounts made in the app have their creation time in the id; the demo account is a few years old. */
function timeOnApp(user: User) {
  const created = user.id.startsWith('user-') ? Number(user.id.slice(5)) : NaN;
  if (!Number.isFinite(created)) return { value: 3, label: 'Years on Airbnb' };
  const months = Math.max(0, Math.floor((Date.now() - created) / (30 * 86_400_000)));
  if (months < 12) return { value: Math.max(1, months), label: months <= 1 ? 'Month on Airbnb' : 'Months on Airbnb' };
  const years = Math.floor(months / 12);
  return { value: years, label: years === 1 ? 'Year on Airbnb' : 'Years on Airbnb' };
}

export default function ProfileDetailsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { trips } = useBooking();
  const { reviews } = useReviews();
  const [about, setAbout] = usePersistedState<AboutForm>(`profile-about:${user?.id ?? 'guest'}`, EMPTY_ABOUT);
  const [editing, setEditing] = useState(false);

  if (!user) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Profile" />
        <View style={styles.signedOut}>
          <Text style={styles.heading}>You’re not logged in</Text>
          <Button label="Log in" onPress={() => router.replace('/login')} />
        </View>
      </View>
    );
  }

  const time = timeOnApp(user);
  const tripCount = trips.filter((t) => t.status !== 'cancelled').length;
  const aboutRows = [
    { Icon: CaseIcon, label: about.work && `My work: ${about.work}` },
    { Icon: HomeIcon, label: about.livesIn && `Lives in ${about.livesIn}` },
    { Icon: ChatRoundLineIcon, label: about.languages && `Speaks ${about.languages}` },
  ].filter((row) => row.label);

  return (
    <View style={styles.screen}>
      <ScreenHeader bordered={false} trailing={<TextLink label="Edit" onPress={() => setEditing(true)} />} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.card}>
          <View style={styles.cardIdentity}>
            <Avatar name={user.firstName} size={104} verified />
            <Text style={styles.name}>{user.firstName}</Text>
            <Text style={styles.role}>Guest</Text>
          </View>
          <View style={styles.cardStats}>
            <Stat value={tripCount} label={tripCount === 1 ? 'Trip' : 'Trips'} />
            <Stat value={reviews.length} label={reviews.length === 1 ? 'Review' : 'Reviews'} />
            <Stat value={time.value} label={time.label} last />
          </View>
        </Animated.View>

        <View style={styles.verifiedRow}>
          <CheckCircleBoldIcon size={22} color={colors.text} />
          <Text style={styles.verifiedText}>Identity verified</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.heading}>About {user.firstName}</Text>
        {aboutRows.length === 0 && !about.bio ? (
          <Text style={styles.muted}>Tell hosts a little about yourself — where you live, what you do and what languages you speak.</Text>
        ) : (
          <View style={{ gap: 16 }}>
            {aboutRows.map((row) => (
              <View key={row.label} style={styles.aboutRow}>
                <row.Icon size={24} color={colors.text} />
                <Text style={styles.aboutText}>{row.label}</Text>
              </View>
            ))}
            {about.bio ? <Text style={styles.bio}>{about.bio}</Text> : null}
          </View>
        )}
        <Pressable
          onPress={() => setEditing(true)}
          style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button">
          <Text style={styles.outlineButtonText}>Edit profile</Text>
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.heading}>{user.firstName}’s reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>Reviews you write after a stay will show up here.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {reviews.map((review) => {
              const listing = getListing(review.listingId);
              const date = new Date(review.createdAt);
              return (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarBoldIcon key={i} size={12} color={i < review.rating ? colors.text : colors.border} />
                    ))}
                  </View>
                  <Text style={styles.reviewText} numberOfLines={4}>
                    “{review.text || 'Great stay.'}”
                  </Text>
                  <Text style={styles.reviewMeta} numberOfLines={1}>
                    {listing?.title ?? 'A stay'} · {MONTHS[date.getMonth()]} {date.getFullYear()}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>

      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
        <EditProfileSheet
          initial={about}
          onClose={() => setEditing(false)}
          onSave={(values) => {
            setAbout(values);
            setEditing(false);
          }}
        />
      </Modal>
    </View>
  );
}

function EditProfileSheet({ initial, onClose, onSave }: { initial: AboutForm; onClose: () => void; onSave: (values: AboutForm) => void }) {
  const styles = useStyles();
  const toast = useToast();
  const { control, handleSubmit, formState } = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });

  const save = handleSubmit((values) => {
    onSave(values);
    toast.show({ message: 'Profile updated' });
  });

  return (
    <FormView>
      <ScreenHeader title="Edit profile" leading="close" onLeadingPress={onClose} safeTop={false} />
      <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sheetIntro}>Hosts and guests can see your profile. Share a little about yourself.</Text>
        <TextField control={control} name="work" label="My work" placeholder="e.g. Product designer" returnKeyType="next" />
        <TextField control={control} name="livesIn" label="Where I live" placeholder="e.g. Lagos, Nigeria" returnKeyType="next" />
        <TextField control={control} name="languages" label="Languages I speak" placeholder="e.g. English, Yoruba" returnKeyType="next" />
        <TextField
          control={control}
          name="bio"
          label="About me"
          placeholder="Tell us about yourself"
          multiline
          style={styles.bioInput}
          helper="Up to 300 characters."
        />
      </ScrollView>
      <FooterBar>
        <TextLink label="Cancel" onPress={onClose} />
        <Button label="Save" tone="dark" disabled={!formState.isDirty} onPress={save} style={{ minWidth: 120 }} />
      </FooterBar>
    </FormView>
  );
}

function Stat({ value, label, last }: { value: number; label: string; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.stat, last && styles.statLast]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  signedOut: {
    padding: 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    boxShadow: `0 6px 24px ${c.shadow}`,
  },
  cardIdentity: {
    flex: 1.3,
    alignItems: 'center',
  },
  name: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: c.text,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  cardStats: {
    flex: 1,
    paddingLeft: 16,
  },
  stat: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  statLast: {
    borderBottomWidth: 0,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: c.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: c.text,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
  },
  verifiedText: {
    fontSize: 16,
    color: c.text,
  },
  divider: {
    height: 0.5,
    backgroundColor: c.border,
    marginVertical: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    marginBottom: 16,
  },
  muted: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aboutText: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  bio: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 24,
    color: c.text,
  },
  outlineButton: {
    alignSelf: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.text,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  review: {
    width: 260,
    padding: 16,
    gap: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: c.border,
    backgroundColor: c.elevated,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 21,
    color: c.text,
  },
  reviewMeta: {
    fontSize: 13,
    color: c.textSecondary,
  },
  sheetContent: {
    padding: 24,
    gap: 16,
  },
  sheetIntro: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
}));
