// App colors. Screens never use hex values for neutrals directly: they read a palette
// through `useTheme()` / `createStyles()` so light and dark mode both work.

const brand = {
  primary: '#FF385C',
  primaryDark: '#D70466',
  /** Pink → magenta used on primary buttons. */
  gradient: 'linear-gradient(90deg, #E61E4D, #D70466)',
  gradientSolid: '#E31C5F',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Palette = {
  light: {
    ...brand,
    background: '#FFFFFF',
    /** Raised cards and floating pills. */
    elevated: '#FFFFFF',
    /** Subtle fills: chips, pressed rows, image placeholders. */
    surface: '#F7F7F7',
    /** Screens with a grey canvas behind white cards (Search). */
    canvas: '#F3F3F3',
    header: '#FBFBFB',
    band: '#EBEBEB',
    text: '#222222',
    textSecondary: '#6A6A6A',
    placeholder: '#B0B0B0',
    border: '#DDDDDD',
    inputBorder: '#B0B0B0',
    disabled: '#DDDDDD',
    disabledText: '#C4C4C4',
    /** Label on a disabled button. */
    onDisabled: '#FFFFFF',
    /** Near-black buttons (Save, Done) and their label. */
    inverse: '#222222',
    onInverse: '#FFFFFF',
    error: '#C13515',
    errorBg: '#FFF8F6',
    /** Round buttons floating over photos. */
    overlayButton: 'rgba(255,255,255,0.95)',
    tabBarFallback: 'rgba(255,255,255,0.92)',
    shadow: 'rgba(0,0,0,0.12)',
  },
  dark: {
    ...brand,
    background: '#121212',
    elevated: '#1F1F1F',
    surface: '#262626',
    canvas: '#0B0B0B',
    header: '#181818',
    band: '#1C1C1C',
    text: '#F7F7F7',
    textSecondary: '#A3A3A3',
    placeholder: '#6E6E6E',
    border: '#333333',
    inputBorder: '#5C5C5C',
    disabled: '#333333',
    disabledText: '#6E6E6E',
    onDisabled: '#7A7A7A',
    inverse: '#F7F7F7',
    onInverse: '#121212',
    error: '#FF7A6B',
    errorBg: '#2A1714',
    overlayButton: 'rgba(30,30,30,0.9)',
    tabBarFallback: 'rgba(28,28,28,0.92)',
    shadow: 'rgba(0,0,0,0.5)',
  },
} as const;

export type Scheme = keyof typeof Palette;
export type ThemeColors = { [K in keyof (typeof Palette)['light']]: string };
