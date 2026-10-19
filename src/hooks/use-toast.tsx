import { Image } from 'expo-image';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles } from '@/hooks/use-theme';

export type ToastOptions = {
  message: string;
  /** Small thumbnail on the left, e.g. the listing photo when saving to a wishlist. */
  image?: string;
  action?: { label: string; onPress: () => void };
  /** Lift the toast above floating UI like the tab bar. */
  offset?: number;
  duration?: number;
};

type ToastContextValue = { show: (toast: ToastOptions) => void; hide: () => void };

const ToastContext = createContext<ToastContextValue | null>(null);

/** One toast at a time, shown at the bottom of the screen above everything else. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  };

  const show = (next: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...next, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), next.duration ?? 3500);
  };

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && <ToastView key={toast.key} toast={toast} onAction={hide} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onAction }: { toast: ToastOptions; onAction: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + (toast.offset ?? 0) + 8 }]}
      accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        {toast.image && <Image source={toast.image} style={styles.image} contentFit="cover" />}
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action && (
          <Pressable
            hitSlop={10}
            onPress={() => {
              onAction();
              toast.action?.onPress();
            }}
            accessibilityRole="button">
            <Text style={styles.action}>{toast.action.label}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

const useStyles = createStyles((c) => ({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    boxShadow: `0 8px 28px ${c.shadow}`,
    borderWidth: 0.5,
    borderColor: c.border,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  action: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    textDecorationLine: 'underline',
  },
}));
