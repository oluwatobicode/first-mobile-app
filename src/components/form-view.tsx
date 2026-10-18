import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Keyboard, Platform, View } from 'react-native';

import { createStyles } from '@/hooks/use-theme';

/**
 * Keeps a form's footer above the keyboard, including inside modals and sheets.
 * React Native's KeyboardAvoidingView measures relative to its parent, which is wrong in a sheet,
 * so instead we measure where our bottom edge is on screen and pad by exactly the overlap.
 */
export function FormView({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    // Android resizes the window for the keyboard on its own (adjustResize), so only iOS needs this.
    if (Platform.OS !== 'ios') return;

    let open = false;
    const show = Keyboard.addListener('keyboardWillShow', (event) => {
      open = true;
      const keyboardTop = event.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _width, height) => {
        // The measurement is async; ignore it if the keyboard closed in the meantime.
        if (open) setInset(Math.max(0, Math.round(y + height - keyboardTop)));
      });
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      open = false;
      setInset(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View ref={ref} style={styles.screen}>
      <View style={[styles.screen, { paddingBottom: inset }]}>{children}</View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
}));
