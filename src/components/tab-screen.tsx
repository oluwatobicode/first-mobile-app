import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/glass-tab-bar';
import { createStyles } from '@/hooks/use-theme';

export function TabScreen({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: tabBarSpace + 16,
        paddingHorizontal: 24,
      }}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

type EmptyStateProps = {
  emoji: string;
  heading: string;
  body: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ emoji, heading, body, action }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.body}>{body}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.97 }] }]}>
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
    marginBottom: 28,
  },
  empty: {
    alignItems: 'flex-start',
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  button: {
    marginTop: 16,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.gradientSolid,
    experimental_backgroundImage: c.gradient,
  },
  buttonText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '600',
  },
}));
