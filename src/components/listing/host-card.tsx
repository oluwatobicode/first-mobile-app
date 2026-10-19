import { CaseIcon } from '@solar-icons/react-native/linear/case';
import { ShieldCheckIcon } from '@solar-icons/react-native/linear/shield-check';
import { StyleSheet, Text, View } from 'react-native';

import { MedalRibbonIcon, StarBoldIcon, Translation2Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { hostDetailsFor } from '@/data/details';
import type { Listing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';

function hostInitial(name: string) {
  return name.split(' ').pop()?.[0] ?? '?';
}

/** Airbnb's "Meet your host" section: the raised profile card, then the details under it. */
export function HostCard({ listing, onMessage }: { listing: Listing; onMessage: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { host } = listing;
  const details = hostDetailsFor(listing);
  const yearsLabel = host.years === 1 ? 'Year hosting' : 'Years hosting';

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.identity}>
          <View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{hostInitial(host.name)}</Text>
            </View>
            {host.superhost && (
              <View style={styles.badge}>
                <MedalRibbonIcon size={14} color={colors.white} strokeWidth={2} />
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {host.name}
          </Text>
          <View style={styles.roleRow}>
            {host.superhost && <MedalRibbonIcon size={14} color={colors.text} />}
            <Text style={styles.role}>{host.superhost ? 'Superhost' : 'Host'}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={String(details.reviews)} label="Reviews" />
          <View style={styles.statRule} />
          <Stat value={listing.rating.toFixed(2)} label="Rating" star />
          <View style={styles.statRule} />
          <Stat value={String(host.years)} label={yearsLabel} />
        </View>
      </View>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <CaseIcon size={22} color={colors.text} />
          <Text style={styles.factText}>My work: {details.work}</Text>
        </View>
        <View style={styles.fact}>
          <Translation2Icon size={22} color={colors.text} />
          <Text style={styles.factText}>Speaks {details.languages.join(' and ')}</Text>
        </View>
      </View>

      <Text style={styles.paragraph}>{details.about}</Text>

      {host.superhost && (
        <>
          <Text style={styles.subTitle}>{host.name} is a Superhost</Text>
          <Text style={styles.paragraph}>
            Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.
          </Text>
        </>
      )}

      <Text style={styles.subTitle}>Host details</Text>
      <Text style={styles.detail}>Response rate: {details.responseRate}%</Text>
      <Text style={styles.detail}>Responds {details.responseTime}</Text>

      <Button label="Message host" tone="dark" onPress={onMessage} style={styles.message} />

      <View style={styles.notice}>
        <ShieldCheckIcon size={22} color={colors.primary} />
        <Text style={styles.noticeText}>
          To help protect your payment, always use Airbnb to send money and communicate with hosts.
        </Text>
      </View>
    </View>
  );
}

function Stat({ value, label, star }: { value: string; label: string; star?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {star && <StarBoldIcon size={13} color={colors.text} />}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: c.elevated,
    boxShadow: `0 6px 20px ${c.shadow}`,
  },
  identity: {
    flex: 1.3,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.onInverse,
    fontSize: 40,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.5,
    marginTop: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  role: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
  },
  stats: {
    flex: 1,
    gap: 10,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: c.text,
  },
  statRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  facts: {
    marginTop: 24,
    gap: 14,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factText: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: c.text,
    marginTop: 18,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    marginTop: 24,
    marginBottom: -8,
  },
  detail: {
    fontSize: 16,
    lineHeight: 24,
    color: c.text,
    marginTop: 8,
  },
  message: {
    alignSelf: 'flex-start',
    marginTop: 24,
  },
  notice: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
  },
}));
