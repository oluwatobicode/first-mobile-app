import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

export function TabScreen({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 32,
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Brand.text,
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
    color: Brand.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Brand.textSecondary,
  },
  button: {
    marginTop: 16,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E31C5F',
    experimental_backgroundImage: 'linear-gradient(90deg, #E61E4D, #D70466)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
